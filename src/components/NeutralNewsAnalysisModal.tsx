import React from 'react';
import { X, ExternalLink, ShieldCheck, HelpCircle, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import type { HistoricalNewsItem, AffectedChannel } from '../types/stockNews';

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
  if (!newsItem) return null;

  const { neutralAnalysis, sourceName, sourceUrl, sourceType, evidenceLevel, publishedAt, titleKo } = newsItem;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="neutral-analysis-title"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <HelpCircle className="w-5 h-5" />
            </span>
            <div>
              <h3 id="neutral-analysis-title" className="text-lg font-bold text-white">
                왜 투자자에게 중요할까? (중립적 영향 경로 해설)
              </h3>
              <p className="text-xs text-slate-400">
                발표일: {publishedAt} | 출처: {sourceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          {/* Article Title */}
          <div className="p-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl">
            <div className="text-xs text-slate-400 font-semibold mb-1">대상 뉴스 / 공시</div>
            <div className="text-base font-bold text-white">{titleKo}</div>
          </div>

          {/* 1. Verified Facts */}
          <div>
            <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>1. 당시 확인된 사실 (Verified Facts)</span>
            </div>
            <p className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-slate-200 leading-relaxed">
              {neutralAnalysis.verifiedFacts}
            </p>
          </div>

          {/* 2. Impact Channels */}
          <div>
            <div className="font-bold text-sky-400 mb-1.5">
              2. 주요 영향 경로 (Affected Channels)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {neutralAnalysis.impactChannels.map(ch => (
                <span
                  key={ch}
                  className="px-2.5 py-1 text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30 rounded-lg"
                >
                  #{CHANNEL_LABELS[ch] || ch}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Positive & Negative Interpretations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-emerald-900/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>긍정적으로 해석할 수 있는 점</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {neutralAnalysis.positiveInterpretation}
              </p>
            </div>

            <div className="p-3.5 bg-rose-900/10 border border-rose-500/20 rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                <TrendingDown className="w-4 h-4" />
                <span>부정적으로 해석할 수 있는 점</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {neutralAnalysis.negativeInterpretation}
              </p>
            </div>
          </div>

          {/* 4. Unknown at the time */}
          <div>
            <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>3. 당시에는 알 수 없었던 점 (Unknown Uncertainties)</span>
            </div>
            <p className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-slate-200 leading-relaxed text-xs">
              {neutralAnalysis.unknownAtTheTime}
            </p>
          </div>

          {/* Source & Fair Use Notice */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
            <div>
              <span className="text-slate-500">자료 출처: </span>
              <span className="text-slate-300 font-medium">{sourceName}</span>
              <span className="mx-1.5">|</span>
              <span className="text-slate-500">증거수준: </span>
              <span className="text-indigo-400">{evidenceLevel}</span>
            </div>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                <span>공식 원문/출처 확인</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
