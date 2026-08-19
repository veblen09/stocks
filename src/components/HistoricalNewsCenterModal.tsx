import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Globe,
  ExternalLink,
  Star,
  Briefcase,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useStockGame } from '../store/stockGameStore';
import {
  getAvailableNewsForYear,
} from '../engine/newsEngine';
import { STOCKS_BY_ID } from '../engine/returnEngine';
import { NeutralNewsAnalysisModal } from './NeutralNewsAnalysisModal';
import { audioManager } from '../utils/audioManager';
import type { HistoricalNewsItem, NewsScope, NewsMarket } from '../types/stockNews';

interface HistoricalNewsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCompanyForDetail?: (canonicalId: string) => void;
}

export const HistoricalNewsCenterModal: React.FC<HistoricalNewsCenterModalProps> = ({
  isOpen,
  onClose,
  onSelectCompanyForDetail,
}) => {
  const { state } = useStockGame();
  const { currentYear, watchlist, holdings } = state;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<NewsScope | 'ALL'>('ALL');
  const [selectedMarket, setSelectedMarket] = useState<NewsMarket | 'ALL'>('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('ALL');
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  const [onlyWatchlist, setOnlyWatchlist] = useState(false);
  const [onlyHolding, setOnlyHolding] = useState(false);

  // Selected news item for neutral explanation modal
  const [selectedNewsForAnalysis, setSelectedNewsForAnalysis] = useState<HistoricalNewsItem | null>(null);

  // Keyboard shortcut (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !selectedNewsForAnalysis) {
        audioManager.playUiSound('modalClose');
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedNewsForAnalysis, onClose]);

  // Load all available news up to current cutoff date
  const allAvailableNews = useMemo(() => {
    if (!isOpen) return [];
    return getAvailableNewsForYear(currentYear);
  }, [isOpen, currentYear]);

  // Unique years in available news
  const availableYears = useMemo(() => {
    const ySet = new Set<number>();
    allAvailableNews.forEach(n => {
      const year = parseInt(n.publishedAt.split('-')[0], 10);
      if (!isNaN(year)) ySet.add(year);
    });
    return Array.from(ySet).sort((a, b) => b - a);
  }, [allAvailableNews]);

  // Filtered news list
  const filteredNews = useMemo(() => {
    return allAvailableNews.filter(news => {
      // Scope filter
      if (selectedScope !== 'ALL' && news.scope !== selectedScope) return false;

      // Market filter
      if (selectedMarket !== 'ALL') {
        if (news.market && news.market !== selectedMarket && news.market !== 'GLOBAL') return false;
      }

      // Year filter
      if (selectedYearFilter !== 'ALL') {
        const itemYear = news.publishedAt.split('-')[0];
        if (itemYear !== selectedYearFilter) return false;
      }

      // Only Official filter (DART / SEC / Regulators / Exchanges)
      if (onlyOfficial) {
        const isOfficialSource = ['GOVERNMENT', 'REGULATOR', 'EXCHANGE', 'FILING', 'COMPANY_IR'].includes(news.sourceType);
        if (!isOfficialSource) return false;
      }

      // Only Watchlist filter
      if (onlyWatchlist) {
        const hasWatchlistCompany = news.canonicalCompanyIds.some(cid => watchlist.includes(cid));
        if (!hasWatchlistCompany) return false;
      }

      // Only Holding filter
      if (onlyHolding) {
        const hasHoldingCompany = news.canonicalCompanyIds.some(cid => !!holdings[cid]);
        if (!hasHoldingCompany) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = news.titleKo.toLowerCase().includes(q);
        const matchSummary = news.summaryKo.toLowerCase().includes(q);
        const matchSource = news.sourceName.toLowerCase().includes(q);
        const matchCategory = news.categories.some(c => c.toLowerCase().includes(q));
        const matchSector = news.relatedSectors.some(s => s.toLowerCase().includes(q));
        const matchTicker = news.relatedTickers.some(t => t.toLowerCase().includes(q));

        let matchCompany = false;
        for (const cid of news.canonicalCompanyIds) {
          const s = STOCKS_BY_ID[cid];
          if (s && (s.nameKo.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q))) {
            matchCompany = true;
            break;
          }
        }

        if (!matchTitle && !matchSummary && !matchSource && !matchCategory && !matchSector && !matchTicker && !matchCompany) {
          return false;
        }
      }

      return true;
    });
  }, [
    allAvailableNews,
    selectedScope,
    selectedMarket,
    selectedYearFilter,
    onlyOfficial,
    onlyWatchlist,
    onlyHolding,
    searchQuery,
    watchlist,
    holdings,
  ]);

  if (!isOpen) return null;

  const handleClose = () => {
    audioManager.playUiSound('modalClose');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-center-title"
    >
      <GlassCard
        className="w-full max-w-5xl h-[92vh] max-h-[920px] bg-white border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-800 p-0"
        variant="default"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="news-center-title" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  역사적 뉴스 & 공시 검색센터
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono text-xs font-bold border border-blue-200">
                  총 {allAvailableNews.length}건 공개
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                당시 실제 언론 보도 및 정부·거래소·DART/SEC 법정 공시 원자료 검색 시스템
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0 space-y-3">
          {/* Row 1: Search Input & Scope Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="키워드, 기업명, 티커, 사건 검색..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedScope}
                onChange={e => {
                  audioManager.playUiSound('filter');
                  setSelectedScope(e.target.value as any);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">전체 범주 (거시/증시/기업)</option>
                <option value="GLOBAL_MACRO">글로벌 거시경제</option>
                <option value="KOREA_MACRO">한국 거시경제</option>
                <option value="US_MACRO">미국 거시경제</option>
                <option value="MARKET">증시 종합</option>
                <option value="SECTOR">업종·산업 뉴스</option>
                <option value="COMPANY">개별기업 공시·뉴스</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedYearFilter}
                onChange={e => {
                  audioManager.playUiSound('filter');
                  setSelectedYearFilter(e.target.value);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">전체 연도 ({availableYears.length}개년)</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Secondary Quick Filter Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Market Filter */}
              <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                {(['ALL', 'KR', 'US'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      audioManager.playUiSound('filter');
                      setSelectedMarket(m);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                      selectedMarket === m ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m === 'ALL' ? '전체 시장' : m === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}
                  </button>
                ))}
              </div>

              {/* Official Only */}
              <button
                type="button"
                onClick={() => {
                  audioManager.playUiSound('filter');
                  setOnlyOfficial(!onlyOfficial);
                }}
                className={`px-2.5 py-1 rounded-lg border font-bold transition flex items-center gap-1 ${
                  onlyOfficial
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>📜 공시·보고서만</span>
              </button>

              {/* Watchlist / Holdings */}
              <button
                type="button"
                onClick={() => {
                  audioManager.playUiSound('filter');
                  setOnlyWatchlist(!onlyWatchlist);
                }}
                className={`px-2.5 py-1 rounded-lg border font-bold transition flex items-center gap-1 ${
                  onlyWatchlist
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Star size={12} className={onlyWatchlist ? 'fill-amber-500 text-amber-500' : ''} />
                <span>관심종목 뉴스</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audioManager.playUiSound('filter');
                  setOnlyHolding(!onlyHolding);
                }}
                className={`px-2.5 py-1 rounded-lg border font-bold transition flex items-center gap-1 ${
                  onlyHolding
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Briefcase size={12} />
                <span>보유종목 뉴스</span>
              </button>
            </div>

            <span className="text-slate-500 font-medium">
              검색 결과: <strong className="text-slate-900 font-bold">{filteredNews.length}</strong>건
            </span>
          </div>
        </div>

        {/* News Items List Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-white">
          {filteredNews.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
              <Search size={32} className="text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">일치하는 역사적 뉴스가 없습니다.</p>
              <p className="text-xs text-slate-400">검색어 또는 필터 조건을 조정해 보세요.</p>
            </div>
          ) : (
            filteredNews.map(news => (
              <div
                key={news.id}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl space-y-2 transition shadow-xs"
              >
                {/* News Top Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-700 font-mono font-bold">{news.publishedAt}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">{news.sourceName}</span>
                    {news.evidenceLevel === 'PRIMARY_SOURCE' && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                        공식 원자료
                      </span>
                    )}
                    {news.isRetrospective && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                        후대 검증요약
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {news.canonicalCompanyIds.map(cid => {
                      const s = STOCKS_BY_ID[cid];
                      if (!s) return null;
                      return (
                        <button
                          key={cid}
                          type="button"
                          onClick={() => {
                            audioManager.playUiSound('tileOpen');
                            if (onSelectCompanyForDetail) {
                              onSelectCompanyForDetail(cid);
                              onClose();
                            }
                          }}
                          className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-200 rounded font-bold text-[11px] transition cursor-pointer"
                        >
                          {s.nameKo}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* News Title & Summary */}
                <h3 className="text-base font-bold text-slate-900 leading-snug">{news.titleKo}</h3>
                <p className="text-xs text-slate-700 leading-relaxed">{news.summaryKo}</p>

                {/* News Bottom Action */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500 font-mono">
                    {news.categories.map((c, idx) => (
                      <span key={idx}>#{c}</span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      audioManager.playUiSound('keyTap');
                      setSelectedNewsForAnalysis(news);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>중립 해설 및 당시 알 수 없었던 점 열기</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Neutral News Analysis Modal */}
      {selectedNewsForAnalysis && (
        <NeutralNewsAnalysisModal
          newsItem={selectedNewsForAnalysis}
          onClose={() => {
            audioManager.playUiSound('modalClose');
            setSelectedNewsForAnalysis(null);
          }}
        />
      )}
    </div>
  );
};
