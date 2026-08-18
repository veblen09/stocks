import React from 'react';
import { ArrowRight, Trophy, TrendingDown, Newspaper, CheckCircle2 } from 'lucide-react';
import { GlassCard } from './GlassCard';
import type { YearlyPerformanceRecord } from '../types/stockGame';
import { formatKRW, formatPercent, getReturnBgColor, getReturnColor } from '../utils/formatMoney';

interface YearEndBriefingModalProps {
  record: YearlyPerformanceRecord | null;
  isGameOver: boolean;
  onProceed: () => void;
}

export const YearEndBriefingModal: React.FC<YearEndBriefingModalProps> = ({
  record,
  isGameOver,
  onProceed,
}) => {
  if (!record) return null;

  const retColor = getReturnColor(record.annualReturn);
  const retBg = getReturnBgColor(record.annualReturn);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-xl p-6 relative animate-fade-in-up border-white/90 shadow-2xl flex flex-col max-h-[90vh]" variant="strong">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {record.year}년 운용 성과 결산
            </span>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1.5 font-display">
              {record.year}년 투자 결산 브리핑
            </h3>
          </div>
          <div className={`px-4 py-2 rounded-2xl border font-black text-lg ${retBg}`}>
            {formatPercent(record.annualReturn)}
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1 text-xs text-slate-600 font-medium">
          {/* Market Comparison 3-Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-bold block">내 포트폴리오</span>
              <span className={`text-base font-black ${retColor}`}>
                {formatPercent(record.annualReturn)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-bold block">코스피 지수</span>
              <span className={`text-base font-black ${getReturnColor(record.benchmarkReturns.kospi)}`}>
                {formatPercent(record.benchmarkReturns.kospi)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-bold block">S&P 500 (원화)</span>
              <span className={`text-base font-black ${getReturnColor(record.benchmarkReturns.sp500KRW)}`}>
                {formatPercent(record.benchmarkReturns.sp500KRW)}
              </span>
            </div>
          </div>

          {/* Key Drivers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {record.bestPerformer && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Trophy size={16} />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold block">최고 상승 보유종목</span>
                  <span className="font-extrabold text-slate-800 text-xs">
                    {record.bestPerformer.nameKo} ({formatPercent(record.bestPerformer.returnPercent, true)})
                  </span>
                </div>
              </div>
            )}

            {record.worstPerformer && (
              <div className="p-3 bg-slate-100/80 border border-slate-200/70 rounded-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold">
                  <TrendingDown size={16} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">최저 수익 보유종목</span>
                  <span className="font-extrabold text-slate-800 text-xs">
                    {record.worstPerformer.nameKo} ({formatPercent(record.worstPerformer.returnPercent, true)})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* FX & Asset summary */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500">기말 총 평가액</span>
              <span className="font-extrabold text-slate-800 text-sm">{formatKRW(record.endTotalAssetsKRW)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
              <span>USD/KRW 환율 ({record.year}년말)</span>
              <span className="font-bold text-slate-700">{record.fxRate.toFixed(2)}원 / $</span>
            </div>
            {Math.abs(record.fxContributionPnlKRW) > 100 && (
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                <span>미국주식 환율 효과 기여손익</span>
                <span className={`font-bold ${record.fxContributionPnlKRW > 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                  {formatKRW(record.fxContributionPnlKRW)}
                </span>
              </div>
            )}
          </div>

          {/* Historical Market Briefing */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/80 rounded-2xl border border-indigo-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-900 font-black text-xs">
              <Newspaper size={16} className="text-indigo-600" />
              <span>{record.year}년 실제 역사적 시장 브리핑</span>
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm">{record.marketBriefing.titleKo}</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              {record.marketBriefing.descriptionKo}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onProceed}
          className="w-full mt-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          {isGameOver ? (
            <>
              <CheckCircle2 size={18} /> 최종 결과 보고서 보러가기
            </>
          ) : (
            <>
              <span>{record.year + 1}년으로 이동하기</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </GlassCard>
    </div>
  );
};
