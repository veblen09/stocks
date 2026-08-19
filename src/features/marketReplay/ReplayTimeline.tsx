import React from 'react';

interface ReplayTimelineProps {
  year: number;
  currentMonth: number; // 1 to 12
  totalMonths?: number;
  onSelectMonth?: (m: number) => void;
  className?: string;
}

export const ReplayTimeline: React.FC<ReplayTimelineProps> = ({
  year,
  currentMonth,
  totalMonths = 12,
  onSelectMonth,
  className = '',
}) => {
  const percent = Math.round((currentMonth / totalMonths) * 100);

  return (
    <div className={`space-y-2 select-none ${className}`}>
      {/* Top Header info */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-slate-900 font-black text-sm tracking-tight">{year}년</span>
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
            {currentMonth}월 / {totalMonths}월
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
          <span>진행도</span>
          <span className="font-bold text-blue-600">{percent}%</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full bg-slate-100 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
        {/* Continuous Fill Bar */}
        <div
          className="absolute left-1.5 top-1.5 bottom-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl transition-all duration-300 shadow-xs"
          style={{ width: `calc(${(currentMonth / totalMonths) * 100}% - 3px)` }}
        />

        {/* Month Buttons Grid */}
        <div className="relative grid grid-cols-12 gap-1 text-center text-xs font-mono">
          {Array.from({ length: totalMonths }).map((_, idx) => {
            const m = idx + 1;
            const isCompleted = m < currentMonth;
            const isCurrent = m === currentMonth;
            const isFuture = m > currentMonth;

            return (
              <button
                key={m}
                type="button"
                disabled={isFuture}
                onClick={() => isCompleted && onSelectMonth && onSelectMonth(m)}
                className={`py-1.5 rounded-lg font-bold transition-all text-[11px] flex flex-col items-center justify-center ${
                  isCurrent
                    ? 'bg-white text-blue-700 shadow-md font-black ring-2 ring-blue-500 z-10 scale-105'
                    : isCompleted
                    ? 'text-white hover:text-blue-100 cursor-pointer'
                    : 'text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <span>{m}월</span>
                <span className="text-[9px] mt-0.5">
                  {isCurrent ? '◉' : isCompleted ? '●' : '○'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
