import React from 'react';
import { ArrowRight, TrendingUp, TrendingDown, Newspaper } from 'lucide-react';
import type { YearReplayData, MonthlyPortfolioPoint } from './marketReplayTypes';
import { formatKRW, formatPercent, getReturnColor } from '../../utils/formatMoney';

interface ReplayCompletionProps {
  yearData: YearReplayData;
  lastPoint: MonthlyPortfolioPoint;
  onProceedToYearEnd: () => void;
  onOpenYearNews: () => void;
  className?: string;
}

export const ReplayCompletion: React.FC<ReplayCompletionProps> = ({
  yearData,
  lastPoint,
  onProceedToYearEnd,
  onOpenYearNews,
  className = '',
}) => {
  const { year, startTotalAssetsKRW, annualContributionKRW, bestMonth, worstMonth, maxIntraYearDrawdown, maxMonthsUnderwater } = yearData;
  const endAssets = lastPoint.portfolioValueKRW;

  const totalDeposits = annualContributionKRW;
  const netStart = startTotalAssetsKRW + totalDeposits;
  const netGain = endAssets - netStart;
  const annualReturn = netStart > 0 ? netGain / netStart : 0;

  return (
    <div className={`p-6 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-scale-up ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            {year}년 12개월 시장 완주
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {year}년 포트폴리오 연말 결산
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenYearNews}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Newspaper size={15} />
            <span>올해의 역사 뉴스</span>
          </button>
          <button
            type="button"
            onClick={onProceedToYearEnd}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:translate-y-0.5 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <span>연말 결산 브리핑</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* 4 Core Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-slate-500 font-sans block font-semibold text-[11px]">기말 총 평가자산</span>
          <span className="text-lg sm:text-xl font-black text-slate-900 block">
            {formatKRW(endAssets)}
          </span>
          <span className="text-[10px] text-slate-400 font-sans block">
            기초자산 {formatKRW(startTotalAssetsKRW)}
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-slate-500 font-sans block font-semibold text-[11px]">순수 시장 투자손익</span>
          <span className={`text-lg sm:text-xl font-black block ${getReturnColor(netGain)}`}>
            {netGain >= 0 ? '+' : ''}{formatKRW(netGain)}
          </span>
          <span className="text-[10px] text-slate-400 font-sans block">
            연초납입 +{formatKRW(totalDeposits)}
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-slate-500 font-sans block font-semibold text-[11px]">연간 실현 수익률</span>
          <span className={`text-lg sm:text-xl font-black block ${getReturnColor(annualReturn)}`}>
            {annualReturn >= 0 ? '+' : ''}{formatPercent(annualReturn)}
          </span>
          <span className="text-[10px] text-slate-400 font-sans block">
            순수 시간가중 기준
          </span>
        </div>

        <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-1">
          <span className="text-rose-800 font-sans block font-semibold text-[11px]">연중 최대낙폭 (MDD)</span>
          <span className="text-lg sm:text-xl font-black text-rose-600 block">
            -{formatPercent(maxIntraYearDrawdown)}
          </span>
          <span className="text-[10px] text-rose-700 font-sans block">
            최장 수중: {maxMonthsUnderwater}개월
          </span>
        </div>
      </div>

      {/* Highlights: Best vs Worst Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <TrendingUp size={16} />
            </div>
            <div>
              <span className="font-bold text-emerald-900 block text-[11px]">올해 가장 좋았던 달</span>
              <span className="font-extrabold text-slate-800 text-sm">{bestMonth.month}월</span>
            </div>
          </div>
          <span className="font-mono text-base font-black text-emerald-700">
            +{formatPercent(bestMonth.returnRate)}
          </span>
        </div>

        <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-600 text-white rounded-xl">
              <TrendingDown size={16} />
            </div>
            <div>
              <span className="font-bold text-rose-900 block text-[11px]">올해 가장 힘들었던 달</span>
              <span className="font-extrabold text-slate-800 text-sm">{worstMonth.month}월</span>
            </div>
          </div>
          <span className="font-mono text-base font-black text-rose-700">
            {formatPercent(worstMonth.returnRate)}
          </span>
        </div>
      </div>
    </div>
  );
};
