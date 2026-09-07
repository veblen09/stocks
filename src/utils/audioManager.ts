/**
 * Web Audio API based UI Sound & Zero-Bandwidth Procedural BGM Engine
 * 머니트랙: 45년 한·미 주식투자 실험실 사운드 시스템
 *
 * 100% Web Audio API procedural synthesis:
 * - 0 Network Requests, 0 KB Server Bandwidth consumption
 * - Instant offline playback, seamless loop, high-fidelity 48kHz audio
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
let bgmGainNode: GainNode | null = null;
let currentSettings: AudioSettings = { ...DEFAULT_SETTINGS };

// Debouncing timestamps to prevent audio duplication (min 40ms)
let lastPlayedSound: { type: string; time: number } = { type: '', time: 0 };

// Note to Frequency mapping
const NOTE_SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

const noteToFreq = (noteStr: string): number => {
  const match = noteStr.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return 440;
  const name = match[1];
  const octave = parseInt(match[2], 10);
  const semi = NOTE_SEMITONES[name] ?? 0;
  const midi = 12 * (octave + 1) + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
};

// Procedural Classical Music Tracks
export interface ClassicalPiece {
  name: string;
  bpm: number;
  steps: { notes: string[]; duration: number; velocity?: number }[];
}

const PIECES: ClassicalPiece[] = [
  // 1. Bach - Prelude in C Major (BWV 846)
  {
    name: "바흐 - 평균율 클라비어 프렐류드 C장조 🎹",
    bpm: 84,
    steps: [
      // Measure 1: C - E - G - C5 - E5
      { notes: ['C3', 'E4', 'G4', 'C5', 'E5'], duration: 0.5, velocity: 0.7 },
      { notes: ['G4', 'C5', 'E5'], duration: 0.5, velocity: 0.5 },
      { notes: ['C3', 'E4', 'G4', 'C5', 'E5'], duration: 0.5, velocity: 0.7 },
      { notes: ['G4', 'C5', 'E5'], duration: 0.5, velocity: 0.5 },
      // Measure 2: D - D4 - A4 - D5 - F5
      { notes: ['D3', 'D4', 'A4', 'D5', 'F5'], duration: 0.5, velocity: 0.7 },
      { notes: ['A4', 'D5', 'F5'], duration: 0.5, velocity: 0.5 },
      { notes: ['D3', 'D4', 'A4', 'D5', 'F5'], duration: 0.5, velocity: 0.7 },
      { notes: ['A4', 'D5', 'F5'], duration: 0.5, velocity: 0.5 },
      // Measure 3: G - D4 - G4 - B4 - F5
      { notes: ['G2', 'D4', 'G4', 'B4', 'F5'], duration: 0.5, velocity: 0.7 },
      { notes: ['G4', 'B4', 'F5'], duration: 0.5, velocity: 0.5 },
      { notes: ['G2', 'D4', 'G4', 'B4', 'F5'], duration: 0.5, velocity: 0.7 },
      { notes: ['G4', 'B4', 'F5'], duration: 0.5, velocity: 0.5 },
      // Measure 4: C - E - G - C5 - E5
      { notes: ['C3', 'E4', 'G4', 'C5', 'E5'], duration: 0.5, velocity: 0.7 },
      { notes: ['G4', 'C5', 'E5'], duration: 0.5, velocity: 0.5 },
      { notes: ['C3', 'E4', 'G4', 'C5', 'E5'], duration: 0.5, velocity: 0.7 },
      { notes: ['G4', 'C5', 'E5'], duration: 0.5, velocity: 0.5 },
      // Measure 5: C - E - A - E5 - A5
      { notes: ['C3', 'E4', 'A4', 'C5', 'E5'], duration: 0.5, velocity: 0.7 },
      { notes: ['A4', 'C5', 'E5'], duration: 0.5, velocity: 0.5 },
      { notes: ['C3', 'E4', 'A4', 'C5', 'E5'], duration: 0.5, velocity: 0.7 },
      { notes: ['A4', 'C5', 'E5'], duration: 0.5, velocity: 0.5 },
      // Measure 6: D - F# - A - D5 - F#5
      { notes: ['D3', 'F#4', 'A4', 'D5', 'F#5'], duration: 0.5, velocity: 0.7 },
      { notes: ['A4', 'D5', 'F#5'], duration: 0.5, velocity: 0.5 },
      { notes: ['D3', 'F#4', 'A4', 'D5', 'F#5'], duration: 0.5, velocity: 0.7 },
      { notes: ['A4', 'D5', 'F#5'], duration: 0.5, velocity: 0.5 },
      // Measure 7: G - D4 - G4 - B4 - D5
      { notes: ['G2', 'D4', 'G4', 'B4', 'D5'], duration: 0.5, velocity: 0.7 },
      { notes: ['G4', 'B4', 'D5'], duration: 0.5, velocity: 0.5 },
      { notes: ['G2', 'D4', 'G4', 'B4', 'D5'], duration: 0.5, velocity: 0.7 },
      { notes: ['G4', 'B4', 'D5'], duration: 0.5, velocity: 0.5 },
      // Measure 8: Resolution C major
      { notes: ['C3', 'G3', 'E4', 'C5'], duration: 1.0, velocity: 0.8 },
      { notes: ['E4', 'G4', 'C5', 'E5'], duration: 1.0, velocity: 0.6 },
    ],
  },
  // 2. Pachelbel - Canon in D Major
  {
    name: "파헬벨 - 캐논 변주곡 (Canon in D) 🎼",
    bpm: 72,
    steps: [
      { notes: ['D3', 'F#4', 'A4', 'D5'], duration: 1.0, velocity: 0.75 },
      { notes: ['A2', 'E4', 'A4', 'C#5'], duration: 1.0, velocity: 0.75 },
      { notes: ['B2', 'D4', 'F#4', 'B4'], duration: 1.0, velocity: 0.75 },
      { notes: ['F#2', 'C#4', 'F#4', 'A4'], duration: 1.0, velocity: 0.75 },
      { notes: ['G2', 'B3', 'D4', 'G4'], duration: 1.0, velocity: 0.75 },
      { notes: ['D2', 'A3', 'D4', 'F#4'], duration: 1.0, velocity: 0.75 },
      { notes: ['G2', 'B3', 'D4', 'G4'], duration: 1.0, velocity: 0.75 },
      { notes: ['A2', 'C#4', 'E4', 'A4'], duration: 1.0, velocity: 0.75 },
      // Melodic arpeggio cycle
      { notes: ['D3', 'A4', 'F#5'], duration: 0.5, velocity: 0.8 },
      { notes: ['F#4', 'D5'], duration: 0.5, velocity: 0.6 },
      { notes: ['A2', 'E5', 'C#5'], duration: 0.5, velocity: 0.8 },
      { notes: ['E4', 'A4'], duration: 0.5, velocity: 0.6 },
      { notes: ['B2', 'F#5', 'D5'], duration: 0.5, velocity: 0.8 },
      { notes: ['D4', 'B4'], duration: 0.5, velocity: 0.6 },
      { notes: ['F#2', 'C#5', 'A4'], duration: 0.5, velocity: 0.8 },
      { notes: ['C#4', 'F#4'], duration: 0.5, velocity: 0.6 },
      { notes: ['G2', 'D5', 'B4'], duration: 0.5, velocity: 0.8 },
      { notes: ['B3', 'G4'], duration: 0.5, velocity: 0.6 },
      { notes: ['D2', 'A4', 'F#4'], duration: 0.5, velocity: 0.8 },
      { notes: ['A3', 'D4'], duration: 0.5, velocity: 0.6 },
      { notes: ['G2', 'B4', 'G4'], duration: 0.5, velocity: 0.8 },
      { notes: ['D4', 'B4'], duration: 0.5, velocity: 0.6 },
      { notes: ['A2', 'C#5', 'E5'], duration: 1.0, velocity: 0.8 },
    ],
  },
  // 3. Erik Satie - Gymnopédie No. 1
  {
    name: "에릭 사티 - 짐노페디 1번 (Gymnopédie No.1) ☕",
    bpm: 60,
    steps: [
      { notes: ['G2'], duration: 1.0, velocity: 0.65 },
      { notes: ['B3', 'D4', 'F#4'], duration: 1.0, velocity: 0.5 },
      { notes: ['B3', 'D4', 'F#4'], duration: 1.0, velocity: 0.5 },
      { notes: ['D2'], duration: 1.0, velocity: 0.65 },
      { notes: ['F#3', 'A3', 'C#4', 'E4'], duration: 1.0, velocity: 0.5 },
      { notes: ['F#3', 'A3', 'C#4', 'E4'], duration: 1.0, velocity: 0.5 },
      // Melody enters
      { notes: ['G2', 'B4'], duration: 1.0, velocity: 0.75 },
      { notes: ['B3', 'D4', 'F#4', 'A4'], duration: 1.0, velocity: 0.6 },
      { notes: ['B3', 'D4', 'F#4', 'G4'], duration: 1.0, velocity: 0.6 },
      { notes: ['D2', 'F#4'], duration: 1.0, velocity: 0.75 },
      { notes: ['F#3', 'A3', 'C#4', 'D4'], duration: 1.0, velocity: 0.55 },
      { notes: ['F#3', 'A3', 'C#4', 'E4'], duration: 1.0, velocity: 0.55 },
      { notes: ['G2', 'B4'], duration: 1.0, velocity: 0.75 },
      { notes: ['B3', 'D4', 'F#4', 'C#5'], duration: 1.0, velocity: 0.65 },
      { notes: ['B3', 'D4', 'F#4', 'B4'], duration: 1.0, velocity: 0.6 },
      { notes: ['D2', 'A4'], duration: 1.5, velocity: 0.7 },
      { notes: ['F#3', 'A3', 'C#4'], duration: 1.5, velocity: 0.5 },
    ],
  },
  // 4. Beethoven - Moonlight Sonata
  {
    name: "베토벤 - 월광 소나타 1악장 (Moonlight Sonata) 🌙",
    bpm: 54,
    steps: [
      { notes: ['C#2', 'G#3', 'C#4', 'E4'], duration: 0.66, velocity: 0.65 },
      { notes: ['G#3', 'C#4', 'E4'], duration: 0.66, velocity: 0.5 },
      { notes: ['G#3', 'C#4', 'E4'], duration: 0.66, velocity: 0.5 },
      { notes: ['C#2', 'G#3', 'C#4', 'E4'], duration: 0.66, velocity: 0.65 },
      { notes: ['G#3', 'C#4', 'E4'], duration: 0.66, velocity: 0.5 },
      { notes: ['G#3', 'C#4', 'E4'], duration: 0.66, velocity: 0.5 },
      // B bass
      { notes: ['B1', 'G#3', 'C#4', 'E4'], duration: 0.66, velocity: 0.65 },
      { notes: ['G#3', 'C#4', 'E4'], duration: 0.66, velocity: 0.5 },
      { notes: ['G#3', 'C#4', 'E4'], duration: 0.66, velocity: 0.5 },
      // A bass with G# melody
      { notes: ['A1', 'A3', 'C#4', 'E4', 'G#4'], duration: 1.0, velocity: 0.75 },
      { notes: ['A3', 'C#4', 'E4', 'G#4'], duration: 0.5, velocity: 0.6 },
      { notes: ['F#1', 'A3', 'D4', 'F#4'], duration: 1.0, velocity: 0.7 },
      { notes: ['G#1', 'G#3', 'C#4', 'E4'], duration: 1.0, velocity: 0.75 },
    ],
  },
  // 5. Mozart - Twinkle Variations & Sonata Theme
  {
    name: "모차르트 - 작은별 변주곡 & 소나타 테마 ✨",
    bpm: 96,
    steps: [
      { notes: ['C3', 'C4'], duration: 0.5, velocity: 0.75 },
      { notes: ['C4'], duration: 0.5, velocity: 0.65 },
      { notes: ['G2', 'G4'], duration: 0.5, velocity: 0.75 },
      { notes: ['G4'], duration: 0.5, velocity: 0.65 },
      { notes: ['A2', 'A4'], duration: 0.5, velocity: 0.75 },
      { notes: ['A4'], duration: 0.5, velocity: 0.65 },
      { notes: ['G2', 'E4', 'G4'], duration: 1.0, velocity: 0.75 },
      { notes: ['F2', 'F4'], duration: 0.5, velocity: 0.75 },
      { notes: ['F4'], duration: 0.5, velocity: 0.65 },
      { notes: ['E2', 'E4'], duration: 0.5, velocity: 0.75 },
      { notes: ['E4'], duration: 0.5, velocity: 0.65 },
      { notes: ['D2', 'D4'], duration: 0.5, velocity: 0.75 },
      { notes: ['D4'], duration: 0.5, velocity: 0.65 },
      { notes: ['C2', 'E4', 'C4'], duration: 1.0, velocity: 0.8 },
    ],
  },
  // 6. Vivaldi - Four Seasons 'Spring'
  {
    name: "비발디 - 사계 중 '봄' (Spring Allegro) 🎻",
    bpm: 108,
    steps: [
      { notes: ['E3', 'E4', 'G#4', 'B4', 'E5'], duration: 0.5, velocity: 0.8 },
      { notes: ['G#4', 'B4', 'E5'], duration: 0.5, velocity: 0.6 },
      { notes: ['G#4', 'B4', 'E5'], duration: 0.5, velocity: 0.6 },
      { notes: ['B2', 'F#4', 'A4', 'D#5'], duration: 0.5, velocity: 0.75 },
      { notes: ['E3', 'E4', 'G#4', 'B4', 'E5'], duration: 1.0, velocity: 0.8 },
      { notes: ['B2', 'D#4', 'F#4', 'B4'], duration: 0.5, velocity: 0.75 },
      { notes: ['C#3', 'E4', 'G#4', 'C#5'], duration: 0.5, velocity: 0.75 },
      { notes: ['B2', 'D#4', 'F#4', 'B4'], duration: 1.0, velocity: 0.8 },
      { notes: ['E3', 'E4', 'G#4', 'B4'], duration: 1.0, velocity: 0.85 },
    ],
  },
];

const bgmNames = PIECES.map(p => p.name);
let currentTrackIndex = 0;
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

const getBgmGainNode = (ctx: AudioContext): GainNode => {
  if (!bgmGainNode) {
    bgmGainNode = ctx.createGain();
    bgmGainNode.connect(ctx.destination);
  }
  updateBgmVolume();
  return bgmGainNode;
};

const updateBgmVolume = () => {
  if (bgmGainNode && audioCtx) {
    const targetVol = currentSettings.bgmEnabled
      ? Math.max(0, Math.min(1, currentSettings.masterVolume * currentSettings.bgmVolume))
      : 0;
    bgmGainNode.gain.setValueAtTime(targetVol, audioCtx.currentTime);
  }
};

// Procedural synthesizer note playback (warm piano/bell tone)
const playSynthChord = (
  ctx: AudioContext,
  destGain: GainNode,
  notes: string[],
  startTime: number,
  durationSec: number,
  velocity: number = 0.7
) => {
  notes.forEach((noteStr, idx) => {
    const freq = noteToFreq(noteStr);
    if (!freq || freq <= 0) return;

    // Dual-oscillator for warmth (Sine + Triangle with subtle detune)
    const oscSine = ctx.createOscillator();
    const oscTri = ctx.createOscillator();
    const noteGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscSine.type = 'sine';
    oscSine.frequency.setValueAtTime(freq, startTime);

    oscTri.type = 'triangle';
    oscTri.frequency.setValueAtTime(freq * 1.002, startTime); // +0.2% subtle chorus detune

    // Warm resonant lowpass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(3200, freq * 3.5), startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.min(1200, freq * 1.5), startTime + durationSec);
    filter.Q.setValueAtTime(1.2, startTime);

    // ADSR Envelope
    const noteVol = 0.12 * velocity * (idx === 0 ? 1.0 : 0.85);
    const attack = 0.012;
    const decay = Math.min(durationSec * 0.7, 0.45);
    const release = Math.max(0.25, durationSec * 0.9);

    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(noteVol, startTime + attack);
    noteGain.gain.exponentialRampToValueAtTime(noteVol * 0.45, startTime + attack + decay);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay + release);

    oscSine.connect(filter);
    oscTri.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(destGain);

    const stopTime = startTime + attack + decay + release + 0.05;
    oscSine.start(startTime);
    oscTri.start(startTime);
    oscSine.stop(stopTime);
    oscTri.stop(stopTime);
  });
};

// Scheduler for procedural music playback
let isPlayingProcedural = false;
let currentStepIndex = 0;
let nextNoteTime = 0;
let scheduleTimerId: number | null = null;

const scheduleProceduralBgm = () => {
  if (!isPlayingProcedural || !currentSettings.bgmEnabled) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') {
    scheduleTimerId = window.setTimeout(scheduleProceduralBgm, 200);
    return;
  }

  const piece = PIECES[currentTrackIndex % PIECES.length];
  const dest = getBgmGainNode(ctx);
  const secondsPerBeat = 60 / piece.bpm;

  // Schedule up to 0.6 seconds ahead
  while (nextNoteTime < ctx.currentTime + 0.6 && isPlayingProcedural) {
    const step = piece.steps[currentStepIndex];
    if (step && step.notes.length > 0) {
      const stepDurationSec = step.duration * secondsPerBeat;
      playSynthChord(ctx, dest, step.notes, nextNoteTime, stepDurationSec, step.velocity || 0.7);
      nextNoteTime += stepDurationSec;
    } else {
      nextNoteTime += 0.5 * secondsPerBeat;
    }

    currentStepIndex = (currentStepIndex + 1) % piece.steps.length;
  }

  scheduleTimerId = window.setTimeout(scheduleProceduralBgm, 120);
};

const startProceduralBgm = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (scheduleTimerId !== null) {
    clearTimeout(scheduleTimerId);
    scheduleTimerId = null;
  }

  isPlayingProcedural = true;
  currentStepIndex = 0;
  nextNoteTime = ctx.currentTime + 0.05;
  updateBgmVolume();
  scheduleProceduralBgm();
};

const stopProceduralBgm = () => {
  isPlayingProcedural = false;
  if (scheduleTimerId !== null) {
    clearTimeout(scheduleTimerId);
    scheduleTimerId = null;
  }
  updateBgmVolume();
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
    if (!isBrowser) return;
    getAudioContext();
  },
  getSettings: (): AudioSettings => ({ ...currentSettings }),
  getBgmPlaylist: () => [...bgmNames],
  getTrackList: () => [...bgmNames],
  getCurrentTrackName: () => currentTrackName,
  getTrackName: () => currentTrackName,
  getCurrentTrackIndex: () => currentTrackIndex,

  playTrack: (index: number) => {
    currentTrackIndex = index % PIECES.length;
    currentTrackName = PIECES[currentTrackIndex].name;
    if (currentSettings.bgmEnabled) {
      startProceduralBgm();
    }
  },

  unlockAudioContext: async () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }

    if (currentSettings.bgmEnabled && !isPlayingProcedural) {
      startProceduralBgm();
    }
  },

  playBgm: async () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }
    startProceduralBgm();
  },

  pauseBgm: () => {
    stopProceduralBgm();
  },

  playNextBgm: async () => {
    currentTrackIndex = (currentTrackIndex + 1) % PIECES.length;
    currentTrackName = PIECES[currentTrackIndex].name;
    if (currentSettings.bgmEnabled) {
      startProceduralBgm();
    }
  },

  setSettings: (newSettings: AudioSettings) => {
    const wasEnabled = currentSettings.bgmEnabled;
    currentSettings = { ...newSettings };
    saveSettings(currentSettings);

    updateBgmVolume();

    if (currentSettings.bgmEnabled && !wasEnabled) {
      startProceduralBgm();
    } else if (!currentSettings.bgmEnabled && wasEnabled) {
      stopProceduralBgm();
    }
  },

  /**
   * Synthesize mechanical keycap and UI sounds using Web Audio API (0 Network Bandwidth)
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
