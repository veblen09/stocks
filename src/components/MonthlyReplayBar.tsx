import React from 'react';
import { Play, Pause, SkipForward, CheckCircle2 } from 'lucide-react';
import type { MonthlyReplayQuality, MonthlyReplaySpeed, RiskLevel } from '../types/stockGame';
import { formatKRW, formatPercent } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';

interface MonthlyReplayBarProps {
  currentMonth: number;
  totalMonths: number;
  year: number;
  portfolioValueKRW: number;
  ytdReturn: number;
  drawdownFromPeak: number;
  riskLevel: RiskLevel;
  quality: MonthlyReplayQuality;
  isPlaying: boolean;
  speed: MonthlyReplaySpeed;
  onTogglePlay: () => void;
  onChangeSpeed: (speed: MonthlyReplaySpeed) => void;
  onSkipToEnd: () => void;
}

export const MonthlyReplayBar: React.FC<MonthlyReplayBarProps> = ({
  currentMonth,
  totalMonths = 12,
  year,
  portfolioValueKRW,
  ytdReturn,
  drawdownFromPeak,
  riskLevel,
  quality,
  isPlaying,
  speed,
  onTogglePlay,
  onChangeSpeed,
  onSkipToEnd,
}) => {
  const progressPercent = Math.min(100, Math.round((currentMonth / totalMonths) * 100));

  const getRiskBadge = () => {
    switch (riskLevel) {
      case 'EXTREME':
        return { label: '🔴 극심한 위기', bg: 'bg-rose-600 text-white animate-pulse' };
      case 'CRISIS':
        return { label: '🔴 위기', bg: 'bg-rose-500 text-white' };
      case 'WARNING':
        return { label: '🟠 경계', bg: 'bg-amber-500 text-white' };
      case 'CAUTION':
        return { label: '🟡 주의', bg: 'bg-amber-400 text-slate-900' };
      default:
        return { label: '🟢 정상', bg: 'bg-blue-600 text-white' };
    }
  };

  const riskBadge = getRiskBadge();

  return (
    <div className="p-3.5 sm:p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 animate-fade-in space-y-3">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            {isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            )}
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <span className="font-extrabold text-sm sm:text-base font-mono">
            ▶ {year}년 {currentMonth}월 시장 진행
          </span>
          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${riskBadge.bg}`}>
            {riskBadge.label}
          </span>
        </div>

        {/* Quality Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          <span className="text-slate-400">데이터 신뢰도:</span>
          {quality === 'VERIFIED_MONTHLY' ? (
            <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800 flex items-center gap-1">
              <CheckCircle2 size={12} /> 검증된 월별 데이터
            </span>
          ) : quality === 'PARTIAL_MONTHLY' ? (
            <span className="text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800">
              일부 월별 데이터
            </span>
          ) : (
            <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              연간 데이터만 제공
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-400 h-2 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Live Value and Metrics Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-slate-400 font-sans block text-[11px]">월별 평가자산</span>
            <span className="text-base sm:text-lg font-black text-white">{formatKRW(portfolioValueKRW)}</span>
          </div>

          <div>
            <span className="text-slate-400 font-sans block text-[11px]">올해 누적 수익률</span>
            <span className={`text-base font-bold ${ytdReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {ytdReturn >= 0 ? '+' : ''}{formatPercent(ytdReturn)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-sans block text-[11px]">고점 대비</span>
            <span className="text-base font-bold text-rose-400">
              -{formatPercent(Math.abs(drawdownFromPeak))}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Speed Toggle */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            {(['NORMAL', 'FAST', 'INSTANT'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { audioManager.playUiSound('keyTap'); onChangeSpeed(s); }}
                className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                  speed === s
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s === 'NORMAL' ? '보통' : s === 'FAST' ? '빠르게' : '즉시'}
              </button>
            ))}
          </div>

          {/* Pause / Play */}
          <button
            type="button"
            onClick={() => { audioManager.playUiSound('keyTap'); onTogglePlay(); }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition cursor-pointer"
            title={isPlaying ? '일시 정지' : '재생'}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>

          {/* Skip To End */}
          <button
            type="button"
            onClick={() => { audioManager.playUiSound('keyTap'); onSkipToEnd(); }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1 text-xs"
          >
            <span>연말 결과로 바로가기</span>
            <SkipForward size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
