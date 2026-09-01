import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import type { HistoricalStockDefinition } from '../types/stockUniverse';
import type { StockHolding } from '../types/stockGame';
import { audioManager } from '../utils/audioManager';

interface DelistingAlertModalProps {
  delistedStocks: HistoricalStockDefinition[];
  holdingsBefore: Record<string, StockHolding>;
  year: number;
  isOpen: boolean;
  onClose: () => void;
}

export const DelistingAlertModal: React.FC<DelistingAlertModalProps> = ({
  delistedStocks,
  holdingsBefore,
  year,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen && delistedStocks.length > 0) {
      setCurrentIndex(0);
      audioManager.playUiSound('warningLevel');
    }
  }, [isOpen, delistedStocks.length]);

  if (!isOpen || delistedStocks.length === 0) return null;

  const currentStock = delistedStocks[currentIndex];
  const totalCount = delistedStocks.length;

  const heldShares = holdingsBefore[currentStock.canonicalCompanyId]?.shares || 0;
  const hadPosition = heldShares > 0;

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      audioManager.playUiSound('tab');
      setCurrentIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      audioManager.playUiSound('tab');
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    audioManager.playUiSound('modalClose');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delisting-modal-title"
    >
      <div className="bg-white border border-rose-200 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Top Decorative Alert Background Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-xs">
              <ShieldAlert size={20} className="animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {year}년 거래소 상장폐지(Delisting) 공시
                </span>
                {totalCount > 1 && (
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    ({currentIndex + 1}/{totalCount})
                  </span>
                )}
              </div>
              <h2 id="delisting-modal-title" className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 tracking-tight font-display">
                상장폐지 및 거래종료 안내
              </h2>
            </div>
          </div>
        </div>

        {/* Main Card Content */}
        <div className="bg-gradient-to-br from-rose-50/50 to-orange-50/30 rounded-2xl p-4 sm:p-5 border border-rose-200/80 space-y-3.5">
          {/* Company Title & Market Badges */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md border bg-slate-100 text-slate-700 border-slate-300">
                  {currentStock.market === 'KR' ? '🇰🇷 한국거래소 (KRX)' : '🇺🇸 미국 나스닥/NYSE'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {currentStock.currentTicker}
                </span>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-md border border-rose-200">
                  거래 종료
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
                {currentStock.currentName}
              </h3>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-500 font-bold block">상장폐지 일자</span>
              <span className="text-xs font-mono font-black text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 inline-block mt-0.5">
                {currentStock.delistingDate}
              </span>
            </div>
          </div>

          {/* Delisting Cause / Historical Background */}
          <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
            <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
              <AlertTriangle size={13} className="text-rose-600" /> 상장폐지 사유 및 역사적 배경
            </span>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {currentStock.description || '경영 악화, 파산, 또는 그룹 해체로 인해 거래소 규정에 따라 공식 상장폐지되었습니다.'}
            </p>
          </div>

          {/* Position Liquidation Notice */}
          <div className={`p-3.5 rounded-xl border space-y-1.5 ${
            hadPosition
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          }`}>
            <span className="text-xs font-black block">
              {hadPosition ? '🚨 나의 계좌 보유 잔고 자동 청산 처리' : '🛡️ 포트폴리오 영향 없음'}
            </span>
            <p className="text-xs font-medium leading-relaxed">
              {hadPosition ? (
                <>
                  당시 보유 중이던 <strong>{heldShares.toFixed(2)}주</strong>가 상장폐지 규정에 따라 최종 평가 청산되었습니다. 잔여 청산 금액은 현금 잔고로 자동 입금되었습니다.
                </>
              ) : (
                <>
                  당시 해당 종목을 보유하고 있지 않아 직접적인 자산 손실을 회피했습니다. 분산투자와 리스크 관리의 중요성을 보여주는 역사적 사례입니다.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {totalCount > 1 ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={15} /> 이전
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
              >
                다음 <ChevronRight size={15} />
              </button>
            </div>
          ) : <div />}

          <button
            type="button"
            onClick={handleComplete}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <span>{currentIndex === totalCount - 1 ? '공시 확인 완료' : '다음 공시 확인'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
