import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Unlock,
  Eye,
  FileText,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import type { YearlyPerformanceRecord } from '../types/stockGame';
import { getReturnBgColor, getReturnColor, formatKRW } from '../utils/formatMoney';
import { getAvailableNewsForYear, getYearRetrospectiveNews } from '../engine/newsEngine';
import { useStockGame } from '../store/stockGameStore';
import { audioManager } from '../utils/audioManager';

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
  const { state } = useStockGame();
  const [activeTab, setActiveTab] = useState<'RETROSPECTIVE' | 'KNOWN_BEFORE' | 'MY_DECISION'>('RETROSPECTIVE');

  useEffect(() => {
    if (record) {
      if (record.annualReturn >= 0) {
        audioManager.playUiSound('success');
      } else {
        audioManager.playUiSound('notification');
      }
    }
  }, [record]);

  if (!record) return null;

  const currentYear = record.year;
  const priorYear = currentYear - 1;

  // News known before investment (cutoff date: (currentYear - 1)-12-31)
  const knownBeforeNews = getAvailableNewsForYear(currentYear).slice(0, 4);

  // Realized retrospective news during currentYear (unlocked now!)
  const realizedYearNews = getYearRetrospectiveNews(currentYear);

  // Player's investment notes for current holding stocks
  const playerNotes = Object.entries(state.investmentNotes || {}).filter(([_, note]) => note && note.trim().length > 0);

  const retColor = getReturnColor(record.annualReturn);
  const retBg = getReturnBgColor(record.annualReturn);

  const handleProceed = () => {
    audioManager.playUiSound('confirm');
    onProceed();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="year-end-title"
    >
      <GlassCard
        className="w-full max-w-2xl bg-white border-slate-200 shadow-2xl flex flex-col max-h-[92vh] text-slate-800 p-5 sm:p-6"
        variant="default"
      >
        {/* Top Header & Year Result Badge */}
        <div className="pb-4 border-b border-slate-200 shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-mono text-xs font-bold border border-blue-200">
              {currentYear}년 투자 결산 브리핑
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {priorYear}년 말 ➔ {currentYear}년 말
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <h3 id="year-end-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {currentYear}년 연간 운용 결과
              </h3>
              <p className="text-xs text-slate-500">
                기말 평가자산: <strong className="text-slate-900 font-mono">{formatKRW(record.endTotalAssetsKRW)}</strong>
              </p>

            </div>

            <div className={`px-3 py-1.5 rounded-xl ${retBg} border border-slate-200 text-right`}>
              <span className={`text-xl font-bold font-mono ${retColor}`}>
                {record.annualReturn >= 0 ? '+' : ''}{(record.annualReturn * 100).toFixed(2)}%
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">포트폴리오 수익률</span>
            </div>
          </div>
        </div>

        {/* 3 Analysis Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 my-3 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              audioManager.playUiSound('tab');
              setActiveTab('RETROSPECTIVE');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'RETROSPECTIVE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Unlock size={13} />
            <span>실제 발생 사건 ({realizedYearNews.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioManager.playUiSound('tab');
              setActiveTab('KNOWN_BEFORE');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'KNOWN_BEFORE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye size={13} />
            <span>연초 확인 정보 ({knownBeforeNews.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioManager.playUiSound('tab');
              setActiveTab('MY_DECISION');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'MY_DECISION' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={13} />
            <span>나의 투자 가설 ({playerNotes.length})</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs text-slate-700">
          {/* TAB 1: RETROSPECTIVE */}
          {activeTab === 'RETROSPECTIVE' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
                <strong>🔓 {currentYear}년 사후 검증 정보</strong>: 해당 연도가 완전히 종료되어 당해 연도 중에 발생했던 실제 시장 뉴스와 실적이 공개되었습니다.
              </div>

              {realizedYearNews.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400">
                  당해 연도 주요 보도자료 정리본을 로드 중입니다.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {realizedYearNews.map((news) => (
                    <div
                      key={news.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span className="text-blue-700 font-bold">{news.publishedAt}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">{news.sourceName}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">{news.titleKo}</h4>
                      <p className="text-xs text-slate-700 leading-relaxed">{news.summaryKo}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KNOWN BEFORE */}
          {activeTab === 'KNOWN_BEFORE' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 leading-relaxed">
                <strong>👁️ 연초 기준 공개 정보</strong>: {priorYear}년 12월 31일 당시 투자 결정을 내릴 때 사용자가 확인했던 주요 뉴스입니다.
              </div>

              <div className="space-y-2.5">
                {knownBeforeNews.map((news) => (
                  <div
                    key={news.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span className="text-blue-700 font-bold">{news.publishedAt}</span>
                      <span>{news.sourceName}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs leading-snug">{news.titleKo}</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{news.summaryKo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MY DECISION */}
          {activeTab === 'MY_DECISION' && (
            <div className="space-y-3">
              {playerNotes.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 space-y-1">
                  <p>기록된 투자 메모가 없습니다.</p>
                  <p className="text-[11px]">종목 상세 화면의 [투자 메모] 탭에서 투자 가설을 기록해 보세요.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {playerNotes.map(([cid, note]) => (
                    <div
                      key={cid}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                    >
                      <span className="font-bold text-slate-900 block text-xs">{cid} 투자 가설</span>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">{note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom CTA Button */}
        <div className="pt-4 border-t border-slate-200 shrink-0 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            다음 운용 연도: <strong className="text-slate-900">{currentYear + 1}년</strong>
          </div>

          <button
            type="button"
            onClick={handleProceed}
            className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
          >
            <span>{isGameOver ? '최종 성과 보고서 확인하기' : `${currentYear + 1}년 투자 환경으로 이동`}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
