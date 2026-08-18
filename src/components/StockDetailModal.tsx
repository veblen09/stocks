import React from 'react';
import { X, TrendingUp } from 'lucide-react';
import { GlassCard } from './GlassCard';
import type { Stock } from '../types/stockGame';
import { getHistoricalStockStats, getStockPriceKRW, getStockPriceLocal } from '../engine/returnEngine';
import { formatKRW, formatPercent, getReturnColor } from '../utils/formatMoney';

interface StockDetailModalProps {
  stock: Stock | null;
  currentYear: number;
  onClose: () => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ stock, currentYear, onClose }) => {
  if (!stock) return null;

  const priorYear = currentYear - 1;
  const isListed = currentYear >= stock.firstValidYear;
  const stats = getHistoricalStockStats(stock.canonicalId, priorYear, true);
  const currentPriceKRW = getStockPriceKRW(stock.canonicalId, priorYear);
  const currentPriceLocal = getStockPriceLocal(stock.canonicalId, priorYear);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-xl p-6 relative animate-fade-in-up border-white/80 max-h-[85vh] flex flex-col" variant="strong">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
            {stock.market === 'KR' ? '🇰🇷' : '🇺🇸'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">{stock.nameKo}</h3>
              <span className="text-xs font-mono font-bold text-slate-400">({stock.ticker})</span>
              {isListed ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  투자 가능
                </span>
              ) : (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  상장 전 ({stock.firstValidYear}년 시작)
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-500 mt-0.5">{stock.nameEn} · {stock.sector}</p>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1 text-xs text-slate-600 font-medium">
          {/* Description */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 leading-relaxed font-semibold">
            {stock.description}
          </div>

          {/* Key Facts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">상장일</span>
              <span className="font-extrabold text-slate-800">{stock.listingDate}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">기준 가격 ({priorYear}년말)</span>
              <span className="font-extrabold text-slate-800">
                {currentPriceKRW !== null ? formatKRW(currentPriceKRW) : '데이터 없음'}
                {stock.market === 'US' && currentPriceLocal !== null && (
                  <span className="text-[10px] text-slate-400 block">${currentPriceLocal.toFixed(2)}</span>
                )}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">데이터 품질</span>
              <span className="font-extrabold text-blue-600">
                {stock.dataQuality === 'TOTAL_RETURN' ? '총수익률(배당포함)' : '수정주가(분할반영)'}
              </span>
            </div>
          </div>

          {/* Historical stats up to prior year */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
              <TrendingUp size={14} className="text-blue-600" />
              {priorYear}년까지의 과거 실제 운용 지표 (미래 정보 제외)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/50 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">직전 1년 수익률</span>
                <span className={`font-black text-sm ${stats.last1YrReturn !== null ? getReturnColor(stats.last1YrReturn) : 'text-slate-400'}`}>
                  {stats.last1YrReturn !== null ? formatPercent(stats.last1YrReturn) : '-'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/50 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">과거 3년 CAGR</span>
                <span className={`font-black text-sm ${stats.past3YrCAGR !== null ? getReturnColor(stats.past3YrCAGR) : 'text-slate-400'}`}>
                  {stats.past3YrCAGR !== null ? formatPercent(stats.past3YrCAGR) : '-'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/50 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">과거 5년 CAGR</span>
                <span className={`font-black text-sm ${stats.past5YrCAGR !== null ? getReturnColor(stats.past5YrCAGR) : 'text-slate-400'}`}>
                  {stats.past5YrCAGR !== null ? formatPercent(stats.past5YrCAGR) : '-'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/50 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">과거 최대낙폭(MDD)</span>
                <span className="font-black text-sm text-slate-700">
                  {stats.historicalMDD !== null ? `-${(stats.historicalMDD * 100).toFixed(1)}%` : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 font-medium">
            💡 본 시뮬레이션에서는 미래 데이터를 사전에 열람할 수 없으며, 오직 {currentYear}년 이전까지의 검증된 역사적 시장 데이터만 의사결정 참고용으로 제공됩니다.
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer text-xs"
        >
          닫기
        </button>
      </GlassCard>
    </div>
  );
};
