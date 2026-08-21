import React from 'react';
import { ShoppingCart, Play, RotateCcw, Sparkles } from 'lucide-react';
import { formatKRW } from '../../utils/formatMoney';
import { audioManager } from '../../utils/audioManager';

interface FixedActionBarProps {
  currentYear: number;
  totalStockTarget: number;
  draftCashTargetWeight: number;
  changedStocksCount: number;
  estimatedFeesKRW: number;
  isOverAllocated: boolean;
  onResetDraft: () => void;
  onOpenOrderReview: () => void;
  onNormalize: () => void;
  onStepOneYear: () => void;
}

export const FixedActionBar: React.FC<FixedActionBarProps> = ({
  currentYear,
  totalStockTarget,
  changedStocksCount,
  estimatedFeesKRW,
  isOverAllocated,
  onResetDraft,
  onOpenOrderReview,
  onNormalize,
  onStepOneYear,
}) => {
  const stockPct = Math.round(totalStockTarget * 100);
  const cashPct = Math.max(0, 100 - stockPct);

  return (
    <nav
      role="region"
      aria-label="투자 결정 및 자산배분 실행 바"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-300 py-3 px-4 sm:px-8 shadow-2xl safe-bottom"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Allocation Summary & Deltas */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-bold hidden sm:inline">목표 자산배분:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold">
              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                주식 {stockPct}%
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                현금 {cashPct}%
              </span>
            </div>
          </div>

          {changedStocksCount > 0 && (
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                <ShoppingCart size={12} className="text-blue-700" />
                <span>매수 담긴 종목 <strong className="font-mono">{changedStocksCount}개</strong></span>
              </span>
              <span className="hidden md:inline text-slate-500">· 예상 수수료 <strong className="text-slate-800 font-mono">{formatKRW(estimatedFeesKRW)}</strong></span>
            </div>
          )}

          {/* Over-allocation or Auto-balance Helper Button */}
          {isOverAllocated ? (
            <button
              type="button"
              onClick={() => {
                audioManager.playUiSound('success');
                onNormalize();
              }}
              className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer animate-pulse"
              title="모든 종목의 비중을 100% 비율에 맞게 자동 조정합니다"
            >
              <Sparkles size={13} />
              <span>100%로 자동 비율 맞춤</span>
            </button>
          ) : totalStockTarget > 0.0001 && totalStockTarget < 0.9999 ? (
            <button
              type="button"
              onClick={() => {
                audioManager.playUiSound('success');
                onNormalize();
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
              title="선택한 종목들의 비중을 100% 주식 투자로 비율에 맞게 꽉 채웁니다"
            >
              <Sparkles size={12} />
              <span>100% 주식 꽉 채우기</span>
            </button>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {changedStocksCount > 0 && (
            <button
              type="button"
              onClick={onResetDraft}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200 text-xs"
              title="배분 초안 초기화"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">초안 취소</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenOrderReview}
            className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-xs text-xs sm:text-sm"
          >
            <ShoppingCart size={15} className="text-slate-700" />
            <span>주문 검토{changedStocksCount > 0 ? ` (${changedStocksCount})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={onStepOneYear}
            className="py-2.5 px-4 sm:px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 text-xs sm:text-sm"
          >
            <Play size={15} className="fill-white" />
            <span>{currentYear}년 투자 실행 & 1년 진행</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
