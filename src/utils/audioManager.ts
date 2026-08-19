/**
 * Web Audio API based UI Sound & BGM Engine
 * 머니트랙: 45년 한·미 주식투자 실험실 사운드 시스템
 */

export type UiSoundType =
  | 'keyTap'
  | 'tileOpen'
  | 'filter'
  | 'tab'
  | 'allocationUp'
  | 'allocationDown'
  | 'modalOpen'
  | 'modalClose'
  | 'confirm'
  | 'notification'
  | 'success'
  | 'error'
  | 'warningLevel'
  | 'crisisAlert'
  | 'replayYearStart'
  | 'replayNewHigh'
  | 'replayYearComplete';

// Legacy compatibility
export type SoundType = 'click' | 'notification' | 'success' | 'error' | 'warningLevel' | 'crisisAlert' | UiSoundType;

export interface AudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
}

const DEFAULT_SETTINGS: AudioSettings = {
  bgmEnabled: false,
  sfxEnabled: true,
  masterVolume: 0.4,
  bgmVolume: 0.25,
  sfxVolume: 0.45,
};

let audioCtx: AudioContext | null = null;
let bgmAudio: HTMLAudioElement | null = null;
let currentSettings: AudioSettings = { ...DEFAULT_SETTINGS };

// Debouncing timestamps to prevent audio duplication (min 40ms)
let lastPlayedSound: { type: string; time: number } = { type: '', time: 0 };

export interface ClassicalTrack {
  name: string;
  urls: string[];
}

const bgmPlaylist: ClassicalTrack[] = [
  {
    name: '비발디 - 사계 중 \'봄\' 1악장 (Allegro) 🎻',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/f/ff/Vivaldi_-_Four_Seasons_1_Spring_mvt_1_Allegro_-_John_Harrison_violin.oga',
      './audio/bgm-classical-calm.ogg',
      'audio/bgm-classical-calm.ogg',
    ],
  },
  {
    name: '요한 슈트라우스 - 라데츠키 행진곡 🥁🎺',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/b/b4/Radetzky_March.ogg',
      './audio/bgm-classical-calm.ogg',
      'audio/bgm-classical-calm.ogg',
    ],
  },
  {
    name: '차이코프스키 - 피아노 협주곡 1번 (Allegro) 🎹',
    urls: [
      './audio/bgm-nutcracker.ogg',
      'https://upload.wikimedia.org/wikipedia/commons/6/6c/Tchaikovsky--PianoConcerto1.ogg',
    ],
  },
  {
    name: '모차르트 - 아이네 클라이네 나흐트무지크 (Allegro) 🎻',
    urls: [
      './audio/bgm-classical-calm.ogg',
      'https://upload.wikimedia.org/wikipedia/commons/e/e0/Mozart_-_Eine_kleine_Nachtmusik_-_1._Allegro.ogg',
    ],
  },
  {
    name: '베토벤 - 엘리제를 위하여 🎹',
    urls: [
      './audio/bgm-furelise.ogg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8f/Fur_Elise.ogg',
    ],
  },
  {
    name: '바흐 - 골드베르크 변주곡 아리아 🎼',
    urls: [
      './audio/bgm-goldberg.ogg',
      './audio/bgm-classical-calm.ogg',
    ],
  },
];

const bgmNames = bgmPlaylist.map(track => track.name);
let currentTrackIndex = 0;
let currentCandidateIndex = 0;
let currentTrackName = bgmNames[0];

const isBrowser = typeof window !== 'undefined';

// Load settings from localStorage
const loadSettings = (): AudioSettings => {
  if (!isBrowser) return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('money_track_audio_settings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
};

// Save settings to localStorage
const saveSettings = (settings: AudioSettings) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem('money_track_audio_settings', JSON.stringify(settings));
  } catch {
    // ignore
  }
};

currentSettings = loadSettings();

const getAudioContext = (): AudioContext | null => {
  if (!isBrowser) return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

const loadCurrentTrackCandidate = () => {
  if (!bgmAudio) return;
  const track = bgmPlaylist[currentTrackIndex];
  if (!track || !track.urls || track.urls.length === 0) return;

  const candidateUrl = track.urls[currentCandidateIndex % track.urls.length];
  bgmAudio.src = candidateUrl;
  bgmAudio.load();
};

const initAudio = () => {
  if (!isBrowser) return;
  getAudioContext();

  if (!bgmAudio) {
    bgmAudio = new Audio();
    bgmAudio.loop = false;

    bgmAudio.addEventListener('ended', () => {
      audioManager.playNextBgm();
    });

    bgmAudio.addEventListener('error', () => {
      const track = bgmPlaylist[currentTrackIndex];
      if (track && currentCandidateIndex + 1 < track.urls.length) {
        currentCandidateIndex += 1;
        loadCurrentTrackCandidate();
        if (currentSettings.bgmEnabled) {
          bgmAudio?.play().catch(() => {});
        }
      } else {
        currentCandidateIndex = 0;
        currentTrackIndex = (currentTrackIndex + 1) % bgmPlaylist.length;
        currentTrackName = bgmPlaylist[currentTrackIndex].name;
        loadCurrentTrackCandidate();
        if (currentSettings.bgmEnabled) {
          bgmAudio?.play().catch(() => {});
        }
      }
    });

    loadCurrentTrackCandidate();
    updateBgmVolume();
  }
};

const updateBgmVolume = () => {
  if (bgmAudio) {
    bgmAudio.volume = Math.max(0, Math.min(1, currentSettings.masterVolume * currentSettings.bgmVolume));
  }
};

// Generate mechanical noise burst buffer (for keycap thock/click)
let cachedNoiseBuffer: AudioBuffer | null = null;
const getNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  if (!cachedNoiseBuffer || cachedNoiseBuffer.sampleRate !== ctx.sampleRate) {
    const bufferSize = Math.floor(ctx.sampleRate * 0.03); // 30ms
    cachedNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = cachedNoiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.006));
    }
  }
  return cachedNoiseBuffer;
};

export const audioManager = {
  init: () => {
    initAudio();
  },
  getSettings: (): AudioSettings => ({ ...currentSettings }),
  getBgmPlaylist: () => [...bgmNames],
  getTrackList: () => [...bgmNames],
  getCurrentTrackName: () => currentTrackName,
  getTrackName: () => currentTrackName,
  getCurrentTrackIndex: () => currentTrackIndex,



  playTrack: (index: number) => {
    initAudio();
    if (!bgmAudio) return;

    currentTrackIndex = index % bgmPlaylist.length;
    currentCandidateIndex = 0;
    const track = bgmPlaylist[currentTrackIndex];
    currentTrackName = track.name;
    loadCurrentTrackCandidate();

    updateBgmVolume();
    if (currentSettings.bgmEnabled) {
      bgmAudio.play().catch(() => {});
    }
  },

  unlockAudioContext: async () => {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch {
        // ignore
      }
    }

    if (currentSettings.bgmEnabled && bgmAudio && bgmAudio.paused) {
      try {
        updateBgmVolume();
        await bgmAudio.play();
      } catch {
        // ignore
      }
    }
  },

  playBgm: async () => {
    initAudio();
    if (!bgmAudio) return;

    if (audioCtx && audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch {
        // ignore
      }
    }

    try {
      updateBgmVolume();
      await bgmAudio.play();
    } catch {
      // ignore
    }
  },

  pauseBgm: () => {
    if (bgmAudio) {
      bgmAudio.pause();
    }
  },

  playNextBgm: async () => {
    initAudio();
    if (!bgmAudio) return;

    currentTrackIndex = (currentTrackIndex + 1) % bgmPlaylist.length;
    currentCandidateIndex = 0;
    const track = bgmPlaylist[currentTrackIndex];
    currentTrackName = track.name;
    loadCurrentTrackCandidate();

    if (currentSettings.bgmEnabled) {
      try {
        updateBgmVolume();
        await bgmAudio.play();
      } catch {
        // ignore
      }
    }
  },

  setSettings: (newSettings: AudioSettings) => {
    currentSettings = { ...newSettings };
    saveSettings(currentSettings);

    if (bgmAudio) {
      updateBgmVolume();
      if (currentSettings.bgmEnabled) {
        if (bgmAudio.paused) {
          audioManager.playBgm();
        }
      } else {
        bgmAudio.pause();
      }
    }
  },

  /**
   * Synthesize mechanical keycap and UI sounds using Web Audio API
   */
  playUiSound: (type: UiSoundType, options?: { pitchVariation?: number; intensity?: number }) => {
    if (!currentSettings.sfxEnabled) return;

    const nowMs = Date.now();
    // Throttle exact same sound within 45ms to avoid overlapping double-fires
    if (lastPlayedSound.type === type && nowMs - lastPlayedSound.time < 45) {
      return;
    }
    lastPlayedSound = { type, time: nowMs };

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const sfxGain = ctx.createGain();
    const finalVolume = currentSettings.masterVolume * currentSettings.sfxVolume * (options?.intensity || 1.0);
    sfxGain.gain.setValueAtTime(finalVolume, now);
    sfxGain.connect(ctx.destination);

    const pitchMod = options?.pitchVariation || 1.0;

    switch (type) {
      // 1. Mechanical Keycap Tap (Short crisp 35ms thock)
      case 'keyTap': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(950 * pitchMod, now);
        osc.frequency.exponentialRampToValueAtTime(320 * pitchMod, now + 0.035);

        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.035);

        // Click transient noise
        try {
          const noise = ctx.createBufferSource();
          noise.buffer = getNoiseBuffer(ctx);
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(2400, now);
          noiseFilter.Q.setValueAtTime(1.8, now);

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.12, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(sfxGain);
          noise.start(now);
          noise.stop(now + 0.025);
        } catch {
          // ignore
        }
        break;
      }

      // 2. Open Tile / Company Detail (Bright 50ms pop-ting)
      case 'tileOpen': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700 * pitchMod, now);
        osc.frequency.exponentialRampToValueAtTime(1280 * pitchMod, now + 0.05);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      // 3. Filter Toggle (Snappy 30ms tick)
      case 'filter': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620 * pitchMod, now);
        osc.frequency.exponentialRampToValueAtTime(840 * pitchMod, now + 0.03);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }

      // 4. Tab Switch (Soft 25ms tick)
      case 'tab': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880 * pitchMod, now);
        osc.frequency.exponentialRampToValueAtTime(600 * pitchMod, now + 0.025);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.025);
        break;
      }

      // 5. Allocation Step Up (Ascending 40ms click)
      case 'allocationUp': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750 * pitchMod, now);
        osc.frequency.exponentialRampToValueAtTime(1150 * pitchMod, now + 0.04);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      // 6. Allocation Step Down (Descending 40ms click)
      case 'allocationDown': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1050 * pitchMod, now);
        osc.frequency.exponentialRampToValueAtTime(620 * pitchMod, now + 0.04);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      // 7. Modal Open (Two-tone opening chime)
      case 'modalOpen': {
        [523.25, 659.25].forEach((freq, idx) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.04;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.12, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.06);

          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(noteStart);
          osc.stop(noteStart + 0.06);
        });
        break;
      }

      // 8. Modal Close (Soft closing pop)
      case 'modalClose': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.045);
        break;
      }

      // 9. Confirm / Review (Bright 2-tone chime)
      case 'confirm': {
        [587.33, 880].forEach((freq, idx) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.035;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.15, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.07);

          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(noteStart);
          osc.stop(noteStart + 0.07);
        });
        break;
      }

      // 10. Notification Chime
      case 'notification': {
        [880, 1174.66].forEach((freq, idx) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.05;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.12, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.09);

          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(noteStart);
          osc.stop(noteStart + 0.09);
        });
        break;
      }

      // 11. Success Triad (Major ascending arpeggio)
      case 'success': {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.045;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.15, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.10);

          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(noteStart);
          osc.stop(noteStart + 0.10);
        });
        break;
      }

      // 12. Error Tone (Soft 2-tone minor descent)
      case 'error': {
        [440, 311.13].forEach((freq, idx) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.055;
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.08, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.09);

          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(noteStart);
          osc.stop(noteStart + 0.09);
        });
        break;
      }

      // 13. Risk Warning Level Transition (Low-mid subtle chime)
      case 'warningLevel': {
        [329.63, 261.63].forEach((freq, idx) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.08;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.12, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.14);

          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(noteStart);
          osc.stop(noteStart + 0.14);
        });
        break;
      }

      // 14. Crisis Alert Tension Pulse (Low-frequency resonant tone)
      case 'crisisAlert': {
        [185.0, 130.81].forEach((freq, idx) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.12;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.20, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);

          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(noteStart);
          osc.stop(noteStart + 0.22);
        });
        break;
      }

      // 15. Replay Year Start Chime (Warm A-major triad)
      case 'replayYearStart': {
        [440.0, 554.37, 659.25].forEach((freq, idx) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.04;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.12, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.18);

          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(noteStart);
          osc.stop(noteStart + 0.18);
        });
        break;
      }

      // 16. Replay New High Chime (Bright crystalline bell)
      case 'replayNewHigh': {
        [1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.035;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.10, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.12);

          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(noteStart);
          osc.stop(noteStart + 0.12);
        });
        break;
      }

      // 17. Replay Year Complete (Grand 4-note resolution)
      case 'replayYearComplete': {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.05;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.14, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(noteStart);
          osc.stop(noteStart + 0.25);
        });
        break;
      }
    }
  },

  // Legacy fallback
  playSound: (type: SoundType) => {
    if (type === 'click') {
      audioManager.playUiSound('keyTap');
    } else if (type === 'notification') {
      audioManager.playUiSound('notification');
    } else if (type === 'success') {
      audioManager.playUiSound('success');
    } else if (type === 'error') {
      audioManager.playUiSound('error');
    } else {
      audioManager.playUiSound(type as UiSoundType);
    }
  },
};
