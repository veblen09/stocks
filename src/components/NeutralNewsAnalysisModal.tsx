import React, { useEffect } from 'react';
import { X, ExternalLink, ShieldCheck, HelpCircle, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import type { HistoricalNewsItem, AffectedChannel } from '../types/stockNews';
import { audioManager } from '../utils/audioManager';

interface NeutralNewsAnalysisModalProps {
  newsItem: HistoricalNewsItem | null;
  onClose: () => void;
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

export const NeutralNewsAnalysisModal: React.FC<NeutralNewsAnalysisModalProps> = ({
  newsItem,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && newsItem) {
        audioManager.playUiSound('modalClose');
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newsItem, onClose]);

  if (!newsItem) return null;

  const { neutralAnalysis, sourceName, sourceUrl, evidenceLevel, publishedAt, titleKo } = newsItem;

  const handleClose = () => {
    audioManager.playUiSound('modalClose');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="neutral-analysis-title"
    >
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <HelpCircle className="w-5 h-5" />
            </span>
            <div>
              <h3 id="neutral-analysis-title" className="text-lg font-bold text-slate-900">
                중립적 영향 경로 해설 & 당시 확인된 사실
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                발표일: {publishedAt} · 출처: {sourceName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs leading-relaxed text-slate-700">
          {/* Target News Title */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-blue-700 uppercase block">해당 기사 제목</span>
            <p className="text-sm font-bold text-slate-900">{titleKo}</p>
          </div>

          {/* 1. Verified Facts (당시 확인된 사실) */}
          <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>1. 당시 공식 확인된 사실 (Fact)</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium pl-5">
              {neutralAnalysis.verifiedFacts}
            </p>
          </div>

          {/* 2. Impact Channels (영향 경로 태그) */}
          <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block">2. 기업 및 시장 영향 경로</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {neutralAnalysis.impactChannels.map((ch) => (
                <span
                  key={ch}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold"
                >
                  #{CHANNEL_LABELS[ch] || ch}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Positive vs Negative Interpretations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Positive */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>긍정적으로 볼 수 있었던 점</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                {neutralAnalysis.positiveInterpretation}
              </p>
            </div>

            {/* Negative */}
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>부정적 또는 우려 요인</span>
              </div>
              <p className="text-xs text-rose-950 leading-relaxed font-medium">
                {neutralAnalysis.negativeInterpretation}
              </p>
            </div>
          </div>

          {/* 4. Unknown at the time (당시에는 알 수 없었던 점) */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>3. 당시 투자자가 알 수 없었던 점 (미래 정보 차단 고지)</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-medium pl-5">
              {neutralAnalysis.unknownAtTheTime}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium">
            증거 수준: <strong className="text-slate-800 font-bold">{evidenceLevel === 'PRIMARY_SOURCE' ? '공식 1차 원자료' : '당대 정규 언론보도'}</strong>
          </div>

          <div className="flex items-center gap-2">
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-blue-700 font-bold border border-slate-200 transition flex items-center gap-1.5"
              >
                <span>원문 출처 확인</span>
                <ExternalLink size={12} />
              </a>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-xs"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
