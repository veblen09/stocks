export type SoundType = 'click' | 'notification' | 'success' | 'error';

export interface AudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
}

const DEFAULT_SETTINGS: AudioSettings = {
  bgmEnabled: false, // 브라우저 자동재생 정책 및 수업 환경 고려 기본 꺼짐
  sfxEnabled: true,
  masterVolume: 0.4, // 40%
  bgmVolume: 0.25,   // 25%
  sfxVolume: 0.45    // 45%
};

let audioCtx: AudioContext | null = null;
let bgmAudio: HTMLAudioElement | null = null;
let currentSettings: AudioSettings = { ...DEFAULT_SETTINGS };

// 클래식 BGM 플레이리스트 (CORS 헤더가 완벽히 대응된 위키미디아 퍼블릭 도메인 파일들)
const bgmPlaylist: string[] = [
  '/audio/bgm-classical-calm.ogg',                                                            // 1. 모차르트 아이네 클라이네 나흐트무지크
  'https://upload.wikimedia.org/wikipedia/commons/8/8f/Fur_Elise.ogg',                        // 2. 베토벤 엘리제를 위하여
  'https://upload.wikimedia.org/wikipedia/commons/2/29/Beethoven_Moonlight_1st_movement.ogg', // 3. 베토벤 월광 소나타 1악장
  'https://upload.wikimedia.org/wikipedia/commons/0/08/Goldberg_Variations_01_Aria.ogg'         // 4. 바흐 골드베르크 변주곡 아리아
];

const bgmNames = [
  '모차르트 - 아이네 클라이네 🎻',
  '베토벤 - 엘리제를 위하여 🎹',
  '베토벤 - 월광 소나타 1악장 🌙',
  '바흐 - 골드베르크 변주곡 아리아 🎹'
];

let currentTrackIndex = 0;
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

// AudioContext 및 BGM 초기화
const initAudio = () => {
  if (!isBrowser || audioCtx) return;

  // 1. AudioContext 생성 (첫 클릭 시)
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioContextClass) {
    audioCtx = new AudioContextClass();
  }

  // 2. BGM HTMLAudioElement 생성
  bgmAudio = new Audio(bgmPlaylist[currentTrackIndex]);
  bgmAudio.loop = false;
  bgmAudio.preload = 'auto';
  
  // 파일이 없거나 네트워크 지연 시 오류 처리
  bgmAudio.addEventListener('error', (e) => {
    console.warn('BGM track failed to load, trying next track.', e);
    setTimeout(() => {
      audioManager.playNextBgm();
    }, 2000);
  });

  // 한 곡 재생 완료 시 자동으로 플레이리스트 내 다음 클래식 곡 재생
  bgmAudio.addEventListener('ended', () => {
    audioManager.playNextBgm();
  });

  // 초기 볼륨 설정
  updateBgmVolume();
};

const updateBgmVolume = () => {
  if (!bgmAudio) return;
  const targetVolume = currentSettings.masterVolume * currentSettings.bgmVolume;
  bgmAudio.volume = Math.max(0, Math.min(1, targetVolume));
};

export const audioManager = {
  // 초기 로드 시 설정값 불러오기
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

  // 특정 인덱스의 클래식 BGM 재생
  playTrack: (index: number) => {
    initAudio();
    if (!bgmAudio) return;

    currentTrackIndex = index % bgmPlaylist.length;
    bgmAudio.src = bgmPlaylist[currentTrackIndex];
    bgmAudio.load();
    currentTrackName = bgmNames[currentTrackIndex];

    updateBgmVolume();
    if (currentSettings.bgmEnabled) {
      bgmAudio.play().catch((err) => {
        console.warn('BGM play blocked:', err);
      });
    }
  },

  // 브라우저 클릭 시 오디오 잠금 해제 (이벤트 발생 시점 호출)
  unlockAudioContext: async () => {
    initAudio();
    
    if (audioCtx && audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch (err) {
        console.warn('Failed to resume AudioContext:', err);
      }
    }

    // BGM 자동재생이 켜져있을 때 재생 시도
    if (currentSettings.bgmEnabled && bgmAudio && bgmAudio.paused) {
      try {
        await bgmAudio.play();
      } catch (err) {
        console.warn('Autoplay BGM failed on unlock:', err);
      }
    }
  },

  // 배경음악 재생
  playBgm: async () => {
    initAudio();
    if (!bgmAudio) return;
    
    // AudioContext 활성화
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
      console.warn('Failed to play BGM (user interaction required):', err);
    }
  },

  // 배경음악 일시정지
  pauseBgm: () => {
    if (bgmAudio) {
      bgmAudio.pause();
    }
  },

  // 다음 배경음악 재생 (플레이리스트 순환)
  playNextBgm: async () => {
    initAudio();
    if (!bgmAudio) return;
    
    currentTrackIndex = (currentTrackIndex + 1) % bgmPlaylist.length;
    bgmAudio.src = bgmPlaylist[currentTrackIndex];
    bgmAudio.load();
    currentTrackName = bgmNames[currentTrackIndex];
    
    if (currentSettings.bgmEnabled) {
      try {
        updateBgmVolume();
        await bgmAudio.play();
      } catch (err) {
        console.warn('Failed to play next BGM track:', err);
      }
    }
  },

  // 설정값 업데이트 및 반영
  setSettings: (newSettings: AudioSettings) => {
    currentSettings = { ...newSettings };
    saveSettings(currentSettings);
    
    // BGM 상태 업데이트
    if (bgmAudio) {
      updateBgmVolume();
      if (currentSettings.bgmEnabled) {
        audioManager.playBgm();
      } else {
        bgmAudio.pause();
      }
    }
  },

  // Web Audio API를 활용한 순수 합성 효과음 재생
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
