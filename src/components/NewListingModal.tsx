import React, { useState, useEffect } from 'react';
import { Sparkles, Building2, ChevronRight, ChevronLeft, ArrowRight, BookOpen, Check } from 'lucide-react';
import type { HistoricalStockDefinition, ListingEvent } from '../types/stockUniverse';
import { getListingEventByCompanyId } from '../engine/universeEngine';
import { audioManager } from '../utils/audioManager';
import { formatKRW } from '../utils/formatMoney';

interface NewListingModalProps {
  listedStocks: HistoricalStockDefinition[];
  targetYear: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectStock?: (canonicalId: string) => void;
}

export const NewListingModal: React.FC<NewListingModalProps> = ({
  listedStocks,
  targetYear,
  isOpen,
  onClose,
  onSelectStock,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen && listedStocks.length > 0) {
      setCurrentIndex(0);
      audioManager.playUiSound('success');
    }
  }, [isOpen, listedStocks.length]);

  if (!isOpen || listedStocks.length === 0) return null;

  const currentStock = listedStocks[currentIndex];
  const listingEvent: ListingEvent | undefined = getListingEventByCompanyId(currentStock.canonicalCompanyId);
  const totalCount = listedStocks.length;

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
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Top Decorative Sparkle Background Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
              <Sparkles size={20} className="animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {targetYear}년 거래소 신규 상장 공시
                </span>
                {totalCount > 1 && (
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    ({currentIndex + 1}/{totalCount})
                  </span>
                )}
              </div>
              <h2 id="listing-modal-title" className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 tracking-tight font-display">
                새로운 혁신 기업 상장(IPO) 안내
              </h2>
            </div>
          </div>
        </div>

        {/* Main Card Content */}
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl p-4 sm:p-5 border border-indigo-100/80 space-y-3.5">
          {/* Company Title & Market Badges */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                  currentStock.market === 'KR'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {currentStock.market === 'KR' ? '🇰🇷 한국거래소 (KRX)' : '🇺🇸 미국 나스닥/NYSE'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {currentStock.currentTicker}
                </span>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {currentStock.sectorHistory?.[0]?.sector || '성장 유망'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
                {currentStock.currentName}
              </h3>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-500 font-bold block">공식 상장일</span>
              <span className="text-xs font-mono font-black text-slate-800 bg-white/80 px-2 py-1 rounded-lg border border-slate-200 inline-block mt-0.5">
                {currentStock.firstTradingDate || currentStock.listingDate}
              </span>
            </div>
          </div>

          {/* Description / Business Summary */}
          <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
            <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
              <Building2 size={13} className="text-indigo-600" /> 기업 소개 및 상장 배경
            </span>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {listingEvent?.businessSummaryAsOfDate || currentStock.description || '혁신적인 기술과 비즈니스 모델로 시장의 주목을 받으며 공식 상장되었습니다.'}
            </p>
          </div>

          {/* Key IPO Stats Bar */}
          {listingEvent && (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans font-bold block">공모가(IPO Price)</span>
                <span className="text-sm font-black text-indigo-700">
                  {listingEvent.ipoOfferingPrice ? (currentStock.market === 'US' ? `$${listingEvent.ipoOfferingPrice}` : formatKRW(listingEvent.ipoOfferingPrice)) : '시장 기준가'}
                </span>
              </div>
              <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans font-bold block">기업도감 & 거래소</span>
                <span className="text-sm font-black text-emerald-700 flex items-center gap-1 font-sans">
                  <Check size={14} /> 매수 가능 잠금 해제
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notice Info Footer */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900 font-medium">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-blue-600 shrink-0" />
            <span>
              <strong>{targetYear}년 포트폴리오</strong> 의사결정 시 종목 탐색 목록에서 해당 기업을 매수할 수 있습니다.
            </span>
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

          <div className="flex items-center gap-2">
            {onSelectStock && (
              <button
                type="button"
                onClick={() => {
                  onSelectStock(currentStock.canonicalCompanyId);
                  handleComplete();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer"
              >
                종목 상세 보기
              </button>
            )}

            <button
              type="button"
              onClick={handleComplete}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>{currentIndex === totalCount - 1 ? `${targetYear}년 투자 시작하기` : '다음 종목 확인'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
