import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Unlock,
  Eye,
  FileText,
  TrendingUp,
  Award,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import type { YearlyPerformanceRecord } from '../types/stockGame';
import { getReturnBgColor, getReturnColor, formatKRW, formatPercent } from '../utils/formatMoney';
import { getAvailableNewsForYear, getYearRetrospectiveNews } from '../engine/newsEngine';
import {
  getNewlyListedStocksForYear,
  getDelistedStocksForYear,
  getNextUpcomingIpoInfo,
} from '../engine/universeEngine';
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
  const [activeTab, setActiveTab] = useState<'BENCHMARK' | 'RETROSPECTIVE' | 'KNOWN_BEFORE' | 'MY_DECISION'>('BENCHMARK');

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

  // Newly listed and delisted stocks during this completed year
  const newlyListedInYear = getNewlyListedStocksForYear(currentYear);
  const delistedInYear = getDelistedStocksForYear(currentYear);
  const upcomingIpo = getNextUpcomingIpoInfo(currentYear);

  // Benchmark returns for this year
  const kospiRet = record.benchmarkReturns?.kospi ?? 0;
  const sp500Ret = record.benchmarkReturns?.sp500KRW ?? 0;
  const blendRet = record.benchmarkReturns?.blend5050 ?? 0;

  const kospiAlpha = record.annualReturn - kospiRet;
  const sp500Alpha = record.annualReturn - sp500Ret;

  // Cumulative TWR levels
  const myTwr = record.twrIndexLevel || 100;
  const kospiTwr = record.benchmarkTwrLevels?.kospiTwr ?? 100;
  const sp500Twr = record.benchmarkTwrLevels?.sp500Twr ?? 100;
  const blendTwr = record.benchmarkTwrLevels?.blend5050Twr ?? 100;

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
        <div className="pb-3.5 border-b border-slate-200 shrink-0 space-y-2">
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
                {record.annualDepositKRW > 0 && (
                  <span className="text-emerald-700 font-bold font-mono ml-2">
                    (연초 납입: +{formatKRW(record.annualDepositKRW)})
                  </span>
                )}
              </p>
            </div>

            <div className={`px-3 py-1.5 rounded-xl ${retBg} border border-slate-200 text-right`}>
              <span className={`text-xl font-bold font-mono ${retColor}`}>
                {record.annualReturn >= 0 ? '+' : ''}{(record.annualReturn * 100).toFixed(2)}%
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">포트폴리오 수익률</span>
            </div>
          </div>

          {/* Quick Benchmark Comparison Strip */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-[10px] font-sans">
                <span className="text-slate-600 font-bold">🇰🇷 코스피</span>
                <span className={`font-bold ${kospiAlpha >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kospiAlpha >= 0 ? `+${(kospiAlpha * 100).toFixed(1)}%p` : `${(kospiAlpha * 100).toFixed(1)}%p`}
                </span>
              </div>
              <span className={`text-xs font-bold block mt-0.5 ${getReturnColor(kospiRet)}`}>
                {formatPercent(kospiRet)}
              </span>
            </div>

            <div className="p-2 bg-purple-50/70 rounded-xl border border-purple-200">
              <div className="flex justify-between items-center text-[10px] font-sans">
                <span className="text-purple-900 font-bold">🇺🇸 S&P 500</span>
                <span className={`font-bold ${sp500Alpha >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {sp500Alpha >= 0 ? `+${(sp500Alpha * 100).toFixed(1)}%p` : `${(sp500Alpha * 100).toFixed(1)}%p`}
                </span>
              </div>
              <span className={`text-xs font-bold block mt-0.5 ${getReturnColor(sp500Ret)}`}>
                {formatPercent(sp500Ret)}
              </span>
            </div>

            <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <div className="flex justify-between items-center text-[10px] font-sans">
                <span className="text-emerald-900 font-bold">⚖️ 50:50 혼합</span>
                <span className={`font-bold ${record.annualReturn - blendRet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {record.annualReturn - blendRet >= 0 ? `+${((record.annualReturn - blendRet) * 100).toFixed(1)}%p` : `${((record.annualReturn - blendRet) * 100).toFixed(1)}%p`}
                </span>
              </div>
              <span className={`text-xs font-bold block mt-0.5 ${getReturnColor(blendRet)}`}>
                {formatPercent(blendRet)}
              </span>
            </div>
          </div>

          {/* Exchange IPO & Delisting Trends Strip */}
          {newlyListedInYear.length > 0 ? (
            <div className="p-2.5 bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200 rounded-xl text-xs space-y-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600 fill-amber-500" />
                  {currentYear}년 신규 상장({newlyListedInYear.length}개사 등장)
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-white/90 px-2 py-0.5 rounded-md border border-indigo-200">
                  {currentYear + 1}년부터 매수 가능
                </span>
              </div>
              <p className="text-slate-700 font-medium text-[11px]">
                {newlyListedInYear.map(s => `${s.currentName}(${s.currentTicker})`).join(', ')} 기업이 새로 상장되었습니다.
              </p>
            </div>
          ) : (
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between flex-wrap gap-1">
              <span className="font-medium text-slate-600 text-[11px]">
                🏛️ <strong>거래소 상장 동향</strong>: 당해 연도 신규 상장 기업 없음
              </span>
              {upcomingIpo && (
                <span className="text-[10px] font-bold text-slate-500 font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  다음 예정 IPO: {upcomingIpo.year}년 ({upcomingIpo.companies.map(c => c.currentName).slice(0, 2).join(', ')}{upcomingIpo.companies.length > 2 ? ' 외' : ''})
                </span>
              )}
            </div>
          )}

          {delistedInYear.length > 0 && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-0.5 shadow-2xs">
              <span className="font-black flex items-center gap-1.5 text-rose-800">
                <AlertTriangle size={13} className="text-rose-600" />
                {currentYear}년 거래소 상장폐지 공시 ({delistedInYear.length}개사)
              </span>
              <p className="font-medium text-[11px] text-rose-900">
                {delistedInYear.map(s => `${s.currentName}(${s.currentTicker})`).join(', ')} 주권이 상장폐지 처리되었습니다.
              </p>
            </div>
          )}
        </div>

        {/* 4 Analysis Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 my-2.5 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              audioManager.playUiSound('tab');
              setActiveTab('BENCHMARK');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'BENCHMARK' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={13} />
            <span>지수 비교 분석</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioManager.playUiSound('tab');
              setActiveTab('RETROSPECTIVE');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'RETROSPECTIVE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Unlock size={13} />
            <span>실제 사건 ({realizedYearNews.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioManager.playUiSound('tab');
              setActiveTab('KNOWN_BEFORE');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'KNOWN_BEFORE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye size={13} />
            <span>연초 정보 ({knownBeforeNews.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioManager.playUiSound('tab');
              setActiveTab('MY_DECISION');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'MY_DECISION' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={13} />
            <span>투자 가설 ({playerNotes.length})</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-slate-700">
          {/* TAB 0: BENCHMARK */}
          {activeTab === 'BENCHMARK' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Award size={15} className="text-blue-700" />
                  <span>{currentYear}년 시장 벤치마크 대비 성과 진단</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {kospiAlpha >= 0 && sp500Alpha >= 0
                    ? `대단합니다! 올해 한국 코스피 200(+${(kospiAlpha * 100).toFixed(1)}%p)과 미국 S&P 500(+${(sp500Alpha * 100).toFixed(1)}%p) 양대 지수를 모두 초과 달성(Alpha)했습니다.`
                    : kospiAlpha >= 0
                    ? `한국 코스피 200 지수 대비 +${(kospiAlpha * 100).toFixed(1)}%p 초과 수익을 거두었습니다.`
                    : sp500Alpha >= 0
                    ? `미국 S&P 500 지수 대비 +${(sp500Alpha * 100).toFixed(1)}%p 초과 수익을 거두었습니다.`
                    : `올해는 대표 시장 지수들의 상승세가 강력했습니다. 장기 패시브 투자의 복리 효과를 함께 학습해 보세요.`}
                </p>
              </div>

              {/* Detailed Performance Comparison Table */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-[11px] text-slate-600 font-sans font-bold">
                    <tr>
                      <th className="p-2.5">전략 / 지수</th>
                      <th className="p-2.5 text-right font-mono">{currentYear}년 수익률</th>
                      <th className="p-2.5 text-right font-mono">누적 TWR 지수</th>
                      <th className="p-2.5 text-right font-sans">초과 격차</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold">
                    <tr className="bg-blue-50/70 font-black text-blue-900">
                      <td className="p-2.5 font-sans">👑 나의 포트폴리오</td>
                      <td className={`p-2.5 text-right ${getReturnColor(record.annualReturn)}`}>
                        {formatPercent(record.annualReturn)}
                      </td>
                      <td className="p-2.5 text-right text-blue-700">{myTwr.toFixed(1)}</td>
                      <td className="p-2.5 text-right font-sans text-blue-700">-</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans text-slate-800">🇰🇷 코스피 200 지수 (KOSPI 200)</td>
                      <td className={`p-2.5 text-right ${getReturnColor(kospiRet)}`}>
                        {formatPercent(kospiRet)}
                      </td>
                      <td className="p-2.5 text-right text-slate-700">{kospiTwr.toFixed(1)}</td>
                      <td className={`p-2.5 text-right font-sans ${kospiAlpha >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {kospiAlpha >= 0 ? `+${(kospiAlpha * 100).toFixed(1)}%p` : `${(kospiAlpha * 100).toFixed(1)}%p`}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans text-slate-800">🇺🇸 S&P 500 (원화 환산)</td>
                      <td className={`p-2.5 text-right ${getReturnColor(sp500Ret)}`}>
                        {formatPercent(sp500Ret)}
                      </td>
                      <td className="p-2.5 text-right text-purple-700">{sp500Twr.toFixed(1)}</td>
                      <td className={`p-2.5 text-right font-sans ${sp500Alpha >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {sp500Alpha >= 0 ? `+${(sp500Alpha * 100).toFixed(1)}%p` : `${(sp500Alpha * 100).toFixed(1)}%p`}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans text-slate-800">⚖️ 50:50 한·미 혼합배분</td>
                      <td className={`p-2.5 text-right ${getReturnColor(blendRet)}`}>
                        {formatPercent(blendRet)}
                      </td>
                      <td className="p-2.5 text-right text-emerald-700">{blendTwr.toFixed(1)}</td>
                      <td className={`p-2.5 text-right font-sans ${record.annualReturn - blendRet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {record.annualReturn - blendRet >= 0 ? `+${((record.annualReturn - blendRet) * 100).toFixed(1)}%p` : `${((record.annualReturn - blendRet) * 100).toFixed(1)}%p`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
        <div className="pt-3.5 border-t border-slate-200 shrink-0 flex items-center justify-between">
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
