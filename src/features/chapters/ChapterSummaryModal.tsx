import React from 'react';
import { Award, CheckCircle2, XCircle, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import type { ChapterSummaryData } from '../../types/chapter';
import { formatKRW, formatPercent, getReturnColor } from '../../utils/formatMoney';
import { audioManager } from '../../utils/audioManager';

interface ChapterSummaryModalProps {
  isOpen: boolean;
  summaryData: ChapterSummaryData;
  onClose: () => void;
}

export const ChapterSummaryModal: React.FC<ChapterSummaryModalProps> = ({
  isOpen,
  summaryData,
  onClose,
}) => {
  if (!isOpen) return null;

  const { chapter, riskMissionResults = [], survived = true } = summaryData;

  const handleNext = () => {
    audioManager.playUiSound('confirm');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-summary-title"
    >
      <GlassCard
        className="w-full max-w-2xl max-h-[90vh] bg-white border-slate-200 p-6 sm:p-7 shadow-2xl flex flex-col space-y-4 text-slate-800 overflow-y-auto"
        variant="default"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${
              survived
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <Award size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                  CHAPTER {chapter.chapterNumber} 완료 · {summaryData.startYear} ~ {summaryData.endYear}년
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  survived
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {survived ? '🛡️ 시대 생존 성공' : '⚠️ 리스크 기준 초과 (계속 진행)'}
                </span>
              </div>
              <h2 id="chapter-summary-title" className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                {chapter.titleKo} 5년 결산 & 회고
              </h2>
            </div>
          </div>
        </div>

        {/* 4 Key Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium block">5개년 누적 수익률</span>
            <span className={`font-mono text-base font-bold block ${getReturnColor(summaryData.chapterReturn)}`}>
              {formatPercent(summaryData.chapterReturn)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium block">시간가중수익률 (TWR)</span>
            <span className={`font-mono text-base font-bold block ${getReturnColor(summaryData.chapterTWR)}`}>
              {formatPercent(summaryData.chapterTWR)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium block">최대 낙폭 (MDD)</span>
            <span className="font-mono text-base font-bold block text-rose-600">
              -{formatPercent(summaryData.chapterMDD)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium block">지급 거래 수수료</span>
            <span className="font-mono text-base font-bold block text-slate-800">
              {formatKRW(summaryData.totalFeesPaidKRW)}
            </span>
          </div>
        </div>

        {/* Retrospective Summary (Revealed now without spoilers beforehand) */}
        {chapter.retrospective && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <BookOpen size={14} className="text-blue-600" />
              <span>역사적 회고 ({chapter.startYear}~{chapter.endYear}년에 일어난 일)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {chapter.retrospective.descriptionKo}
            </p>
          </div>
        )}

        {/* 5-Year Risk Missions Evaluation Results */}
        {riskMissionResults.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-blue-600" />
              <span>5개년 리스크 관리 미션 달성 여부</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {riskMissionResults.map((r, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    r.passed
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-rose-50/70 border-rose-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {r.passed ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : (
                      <XCircle size={16} className="text-rose-600" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{r.label}</span>
                    <span className={`text-[11px] font-mono font-semibold block mt-0.5 ${
                      r.passed ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {r.passed ? '달성 성공' : '기준 초과'} (실제 {typeof r.actualValue === 'number' && r.actualValue < 1 ? formatPercent(r.actualValue) : r.actualValue})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-3 flex justify-end border-t border-slate-200">
          <button
            type="button"
            onClick={handleNext}
            className="w-full sm:w-auto py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <span>다음 연도로 진행하기</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
