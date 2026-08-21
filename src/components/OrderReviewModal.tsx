import React from 'react';
import {
  ShoppingCart,
  ArrowRight,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import type { TradableStockItem } from '../types/stockUniverse';
import type { StockHolding, GameSettings } from '../types/stockGame';
import { formatKRW } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';

interface OrderReviewModalProps {
  currentYear: number;
  cashKRW: number;
  holdings: Record<string, StockHolding>;
  draftTargetWeights: Record<string, number>;
  tradableStocks: TradableStockItem[];
  settings: GameSettings;
  onExecuteBatchOrder: () => void;
  onResetDraft: () => void;
  onNormalize?: () => void;
  onClose: () => void;
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
  currentYear,
  cashKRW,
  holdings,
  draftTargetWeights,
  tradableStocks,
  settings,
  onExecuteBatchOrder,
  onResetDraft,
  onNormalize,
  onClose,
}) => {

  const priorYear = currentYear - 1;

  // Calculate current total portfolio value
  const holdingStockValues = Object.values(holdings).reduce((sum, h) => sum + (h.currentValueKRW || 0), 0);
  const totalPortfolioValue = cashKRW + holdingStockValues;

  // Target weights and expected changes
  const stockMap: Record<string, TradableStockItem> = {};
  tradableStocks.forEach(s => { stockMap[s.canonicalId] = s; });

  const stockChanges: Array<{
    canonicalId: string;
    stock: TradableStockItem;
    currentWeight: number;
    targetWeight: number;
    currentValueKRW: number;
    targetValueKRW: number;
    changeKRW: number;
    action: 'BUY' | 'SELL' | 'HOLD';
    isNewInclusion: boolean;
    isNewlyListed: boolean;
  }> = [];

  let totalBuyAmount = 0;
  let totalSellAmount = 0;

  // Check all tradable stocks that have a current holding or draft target
  const allCandidateIds = new Set([
    ...Object.keys(draftTargetWeights).filter(cid => (draftTargetWeights[cid] || 0) > 0.0001),
    ...Object.keys(holdings).filter(cid => (holdings[cid]?.shares || 0) > 0.0001),
  ]);

  allCandidateIds.forEach(cid => {
    const stock = stockMap[cid];
    if (!stock) return;

    const currentHolding = holdings[cid];
    const currVal = currentHolding ? currentHolding.currentValueKRW || 0 : 0;
    const currWeight = totalPortfolioValue > 0 ? currVal / totalPortfolioValue : 0;

    const tgtWeight = draftTargetWeights[cid] || 0;
    const tgtVal = totalPortfolioValue * tgtWeight;
    const diffVal = tgtVal - currVal;

    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (diffVal > 1000) {
      action = 'BUY';
      totalBuyAmount += diffVal;
    } else if (diffVal < -1000) {
      action = 'SELL';
      totalSellAmount += Math.abs(diffVal);
    }

    stockChanges.push({
      canonicalId: cid,
      stock,
      currentWeight: currWeight,
      targetWeight: tgtWeight,
      currentValueKRW: currVal,
      targetValueKRW: tgtVal,
      changeKRW: diffVal,
      action,
      isNewInclusion: !currentHolding && tgtWeight > 0.0001,
      isNewlyListed: stock.isNewlyListed,
    });
  });

  // Sort changes: BUY first, then SELL, then HOLD
  stockChanges.sort((a, b) => {
    const order = { BUY: 0, SELL: 1, HOLD: 2 };
    return order[a.action] - order[b.action];
  });

  const totalStockTarget = Object.values(draftTargetWeights).reduce((sum, w) => sum + w, 0);
  const targetCashWeight = Math.max(0, 1.0 - totalStockTarget);
  const isOverAllocated = totalStockTarget > 1.0001;

  // Estimated Fee
  const totalVolume = totalBuyAmount + totalSellAmount;
  const estimatedFees = totalVolume * settings.feeRate;
  const estimatedRemainingCash = cashKRW + totalSellAmount - totalBuyAmount - estimatedFees;

  const handleExecute = () => {
    audioManager.playUiSound('success');
    onExecuteBatchOrder();
    onClose();
  };

  const handleReset = () => {
    audioManager.playUiSound('allocationDown');
    onResetDraft();
  };

  const handleClose = () => {
    audioManager.playUiSound('modalClose');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-review-title"
    >
      <GlassCard
        className="w-full max-w-2xl max-h-[90vh] bg-white border-slate-200 p-6 shadow-2xl flex flex-col space-y-4 text-slate-800"
        variant="default"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 id="order-review-title" className="text-lg font-bold text-slate-900 tracking-tight">
                자산배분 주문 검토 및 일괄 실행
              </h3>
              <p className="text-xs text-slate-500">
                {currentYear}년 투자 결정: 목표 비중 도달을 위해 실행될 매수/매도 주문 내역입니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning if Over-allocated */}
        {isOverAllocated && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-900 font-semibold shrink-0 flex-wrap">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">목표 비중 합계 초과 (합계: {Math.round(totalStockTarget * 100)}%)</span>
                <p className="text-xs text-rose-700 font-normal">
                  주식 목표 비중을 비율에 맞게 100%로 자동 조정할 수 있습니다.
                </p>
              </div>
            </div>

            {onNormalize && (
              <button
                type="button"
                onClick={() => {
                  audioManager.playUiSound('success');
                  onNormalize();
                }}
                className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs transition flex items-center gap-1 shadow-xs cursor-pointer ml-auto"
              >
                <Sparkles size={13} />
                <span>100% 자동 비율 맞춤</span>
              </button>
            )}
          </div>
        )}


        {/* Execution Cutoff & Price Notice */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed shrink-0">
          <strong>📌 체결 가격 기준</strong>: 모든 매매는 {priorYear}년 12월 31일 종가(신규 상장 종목은 첫 정규시장 거래가격)를 기준으로 일괄 체결됩니다.
        </div>

        {/* Order Items List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px]">
          {stockChanges.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              설정된 목표 비중 또는 보유 종목 변동이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {stockChanges.map(item => (
                <div
                  key={item.canonicalId}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{item.stock.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{item.stock.nameKo}</span>
                        {item.isNewlyListed && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                            신규 상장
                          </span>
                        )}
                        {item.isNewInclusion && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                            신규 편입
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{item.stock.ticker} · {item.stock.sector}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
                        <span className="text-slate-500">{Math.round(item.currentWeight * 100)}%</span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <span className="font-bold text-blue-600">{Math.round(item.targetWeight * 100)}%</span>
                      </div>
                      <span className="text-xs font-medium block mt-0.5">
                        {item.action === 'BUY' && <span className="text-blue-700 font-bold">매수: +{formatKRW(item.changeKRW)}</span>}
                        {item.action === 'SELL' && <span className="text-amber-700 font-bold">매도: -{formatKRW(Math.abs(item.changeKRW))}</span>}
                        {item.action === 'HOLD' && <span className="text-slate-400">변동 없음</span>}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                        item.action === 'BUY'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : item.action === 'SELL'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.action === 'BUY' ? '매수' : item.action === 'SELL' ? '매도' : '유지'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Portfolio Summary Bottom Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl shrink-0 space-y-2 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 block font-semibold">주식 목표 비중</span>
              <span className="font-bold text-sm text-blue-700">
                {Math.round(totalStockTarget * 100)}%
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 block font-semibold">현금 목표 비중</span>
              <span className="font-bold text-sm text-emerald-700">
                {Math.round(targetCashWeight * 100)}%
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 block font-semibold">예상 거래 수수료</span>
              <span className="font-bold text-xs text-slate-700">
                {formatKRW(estimatedFees)}
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 block font-semibold">거래 후 예상 현금</span>
              <span className="font-bold text-xs text-emerald-700">
                {formatKRW(Math.max(0, estimatedRemainingCash))}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 shrink-0 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
          >
            <RotateCcw size={14} />
            <span>초안 초기화</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer border border-slate-300"
            >
              배분 수정하기
            </button>

            <button
              type="button"
              disabled={isOverAllocated}
              onClick={handleExecute}
              className={`py-2.5 px-5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                isOverAllocated
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'buy-btn-primary py-2.5 px-5'
              }`}
            >
              <ShoppingCart size={15} />
              <span>매수/매도 주문 확정 및 실행</span>
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
