import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Star,
  Building2,
  Newspaper,
  FileText,
  LineChart,
  Edit3,
  ExternalLink,
  Lock,
  Calendar,
  AlertTriangle,
  HelpCircle,
  ShoppingCart,
  Layers,
} from 'lucide-react';
import { useStockGame } from '../store/stockGameStore';
import {
  getCompanyOverviewAtYear,
  getAvailableNewsForYear,
  getDecisionCutoffDate,
} from '../engine/newsEngine';
import { getHistoricalStockStats, getStockPriceKRW } from '../engine/returnEngine';
import { formatKRW, formatPercent } from '../utils/formatMoney';
import { NeutralNewsAnalysisModal } from './NeutralNewsAnalysisModal';
import type { HistoricalNewsItem } from '../types/stockNews';

interface CompanyDetailModalProps {
  canonicalId: string | null;
  onClose: () => void;
  onSelectForTrade?: (canonicalId: string) => void;
  onAddToCompare?: (canonicalId: string) => void;
}

type TabType = 'OVERVIEW' | 'NEWS' | 'FILINGS' | 'PRICES' | 'NOTES';

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  canonicalId,
  onClose,
  onSelectForTrade,
  onAddToCompare,
}) => {
  const { state, dispatch } = useStockGame();
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [newsFilter, setNewsFilter] = useState<'ALL' | '1Y' | 'FILING' | 'PRODUCT'>('ALL');
  const [selectedNewsForAnalysis, setSelectedNewsForAnalysis] = useState<HistoricalNewsItem | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canonicalId && state.investmentNotes[canonicalId]) {
      setNoteText(state.investmentNotes[canonicalId]);
    } else {
      setNoteText('');
    }
    setIsNoteSaved(false);
  }, [canonicalId, state.investmentNotes]);

  // Keyboard accessibility: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!canonicalId) return null;

  const currentYear = state.currentYear;
  const cutoffDate = getDecisionCutoffDate(currentYear);
  const overview = getCompanyOverviewAtYear(canonicalId, currentYear);
  const stats = getHistoricalStockStats(canonicalId, currentYear - 1, state.settings.includeFxEffect);
  const isWatchlisted = state.watchlist.includes(canonicalId);
  const userHolding = state.holdings[canonicalId];

  // News available strictly up to cutoffDate
  const allAvailableNews = getAvailableNewsForYear(currentYear, { canonicalCompanyId: canonicalId });
  const filteredNews = allAvailableNews.filter(n => {
    if (newsFilter === '1Y') {
      const priorYearStr = (currentYear - 1).toString();
      return n.publishedAt.startsWith(priorYearStr);
    }
    if (newsFilter === 'FILING') return n.sourceType === 'FILING';
    if (newsFilter === 'PRODUCT') return n.categories.includes('신제품') || n.categories.includes('기술혁신');
    return true;
  });

  const handleSaveNote = () => {
    dispatch({ type: 'SAVE_NOTE', payload: { canonicalId, note: noteText } });
    setIsNoteSaved(true);
    setTimeout(() => setIsNoteSaved(false), 2000);
  };

  const handleToggleWatchlist = () => {
    dispatch({ type: 'TOGGLE_WATCHLIST', payload: canonicalId });
  };

  // Price history points up to decision cutoff
  const priceHistory: { year: number; priceKRW: number | null }[] = [];
  for (let y = overview.firstValidYear - 1; y <= currentYear - 1; y++) {
    priceHistory.push({
      year: y,
      priceKRW: getStockPriceKRW(canonicalId, y),
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-modal-title"
      >
        <div
          ref={modalRef}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Banner Notice */}
          <div className="px-6 py-2 bg-indigo-950/80 border-b border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                현재 표시되는 정보는 <strong className="text-white">{cutoffDate}</strong>까지 당시 투자자가 확인할 수 있었던 자료입니다.
              </span>
            </div>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200 font-medium">
              {currentYear}년 투자 결정 시점
            </span>
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xl shadow-inner">
                {overview.nameKo.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="company-modal-title" className="text-xl font-bold text-white">
                    {overview.nameKo}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {overview.ticker}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${overview.market === 'KR' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {overview.market === 'KR' ? '한국(KRX)' : '미국(US)'}
                  </span>
                  {!overview.isListed && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      상장 전 (Pre-IPO)
                    </span>
                  )}
                  {userHolding && userHolding.shares > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      보유 중
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  업종: {overview.sector} | 상장일: {overview.listingDate}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleWatchlist}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${isWatchlisted ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'}`}
                title={isWatchlisted ? '관심종목 해제' : '관심종목 추가'}
              >
                <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{isWatchlisted ? '관심종목' : '관심 추가'}</span>
              </button>

              {onAddToCompare && (
                <button
                  onClick={() => onAddToCompare(canonicalId)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>기업 비교</span>
                </button>
              )}

              {onSelectForTrade && overview.isListed && (
                <button
                  onClick={() => onSelectForTrade(canonicalId)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>주문창 열기</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>1. 기업 개요</span>
            </button>
            <button
              onClick={() => setActiveTab('NEWS')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'NEWS' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>2. 당시 뉴스 ({allAvailableNews.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('FILINGS')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'FILINGS' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. 공시·실적</span>
            </button>
            <button
              onClick={() => setActiveTab('PRICES')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'PRICES' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>4. 과거 주가·통계</span>
            </button>
            <button
              onClick={() => setActiveTab('NOTES')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'NOTES' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>5. 투자 메모</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-5">
                <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                  <div className="text-xs font-bold text-indigo-400 mb-1">
                    {currentYear}년 기준 당시 주요 사업 및 영업 구조
                  </div>
                  <p className="text-slate-200 leading-relaxed text-sm">
                    {overview.contemporaryBusiness}
                  </p>
                </div>

                {/* Historical Aliases & Renaming Table */}
                {overview.historicalAliases.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      사명 및 티커 변천사 (Historical Aliases)
                    </h4>
                    <div className="overflow-hidden border border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-semibold">
                          <tr>
                            <th className="p-2.5">적용 기간</th>
                            <th className="p-2.5">당시 사명</th>
                            <th className="p-2.5">티커</th>
                            <th className="p-2.5">관계</th>
                            <th className="p-2.5">당시 사업</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {overview.historicalAliases.map((a, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="p-2.5 text-slate-400 font-mono">
                                {a.validFrom.slice(0, 4)} ~ {a.validTo ? a.validTo.slice(0, 4) : '현재'}
                              </td>
                              <td className="p-2.5 font-bold text-white">{a.historicalName}</td>
                              <td className="p-2.5 font-mono">{a.ticker || '-'}</td>
                              <td className="p-2.5 text-indigo-400">{a.relationship}</td>
                              <td className="p-2.5 text-slate-400">{a.contemporaryBusinessKo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Data Coverage Status */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">데이터 신뢰도 및 커버리지: </span>
                    <span className="font-bold text-emerald-400">
                      {overview.coverageStatus === 'SUFFICIENT' ? '충분 (공식공시 및 언론기사)' : overview.coverageStatus === 'PARTIAL' ? '일부 공식자료 중심' : '검증된 역사적 기록'}
                    </span>
                  </div>
                  <span className="text-slate-500">DART/EDGAR/KRX 검증 완료</span>
                </div>
              </div>
            )}

            {/* TAB 2: CONTEMPORARY NEWS */}
            {activeTab === 'NEWS' && (
              <div className="space-y-4">
                {/* News Filter Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setNewsFilter('ALL')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${newsFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    전체 공개 뉴스 ({allAvailableNews.length})
                  </button>
                  <button
                    onClick={() => setNewsFilter('1Y')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${newsFilter === '1Y' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    최근 1년 뉴스
                  </button>
                  <button
                    onClick={() => setNewsFilter('FILING')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${newsFilter === 'FILING' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    공식 공시·실적
                  </button>
                  <button
                    onClick={() => setNewsFilter('PRODUCT')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${newsFilter === 'PRODUCT' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    신제품·기술투자
                  </button>
                </div>

                {/* News Items List */}
                {filteredNews.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                    <p className="text-slate-300 font-semibold">
                      {cutoffDate}까지 확인된 관련 뉴스/공시가 없습니다.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      당시 디지털 공시 이전이거나 검증된 언론 기사가 제한적인 시기입니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNews.map(item => (
                      <div
                        key={item.id}
                        className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl hover:border-indigo-500/50 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-indigo-400">
                                {item.publishedAt}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                {item.sourceType}
                              </span>
                              {item.categories.map(c => (
                                <span key={c} className="text-[11px] text-slate-400">
                                  #{c}
                                </span>
                              ))}
                            </div>
                            <h4 className="text-base font-bold text-white leading-snug">
                              {item.titleKo}
                            </h4>
                          </div>

                          <button
                            onClick={() => setSelectedNewsForAnalysis(item)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all flex items-center gap-1 shrink-0"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>해설 보기</span>
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
                          {item.summaryKo}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>출처: {item.sourceName}</span>
                          {item.sourceUrl && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition-colors"
                            >
                              <span>출처 링크</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FILINGS & FINANCIALS */}
            {activeTab === 'FILINGS' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-300 mb-2">
                    {cutoffDate} 기준 공식 실적 및 제출 공시
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    기업의 과거 공시자료는 당시 제출된 연차보고서 및 결산 공시를 바탕으로 제공됩니다. 회계기준 변동 시 단순 시계열 비교에 주의하십시오.
                  </p>

                  <div className="space-y-2">
                    {allAvailableNews
                      .filter(n => n.sourceType === 'FILING' || n.categories.includes('실적'))
                      .map(f => (
                        <div
                          key={f.id}
                          className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono text-indigo-400 mr-2">{f.publishedAt}</span>
                            <span className="font-bold text-white">{f.titleKo}</span>
                          </div>
                          <button
                            onClick={() => setSelectedNewsForAnalysis(f)}
                            className="text-xs text-indigo-400 hover:underline"
                          >
                            공시 상세
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PAST PRICES & STATS */}
            {activeTab === 'PRICES' && (
              <div className="space-y-5">
                {/* Historical Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">직전 1년 수익률</div>
                    <div className={`text-base font-bold ${stats.last1YrReturn !== null && stats.last1YrReturn >= 0 ? 'text-rose-400' : 'text-sky-400'}`}>
                      {stats.last1YrReturn === null ? '-' : formatPercent(stats.last1YrReturn)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">과거 3년 CAGR</div>
                    <div className={`text-base font-bold ${stats.past3YrCAGR !== null && stats.past3YrCAGR >= 0 ? 'text-rose-400' : 'text-sky-400'}`}>
                      {stats.past3YrCAGR === null ? '-' : formatPercent(stats.past3YrCAGR)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">과거 연간 변동성</div>
                    <div className="text-base font-bold text-slate-200">
                      {stats.historicalVolatility === null ? '-' : formatPercent(stats.historicalVolatility)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">과거 최대낙폭 (MDD)</div>
                    <div className="text-base font-bold text-amber-400">
                      {stats.historicalMDD === null ? '-' : formatPercent(stats.historicalMDD)}
                    </div>
                  </div>
                </div>

                {/* Past Price History Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    과거 연말 주가 기록 ({overview.firstValidYear - 1} ~ {currentYear - 1}년)
                  </h4>
                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2.5">연말 기준</th>
                          <th className="p-2.5">원화 환산 주가 (KRW)</th>
                          <th className="p-2.5">데이터 품질</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {priceHistory.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-mono text-slate-400">{p.year}년 말</td>
                            <td className="p-2.5 font-bold text-white">
                              {p.priceKRW !== null ? formatKRW(p.priceKRW) : '상장 전 / 결측'}
                            </td>
                            <td className="p-2.5 text-emerald-400 font-semibold">수정주가(TR)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>미래 연도({currentYear}~2025년) 주가 데이터는 사후지식 편향 방지를 위해 엄격히 차단되어 있습니다.</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: INVESTMENT NOTES */}
            {activeTab === 'NOTES' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="company-note-textarea" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{overview.nameKo} 투자 메모 및 가설 기록</span>
                    </label>
                    {isNoteSaved && (
                      <span className="text-xs font-bold text-emerald-400 animate-pulse">
                        저장되었습니다!
                      </span>
                    )}
                  </div>
                  <textarea
                    id="company-note-textarea"
                    rows={6}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="이 기업에 대한 투자 근거, 확인된 뉴스, 예상 기회 요인, 위험 요인, 매도 조건 등을 기록하십시오. (작성된 메모는 연말 회고 화면 및 최종 결과 보고서에 연동됩니다)"
                    className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs leading-relaxed focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleSaveNote}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                    >
                      메모 저장하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {overview.nameKo} ({overview.ticker}) | {overview.sector}
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* Neutral News Analysis Modal */}
      {selectedNewsForAnalysis && (
        <NeutralNewsAnalysisModal
          newsItem={selectedNewsForAnalysis}
          onClose={() => setSelectedNewsForAnalysis(null)}
        />
      )}
    </>
  );
};
