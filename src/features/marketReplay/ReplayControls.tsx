import React from 'react';
import { Play, Pause, SkipForward, Eye, EyeOff } from 'lucide-react';
import type { ReplaySpeed, MotionPreference } from './marketReplayTypes';
import { audioManager } from '../../utils/audioManager';

interface ReplayControlsProps {
  isPlaying: boolean;
  speed: ReplaySpeed;
  showBenchmark: boolean;
  motionPreference: MotionPreference;
  onTogglePlay: () => void;
  onChangeSpeed: (speed: ReplaySpeed) => void;
  onToggleBenchmark: () => void;
  onSkipToEnd: () => void;
  className?: string;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  isPlaying,
  speed,
  showBenchmark,
  onTogglePlay,
  onChangeSpeed,
  onToggleBenchmark,
  onSkipToEnd,
  className = '',
}) => {
  const handlePlayToggle = () => {
    audioManager.playSound('click');
    onTogglePlay();
  };

  const handleSpeedChange = (newSpeed: ReplaySpeed) => {
    audioManager.playSound('click');
    onChangeSpeed(newSpeed);
  };

  const handleBenchmarkToggle = () => {
    audioManager.playSound('click');
    onToggleBenchmark();
  };

  const handleSkip = () => {
    audioManager.playSound('click');
    onSkipToEnd();
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs ${className}`}>
      {/* Play/Pause & Speed Group */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={handlePlayToggle}
          aria-label={isPlaying ? '재생 일시정지' : '시장 재생'}
          className="min-h-[44px] min-w-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 active:translate-y-0.5 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause size={16} />
              <span>일시정지</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>재생</span>
            </>
          )}
        </button>

        {/* Speed Toggle Pills */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {(
            [
              { id: 'CINEMATIC' as const, label: '몰입' },
              { id: 'NORMAL' as const, label: '보통' },
              { id: 'FAST' as const, label: '빠르게' },
            ] as const
          ).map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSpeedChange(s.id)}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                speed === s.id
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Benchmark & Skip Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Benchmark Race Toggle */}
        <button
          type="button"
          onClick={handleBenchmarkToggle}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
            showBenchmark
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {showBenchmark ? <Eye size={15} /> : <EyeOff size={15} />}
          <span>벤치마크: {showBenchmark ? '표시' : '숨김'}</span>
        </button>

        {/* Skip to Year End Button */}
        <button
          type="button"
          onClick={handleSkip}
          className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <SkipForward size={15} />
          <span>연말로 건너뛰기</span>
        </button>
      </div>
    </div>
  );
};
