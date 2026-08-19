import React from 'react';
import { BookOpen, Sparkles, Printer, X, FileText } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import type { InvestmentYearbookEntry, YearbookHighlights } from '../../types/yearbook';
import { formatKRW, formatPercent, getReturnColor } from '../../utils/formatMoney';


interface InvestmentYearbookModalProps {
  isOpen: boolean;
  entries: InvestmentYearbookEntry[];
  highlights?: YearbookHighlights;
  onClose: () => void;
}

export const InvestmentYearbookModal: React.FC<InvestmentYearbookModalProps> = ({
  isOpen,
  entries,
  highlights,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="yearbook-title"
    >
      <GlassCard
        className="w-full max-w-4xl max-h-[90vh] bg-white border-slate-200 p-6 sm:p-8 shadow-2xl flex flex-col space-y-5 text-slate-800 overflow-y-auto"
        variant="default"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4 no-print">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
              <BookOpen size={24} />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                나의 45년 투자 연감 (Investment Yearbook)
              </span>
              <h2 id="yearbook-title" className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                기록과 회고로 완성하는 나만의 투자 이야기
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1.5 text-xs cursor-pointer border border-slate-300 shadow-xs"
            >
              <Printer size={15} />
              <span>인쇄 / PDF 저장</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Highlights Banner */}
        {highlights && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Sparkles size={16} className="text-amber-600" />
              <span>45년 여정의 주요 이정표 (Highlights)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2.5 bg-white rounded-xl border border-amber-200/80">
                <span className="text-[10px] text-slate-500 block font-semibold">근거 충실 투자</span>
                <span className="font-bold text-slate-800">{highlights.bestEvidencedTradeYear || '-'}년</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-amber-200/80">
                <span className="text-[10px] text-slate-500 block font-semibold">최고 초과수익(알파)</span>
                <span className="font-bold text-emerald-700">{highlights.largestAlphaYear || '-'}년</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-amber-200/80">
                <span className="text-[10px] text-slate-500 block font-semibold">위기 극복 연도</span>
                <span className="font-bold text-rose-600">{highlights.biggestCrisisSurvivingYear || '-'}년</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-amber-200/80">
                <span className="text-[10px] text-slate-500 block font-semibold">유지된 투자 원칙</span>
                <span className="font-bold text-blue-700 truncate block">5년 분산 유지</span>
              </div>
            </div>
          </div>
        )}

        {/* Storybook Timeline */}
        <div className="space-y-4">
          {entries.map(entry => (
            <div
              key={entry.year}
              className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900">{entry.year}년</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[11px]">
                    {entry.chapterTitleKo}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span>수익률: <strong className={getReturnColor(entry.portfolioReturn)}>{formatPercent(entry.portfolioReturn)}</strong></span>
                  <span>자산: <strong className="text-slate-800">{formatKRW(entry.portfolioValueKRW)}</strong></span>
                </div>
              </div>

              {/* Major Decision */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-700 block">📌 당시 투자 결정</span>
                <p className="text-slate-600 font-medium leading-relaxed">
                  {entry.majorDecisionSummary}
                </p>
              </div>

              {/* User Thesis */}
              {entry.thesis && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-1">
                  <span className="font-bold text-blue-900 block flex items-center gap-1">
                    <FileText size={12} className="text-blue-600" />
                    나의 투자 가설 (Thesis)
                  </span>
                  <p className="text-slate-700 font-medium italic">
                    "{entry.thesis}"
                  </p>
                </div>
              )}

              {/* Prediction & Actual Outcome */}
              {entry.predictionResultSummary && (
                <div className="text-xs text-slate-500 font-medium">
                  <strong>연초 예측 회고</strong>: {entry.predictionResultSummary}
                </div>
              )}

              {/* Learning Point */}
              {entry.mainLearning && (
                <div className="text-[11px] text-emerald-800 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200 font-medium">
                  <strong>💡 핵심 배움</strong>: {entry.mainLearning}
                </div>
              )}
            </div>
          ))}

          {entries.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              진행된 시뮬레이션 연도 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end no-print">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs cursor-pointer"
          >
            닫기
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
