import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  PieChart,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import type { HistoricalNewsItem, AffectedChannel } from '../types/stockNews';
import type { HoldingsSnapshotItem } from '../types/stockGame';
import { STOCKS_BY_ID } from '../engine/returnEngine';
import { formatPercent } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';

interface HoldingCompanyEventModalProps {
  isOpen: boolean;
  year: number;
  events: HistoricalNewsItem[];
  holdingsSnapshot?: HoldingsSnapshotItem[];
  onClose: () => void;
  onProceedToBriefing?: () => void;
}

const CHANNEL_LABELS: Record<AffectedChannel, string> = {
  DEMAND: '소비자 수요',
  REVENUE: '매출액',
  COST: '생산 및 원가',
  INTEREST_RATE: '금리 및 조달비용',
  EXCHANGE_RATE: '환율 및 수출입',
  REGULATION: '정부 규제 및 법률',
  SUPPLY_CHAIN: '공급망 및 원자재',
  CAPITAL_COST: '자본비용 및 부채',
  COMPETITION: '시장 점유율 및 경쟁',
  MANAGEMENT: '경영진 및 지배구조',
  VALUATION: '주식 밸류에이션',
};

export const HoldingCompanyEventModal: React.FC<HoldingCompanyEventModalProps> = ({
  isOpen,
  year,
  events,
  holdingsSnapshot = [],
  onClose,
  onProceedToBriefing,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen && events.length > 0) {
      setCurrentIndex(0);
      audioManager.playUiSound('notification');
    }
  }, [isOpen, year, events.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        audioManager.playUiSound('modalClose');
        onClose();
      } else if (e.key === 'ArrowRight' && currentIndex < events.length - 1) {
        audioManager.playUiSound('tab');
        setCurrentIndex(i => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        audioManager.playUiSound('tab');
        setCurrentIndex(i => i - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, events.length, onClose]);

  if (!isOpen || events.length === 0) return null;

  const currentEvent = events[currentIndex] || events[0];
  const primaryCid = currentEvent.canonicalCompanyIds[0];
  const stock = primaryCid ? STOCKS_BY_ID[primaryCid] : null;

  // Find user's holding data for this stock during the year
  const holdingInfo = holdingsSnapshot.find(h => h.canonicalId === primaryCid);
  const holdingWeight = holdingInfo ? holdingInfo.weight : 0;
  const stockAnnualReturn = holdingInfo?.annualReturn ?? null;

  const handleNext = () => {
    if (currentIndex < events.length - 1) {
      audioManager.playUiSound('tab');
      setCurrentIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      audioManager.playUiSound('tab');
      setCurrentIndex(i => i - 1);
    }
  };

  const handleFinish = () => {
    audioManager.playUiSound('confirm');
    if (onProceedToBriefing) {
      onProceedToBriefing();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="holding-event-title"
    >
      <GlassCard
        className="w-full max-w-2xl bg-white border-slate-200 shadow-2xl flex flex-col max-h-[92vh] text-slate-800 p-5 sm:p-6 overflow-hidden"
        variant="default"
      >
        {/* Header Strip */}
        <div className="pb-3.5 border-b border-slate-200 shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-900 font-mono text-xs font-bold border border-amber-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-600 fill-amber-500" />
                {year}년 보유 종목 개별 사건 공시
              </span>
              {events.length > 1 && (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {currentIndex + 1} / {events.length}건
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                audioManager.playUiSound('modalClose');
                onClose();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </div>

          {/* Company Target Header with Holding Stats */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 bg-gradient-to-r from-slate-50 to-amber-50/40 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                <Building2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 id="holding-event-title" className="text-base sm:text-lg font-black text-slate-900">
                    {stock ? stock.nameKo : primaryCid || '보유 기업'}
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {stock?.ticker || primaryCid}
                  </span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {stock?.market === 'US' ? '🇺🇸 미국' : '🇰🇷 한국'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {stock?.sector || '주요 산업'} · 발표일: <span className="font-mono font-semibold text-slate-700">{currentEvent.publishedAt}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-right">
              {holdingWeight > 0 && (
                <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-sans font-medium flex items-center gap-1 justify-end">
                    <PieChart size={10} /> 보유 비중
                  </span>
                  <strong className="text-blue-700 font-bold">{(holdingWeight * 100).toFixed(1)}%</strong>
                </div>
              )}
              {stockAnnualReturn !== null && (
                <div
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono shadow-2xs ${
                    stockAnnualReturn >= 0
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                >
                  <span className="text-[10px] text-slate-500 block font-sans font-medium">
                    {year}년 연간수익률
                  </span>
                  <strong className="font-bold">
                    {stockAnnualReturn >= 0 ? '+' : ''}
                    {formatPercent(stockAnnualReturn)}
                  </strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Multi-event tab strip if more than 1 event */}
        {events.length > 1 && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 my-2.5 text-xs font-bold shrink-0 overflow-x-auto">
            {events.map((ev, idx) => {
              const cid = ev.canonicalCompanyIds[0];
              const s = cid ? STOCKS_BY_ID[cid] : null;
              const isActive = idx === currentIndex;
              return (
                <button
                  key={ev.id || idx}
                  type="button"
                  onClick={() => {
                    audioManager.playUiSound('tab');
                    setCurrentIndex(idx);
                  }}
                  className={`flex-1 min-w-[120px] py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 text-[11px] ${
                    isActive ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{s ? s.nameKo : cid || `사건 #${idx + 1}`}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable Event Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs text-slate-700 py-2">
          {/* Main Headline & Summary */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-mono font-bold text-blue-700">{currentEvent.sourceName}</span>
              <div className="flex items-center gap-1.5">
                {currentEvent.categories.map((cat, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <h4 className="text-base font-black text-slate-900 leading-snug">
              {currentEvent.titleKo}
            </h4>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {currentEvent.summaryKo}
            </p>
          </div>

          {/* 3-Way Neutral Historical Breakdown */}
          {currentEvent.neutralAnalysis && (
            <div className="space-y-2.5">
              {/* 1. Verified Facts */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1. 당시 공식 확인된 사실 (Verified Facts)</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium pl-5">
                  {currentEvent.neutralAnalysis.verifiedFacts}
                </p>
              </div>

              {/* 2. Positive / Bull Case */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                  <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>2. 긍정적 관점 / 성장 기회 (Bull Case)</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium pl-5">
                  {currentEvent.neutralAnalysis.positiveInterpretation}
                </p>
              </div>

              {/* 3. Negative / Bear Case */}
              <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-950 font-bold">
                  <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>3. 부정적 관점 / 리스크 요인 (Bear Case)</span>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed font-medium pl-5">
                  {currentEvent.neutralAnalysis.negativeInterpretation}
                </p>
              </div>

              {/* 4. Unknown / Latent Factors */}
              {currentEvent.neutralAnalysis.unknownAtTheTime && (
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>4. 당시 미확인 / 불확실성 변수 (Unknown Factors)</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium pl-5">
                    {currentEvent.neutralAnalysis.unknownAtTheTime}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Affected Channels Strip */}
          {currentEvent.affectedChannels && currentEvent.affectedChannels.length > 0 && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                주요 영향 채널 (Impact Channels)
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentEvent.affectedChannels.map(ch => (
                  <span
                    key={ch}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold"
                  >
                    {CHANNEL_LABELS[ch] || ch}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation & CTA Buttons */}
        <div className="pt-3.5 border-t border-slate-200 shrink-0 flex items-center justify-between gap-2">
          {events.length > 1 ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                  currentIndex === 0
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer'
                }`}
              >
                <ChevronLeft size={14} /> 이전
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === events.length - 1}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                  currentIndex === events.length - 1
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer'
                }`}
              >
                다음 <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-medium">
              💡 <span className="font-semibold text-slate-700">투자자 교훈</span>: 개별 기업 뉴스는 장기 펀더멘털과 함께 교차 검증해야 합니다.
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFinish}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
            >
              <span>{onProceedToBriefing ? '연말 결산 브리핑으로 이동' : '확인 완료'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
