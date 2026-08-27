import React, { useState } from 'react';
import { TrendingUp, Eye, EyeOff, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { YearlyPerformanceRecord } from '../../types/stockGame';
import { formatKRW, formatPercent } from '../../utils/formatMoney';

interface PortfolioGhostRaceProps {
  history: YearlyPerformanceRecord[];
  currentYear: number;
  compact?: boolean;
}

export const PortfolioGhostRace: React.FC<PortfolioGhostRaceProps> = ({
  history,
  currentYear,
  compact = false,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'TWR' | 'VALUE'>('TWR');

  if (history.length === 0) return null;

  // Track progressive index levels and values
  const chartData = history.map(h => {
    const pTwr = h.twrIndexLevel || 100;
    const kospiTwr = h.benchmarkTwrLevels?.kospiTwr ?? 100;
    const sp500Twr = h.benchmarkTwrLevels?.sp500Twr ?? 100;
    const blendTwr = h.benchmarkTwrLevels?.blend5050Twr ?? 100;

    const pVal = h.endTotalAssetsKRW;
    const kospiVal = h.benchmarkLevels?.kospiValue ?? pVal;
    const sp500Val = h.benchmarkLevels?.sp500Value ?? pVal;
    const blendVal = h.benchmarkLevels?.blend5050Value ?? pVal;

    return {
      year: h.year,
      portfolioTwr: pTwr,
      kospiTwr,
      sp500Twr,
      blendTwr,
      portfolioVal: pVal,
      kospiVal,
      sp500Val,
      blendVal,
    };
  });

  const latest = chartData[chartData.length - 1];
  const kospiDiff = latest.portfolioTwr - latest.kospiTwr;
  const sp500Diff = latest.portfolioTwr - latest.sp500Twr;

  const maxTwr = Math.max(latest.portfolioTwr, latest.kospiTwr, latest.sp500Twr, latest.blendTwr, 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4.5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <TrendingUp size={17} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight">
                실시간 벤치마크 고스트 레이스
              </h3>
              {kospiDiff > 0 && sp500Diff > 0 ? (
                <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Award size={11} className="text-amber-600" /> 양대 지수 초과(Alpha)
                </span>
              ) : kospiDiff > 0 ? (
                <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md">
                  코스피 초과
                </span>
              ) : null}
            </div>
            <span className="text-[11px] text-slate-500">
              {history[0].year}년 ~ {currentYear - 1}년 누적 성과 (기준 100 vs 동일 적립식 투자 비교)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('TWR')}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'TWR' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-500'
              }`}
            >
              복리지수(TWR)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('VALUE')}
              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'VALUE' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-500'
              }`}
            >
              평가자산(KRW)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition flex items-center gap-1 cursor-pointer border border-slate-200"
            title={isVisible ? '레이스 차트 숨기기' : '레이스 차트 보기'}
          >
            {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{isVisible ? '접기' : '펼치기'}</span>
          </button>
        </div>
      </div>

      {isVisible && (
        <div className="space-y-2.5 pt-1">
          {/* 4 Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {/* 1. My Portfolio */}
            <div className="p-3 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 rounded-xl border-2 border-blue-300 space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-blue-900 font-sans font-black flex items-center gap-1">
                  👑 나의 포트폴리오
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              </div>
              <span className="text-base sm:text-lg font-black text-blue-700 block">
                {viewMode === 'TWR' ? latest.portfolioTwr.toFixed(1) : formatKRW(latest.portfolioVal)}
              </span>
              <span className="text-[10px] text-blue-600 font-sans font-semibold block">
                누적 TWR: {formatPercent((latest.portfolioTwr - 100) / 100)}
              </span>
            </div>

            {/* 2. KOSPI Index */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600 font-sans font-bold">
                  🇰🇷 코스피 지수
                </span>
                <span className={`text-[10px] font-sans font-extrabold flex items-center ${
                  kospiDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {kospiDiff >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {kospiDiff >= 0 ? `+${kospiDiff.toFixed(1)}p` : `${kospiDiff.toFixed(1)}p`}
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-slate-800 block">
                {viewMode === 'TWR' ? latest.kospiTwr.toFixed(1) : formatKRW(latest.kospiVal)}
              </span>
              <span className="text-[10px] text-slate-500 font-sans font-medium block">
                누적 TWR: {formatPercent((latest.kospiTwr - 100) / 100)}
              </span>
            </div>

            {/* 3. S&P 500 Index */}
            <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-purple-900 font-sans font-bold">
                  🇺🇸 S&P 500 (원화)
                </span>
                <span className={`text-[10px] font-sans font-extrabold flex items-center ${
                  sp500Diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {sp500Diff >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {sp500Diff >= 0 ? `+${sp500Diff.toFixed(1)}p` : `${sp500Diff.toFixed(1)}p`}
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-purple-700 block">
                {viewMode === 'TWR' ? latest.sp500Twr.toFixed(1) : formatKRW(latest.sp500Val)}
              </span>
              <span className="text-[10px] text-purple-600 font-sans font-medium block">
                누적 TWR: {formatPercent((latest.sp500Twr - 100) / 100)}
              </span>
            </div>

            {/* 4. 50:50 Blend */}
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-900 font-sans font-bold">
                  ⚖️ 한·미 50:50 혼합
                </span>
                <span className="text-[10px] font-sans text-emerald-700 font-bold">
                  연1회 리밸런싱
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-emerald-700 block">
                {viewMode === 'TWR' ? latest.blendTwr.toFixed(1) : formatKRW(latest.blendVal)}
              </span>
              <span className="text-[10px] text-emerald-600 font-sans font-medium block">
                누적 TWR: {formatPercent((latest.blendTwr - 100) / 100)}
              </span>
            </div>
          </div>

          {/* Comparative Progress Bars */}
          {!compact && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-slate-500 font-sans font-bold text-[10px]">
                <span>현재 누적 복리 성장률 순위 (기준=100)</span>
                <span>최고치 대비 상대 비율</span>
              </div>
              <div className="space-y-1.5 font-sans font-bold text-xs">
                {/* My Portfolio Bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-blue-700 font-extrabold">👑 나의 포트폴리오</span>
                    <span className="font-mono text-blue-700">{latest.portfolioTwr.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, (latest.portfolioTwr / maxTwr) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* KOSPI Bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-700">🇰🇷 코스피 지수 (KOSPI)</span>
                    <span className="font-mono text-slate-700">{latest.kospiTwr.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, (latest.kospiTwr / maxTwr) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* S&P 500 Bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-purple-700">🇺🇸 S&P 500 지수 (원화)</span>
                    <span className="font-mono text-purple-700">{latest.sp500Twr.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, (latest.sp500Twr / maxTwr) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
