import React, { useState } from 'react';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';
import type { YearlyPerformanceRecord } from '../../types/stockGame';

interface PortfolioGhostRaceProps {
  history: YearlyPerformanceRecord[];
  currentYear: number;
}

export const PortfolioGhostRace: React.FC<PortfolioGhostRaceProps> = ({
  history,
  currentYear,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  if (history.length === 0) return null;

  // Track progressive index levels (Starting at 100)
  const chartData = history.map(h => ({
    year: h.year,
    portfolioTwr: h.twrIndexLevel || 100,
    kospiTwr: h.benchmarkTwrLevels?.kospiTwr || (h.benchmarkLevels ? (h.benchmarkLevels.kospiValue / (history[0].benchmarkLevels?.kospiValue || 1)) * 100 : 100),
    sp500Twr: h.benchmarkTwrLevels?.sp500Twr || (h.benchmarkLevels ? (h.benchmarkLevels.sp500Value / (history[0].benchmarkLevels?.sp500Value || 1)) * 100 : 100),
    blendTwr: h.benchmarkTwrLevels?.blend5050Twr || (h.benchmarkLevels ? (h.benchmarkLevels.blend5050Value / (history[0].benchmarkLevels?.blend5050Value || 1)) * 100 : 100),
  }));

  const latest = chartData[chartData.length - 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              현재까지의 벤치마크 고스트 레이스 (기준=100)
            </h3>
            <span className="text-[11px] text-slate-500">
              {history[0].year}년 ~ {currentYear - 1}년까지의 누적 복리 성장 비교 (미래 정보 없음)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition flex items-center gap-1 cursor-pointer border border-slate-200"
          title={isVisible ? '레이스 차트 숨기기' : '레이스 차트 보기'}
        >
          {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
          <span>{isVisible ? '숨기기' : '표시'}</span>
        </button>
      </div>

      {isVisible && (
        <div className="space-y-3 pt-1">
          {/* Latest Levels Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-0.5">
              <span className="text-[10px] text-slate-500 font-sans font-bold block">나의 포트폴리오</span>
              <span className="text-base font-bold text-blue-700 block">
                {latest.portfolioTwr.toFixed(1)}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
              <span className="text-[10px] text-slate-500 font-sans font-bold block">🇰🇷 코스피 지수</span>
              <span className="text-base font-bold text-slate-700 block">
                {latest.kospiTwr.toFixed(1)}
              </span>
            </div>

            <div className="p-2.5 bg-purple-50/70 rounded-xl border border-purple-200 space-y-0.5">
              <span className="text-[10px] text-slate-500 font-sans font-bold block">🇺🇸 S&P 500 (원화)</span>
              <span className="text-base font-bold text-purple-700 block">
                {latest.sp500Twr.toFixed(1)}
              </span>
            </div>

            <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-0.5">
              <span className="text-[10px] text-slate-500 font-sans font-bold block">⚖️ 한·미 50:50 혼합</span>
              <span className="text-base font-bold text-emerald-700 block">
                {latest.blendTwr.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
