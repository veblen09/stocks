export type SoundType = 'click' | 'notification' | 'success' | 'error';

export interface AudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
}

const DEFAULT_SETTINGS: AudioSettings = {
  bgmEnabled: false, // 브라우저 자동재생 정책 고려 기본 꺼짐
  sfxEnabled: true,
  masterVolume: 0.4, // 40%
  bgmVolume: 0.25,   // 25%
  sfxVolume: 0.45    // 45%
};

let audioCtx: AudioContext | null = null;
let bgmAudio: HTMLAudioElement | null = null;
let currentSettings: AudioSettings = { ...DEFAULT_SETTINGS };

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
      'audio/bgm-classical-calm.ogg'
    ]
  },
  {
    name: '요한 슈트라우스 - 라데츠키 행진곡 🥁🎺',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/b/b4/Radetzky_March.ogg',
      './audio/bgm-classical-calm.ogg',
      'audio/bgm-classical-calm.ogg'
    ]
  },
  {
    name: '차이코프스키 - 피아노 협주곡 1번 (Allegro) 🎹',
    urls: [
      './audio/bgm-nutcracker.ogg',
      './public/audio/bgm-nutcracker.ogg',
      'audio/bgm-nutcracker.ogg',
      'public/audio/bgm-nutcracker.ogg',
      'https://upload.wikimedia.org/wikipedia/commons/6/6c/Tchaikovsky--PianoConcerto1.ogg'
    ]
  },
  {
    name: '모차르트 - 아이네 클라이네 나흐트무지크 (Allegro) 🎻',
    urls: [
      './audio/bgm-classical-calm.ogg',
      './public/audio/bgm-classical-calm.ogg',
      'audio/bgm-classical-calm.ogg',
      'https://upload.wikimedia.org/wikipedia/commons/e/e0/Mozart_-_Eine_kleine_Nachtmusik_-_1._Allegro.ogg'
    ]
  },
  {
    name: '베토벤 - 엘리제를 위하여 🎹',
    urls: [
      './audio/bgm-furelise.ogg',
      './public/audio/bgm-furelise.ogg',
      'audio/bgm-furelise.ogg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8f/Fur_Elise.ogg'
    ]
  },
  {
    name: '바흐 - 골드베르크 변주곡 아리아 🎼',
    urls: [
      './audio/bgm-goldberg.ogg',
      './public/audio/bgm-goldberg.ogg',
      'audio/bgm-goldberg.ogg',
      './audio/bgm-classical-calm.ogg'
    ]
  }
];

const bgmNames = bgmPlaylist.map(track => track.name);

let currentTrackIndex = 0;
let currentCandidateIndex = 0;
let currentTrackName = bgmNames[0];

// 브라우저 환경인지 확인 (SSR 방지)
const isBrowser = typeof window !== 'undefined';

// 로컬스토리지에서 오디오 설정 불러오기
const loadSettings = (): AudioSettings => {
  if (!isBrowser) return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('money_track_audio_settings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error('Failed to load audio settings:', err);
  }
  return DEFAULT_SETTINGS;
};

// 로컬스토리지에 오디오 설정 저장하기
const saveSettings = (settings: AudioSettings) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem('money_track_audio_settings', JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save audio settings:', err);
  }
};

const updateBgmVolume = () => {
  if (!bgmAudio) return;
  const targetVolume = currentSettings.masterVolume * currentSettings.bgmVolume;
  bgmAudio.volume = Math.max(0, Math.min(1, targetVolume));
};

const loadCurrentTrackCandidate = () => {
  if (!bgmAudio) return;
  const track = bgmPlaylist[currentTrackIndex];
  if (!track || !track.urls.length) return;

  const url = track.urls[currentCandidateIndex % track.urls.length];
  bgmAudio.src = url;
  bgmAudio.load();
};

// AudioContext 및 HTMLAudioElement 초기화
const initAudio = () => {
  if (!isBrowser) return;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (!bgmAudio) {
    bgmAudio = new Audio();
    bgmAudio.loop = false;
    bgmAudio.preload = 'auto';

    // 파일 로드 실패 시 다음 후보 URL로 자동 전환
    bgmAudio.addEventListener('error', () => {
      console.warn(`BGM candidate failed to load. Trying next candidate.`);
      if (!bgmAudio) return;
      const track = bgmPlaylist[currentTrackIndex];
      if (track && currentCandidateIndex < track.urls.length - 1) {
        currentCandidateIndex++;
        loadCurrentTrackCandidate();
        if (currentSettings.bgmEnabled) {
          bgmAudio.play().catch(() => {});
        }
      } else {
        // 다음 트랙으로 이동
        setTimeout(() => {
          audioManager.playNextBgm();
        }, 1000);
      }
    });

    // 한 곡 마치면 자동으로 다음 곡 재생
    bgmAudio.addEventListener('ended', () => {
      audioManager.playNextBgm();
    });

    // 초기 트랙 설정
    loadCurrentTrackCandidate();
    updateBgmVolume();
  }
};

export const audioManager = {
  init: () => {
    currentSettings = loadSettings();
  },

  getSettings: (): AudioSettings => {
    return currentSettings;
  },

  getTrackName: (): string => {
    return currentTrackName;
  },

  getCurrentTrackIndex: (): number => {
    return currentTrackIndex;
  },

  getTrackList: (): string[] => {
    return bgmNames;
  },

  // 특정 인덱스의 클래식 BGM 트랙 변경 및 즉시 재생
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
      bgmAudio.play().catch((err) => {
        console.warn('BGM play blocked by browser policy:', err);
      });
    }
  },

  unlockAudioContext: async () => {
    initAudio();

    if (audioCtx && audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch (err) {
        console.warn('Failed to resume AudioContext:', err);
      }
    }

    if (currentSettings.bgmEnabled && bgmAudio && bgmAudio.paused) {
      try {
        updateBgmVolume();
        await bgmAudio.play();
      } catch (err) {
        console.warn('Autoplay BGM failed on unlock:', err);
      }
    }
  },

  playBgm: async () => {
    initAudio();
    if (!bgmAudio) return;

    if (audioCtx && audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch (e) {
        console.warn(e);
      }
    }

    try {
      updateBgmVolume();
      await bgmAudio.play();
    } catch (err) {
      console.warn('Failed to play BGM:', err);
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
      } catch (err) {
        console.warn('Failed to play next BGM track:', err);
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

  playSound: (type: SoundType) => {
    if (!currentSettings.sfxEnabled) return;

    initAudio();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const sfxVolumeNode = audioCtx.createGain();
    const finalSfxVolume = currentSettings.masterVolume * currentSettings.sfxVolume;
    sfxVolumeNode.gain.setValueAtTime(finalSfxVolume, audioCtx.currentTime);
    sfxVolumeNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(sfxVolumeNode);

      osc.start(now);
      osc.stop(now + 0.04);
    } 
    else if (type === 'notification') {
      const playChime = (freq: number, startTime: number, duration: number) => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(sfxVolumeNode);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      playChime(523.25, now, 0.15);        // C5
      playChime(659.25, now + 0.08, 0.2); // E5
      playChime(783.99, now + 0.16, 0.3); // G5
    } 
    else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        const noteStart = now + (index * 0.08);
        const duration = index === 3 ? 0.8 : 0.4;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        const vol = index === 3 ? 0.18 : 0.12;
        gain.gain.setValueAtTime(vol, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + duration);

        osc.connect(gain);
        gain.connect(sfxVolumeNode);

        osc.start(noteStart);
        osc.stop(noteStart + duration);
      });
    }
    else if (type === 'error') {
      const playWarmBuzz = (freq: number, startTime: number, duration: number) => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq - 20, startTime + duration);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(sfxVolumeNode);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      playWarmBuzz(220, now, 0.15); // A3
      playWarmBuzz(220, now + 0.12, 0.2); // A3 double play
    }
  }
};

