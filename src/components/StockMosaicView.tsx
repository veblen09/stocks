import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  Table as TableIcon,
  Search,
  Coins,
  PieChart,
  Layers,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  Flame,
} from 'lucide-react';
import { MosaicTile } from './MosaicTile';
import type { TradableStockItem, MosaicViewMode } from '../types/stockUniverse';
import type { StockHolding } from '../types/stockGame';
import { formatKRW, formatCompactKRW, formatPercent } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';
import { getCompany1YrSparkline } from '../engine/companyChartEngine';
import { getStockPriceKRW, getStockPriceLocal } from '../engine/returnEngine';

interface StockMosaicViewProps {
  tradableStocks: TradableStockItem[];
  allTradableCount: number;
  krTradableCount: number;
  usTradableCount: number;
  currentYear: number;
  cashKRW: number;
  holdings: Record<string, StockHolding>;
  watchlist: string[];
  draftTargetWeights: Record<string, number>;
  selectedCanonicalId: string | null;
  onSelectStock: (canonicalId: string) => void;
  onUpdateDraftTargetWeight: (canonicalId: string, weight: number) => void;
  onToggleWatchlist?: (canonicalId: string) => void;
  onOpenNewListingModal?: () => void;
  yearEndReturns?: Record<string, number | null>;
  isYearEnd?: boolean;
}

export const StockMosaicView: React.FC<StockMosaicViewProps> = ({
  tradableStocks,
  allTradableCount,
  krTradableCount,
  usTradableCount,
  currentYear,
  cashKRW,
  holdings,
  watchlist,
  draftTargetWeights,
  selectedCanonicalId,
  onSelectStock,
  onUpdateDraftTargetWeight,
  onToggleWatchlist,
  onOpenNewListingModal,
  yearEndReturns,
  isYearEnd = false,
}) => {
  const [viewFormat, setViewFormat] = useState<'MOSAIC' | 'TABLE'>('MOSAIC');
  const [mosaicMode, setMosaicMode] = useState<MosaicViewMode>(isYearEnd ? 'YEAR_END_PERFORMANCE' : 'EXPLORE');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'KR' | 'US' | 'NEW' | 'HOLDING' | 'WATCHLIST'>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'NAME' | 'TARGET_WEIGHT' | 'HOLDING_WEIGHT' | 'NEWS_COUNT'>('DEFAULT');

  // Compute portfolio total market value for holding weights
  const holdingStockValues = Object.values(holdings).reduce((sum, h) => sum + (h.currentValueKRW || 0), 0);
  const totalPortfolioValue = cashKRW + holdingStockValues;

  // Newly listed stocks among tradable
  const newlyListedStocks = useMemo(() => {
    return tradableStocks.filter(s => s.isNewlyListed);
  }, [tradableStocks]);

  // Available unique sectors among currently tradable stocks
  const availableSectors = useMemo(() => {
    const sSet = new Set<string>();
    tradableStocks.forEach(s => sSet.add(s.sector));
    return Array.from(sSet);
  }, [tradableStocks]);

  // Effective target weights calculation across holdings & drafts
  const effectiveTargetWeights = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cid, h] of Object.entries(holdings)) {
      const val = h?.currentValueKRW || 0;
      map[cid] = totalPortfolioValue > 0 ? val / totalPortfolioValue : 0;
    }
    for (const [cid, w] of Object.entries(draftTargetWeights)) {
      map[cid] = w;
    }
    return map;
  }, [holdings, draftTargetWeights, totalPortfolioValue]);

  // Target Cash Calculation
  const totalStockTarget = useMemo(() => {
    return Object.values(effectiveTargetWeights).reduce((sum, w) => sum + w, 0);
  }, [effectiveTargetWeights]);
  const draftCashTargetWeight = Math.max(0, 1.0 - totalStockTarget);
  const projectedCashKRW = totalPortfolioValue * draftCashTargetWeight;

  // Filter and Sort stocks
  const filteredAndSortedStocks = useMemo(() => {
    let list = tradableStocks.filter(stock => {
      // Market filter
      if (marketFilter === 'KR' && stock.market !== 'KR') return false;
      if (marketFilter === 'US' && stock.market !== 'US') return false;
      if (marketFilter === 'NEW' && !stock.isNewlyListed) return false;
      if (marketFilter === 'HOLDING' && !holdings[stock.canonicalId]) return false;
      if (marketFilter === 'WATCHLIST' && !watchlist.includes(stock.canonicalId)) return false;

      // Sector filter
      if (sectorFilter !== 'ALL' && stock.sector !== sectorFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = stock.nameKo.toLowerCase().includes(q);
        const matchTicker = stock.ticker.toLowerCase().includes(q);
        const matchSector = stock.sector.toLowerCase().includes(q);
        if (!matchName && !matchTicker && !matchSector) return false;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'NAME') {
        return a.nameKo.localeCompare(b.nameKo);
      }
      if (sortBy === 'TARGET_WEIGHT') {
        const wA = draftTargetWeights[a.canonicalId] || 0;
        const wB = draftTargetWeights[b.canonicalId] || 0;
        return wB - wA;
      }
      if (sortBy === 'HOLDING_WEIGHT') {
        const vA = holdings[a.canonicalId]?.currentValueKRW || 0;
        const vB = holdings[b.canonicalId]?.currentValueKRW || 0;
        return vB - vA;
      }
      if (sortBy === 'NEWS_COUNT') {
        return b.newsCount - a.newsCount;
      }
      // Default: Newly listed first, then market/name
      if (a.isNewlyListed && !b.isNewlyListed) return -1;
      if (!a.isNewlyListed && b.isNewlyListed) return 1;
      return 0;
    });

    return list;
  }, [tradableStocks, marketFilter, sectorFilter, searchQuery, sortBy, draftTargetWeights, watchlist, holdings]);

  // Handler for filter change with sound
  const handleMarketFilterChange = (filter: 'ALL' | 'KR' | 'US' | 'NEW' | 'HOLDING' | 'WATCHLIST') => {
    audioManager.playUiSound('filter');
    setMarketFilter(filter);
  };

  const handleModeChange = (mode: MosaicViewMode) => {
    audioManager.playUiSound('filter');
    setMosaicMode(mode);
  };

  const handleViewFormatToggle = () => {
    audioManager.playUiSound('keyTap');
    setViewFormat(viewFormat === 'MOSAIC' ? 'TABLE' : 'MOSAIC');
  };

  return (
    <div className="space-y-4">
      {/* Newly Listed Stocks Banner (Shown when new listings exist in currentYear) */}
      {newlyListedStocks.length > 0 && (
        <div className="bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 rounded-2xl p-0.5 shadow-md shadow-amber-500/10 animate-fade-in">
          <div className="bg-white/95 rounded-[14px] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles size={18} className="text-amber-600 fill-amber-500 animate-pulse" />
              </span>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                    <Flame size={11} className="text-amber-600 fill-amber-500" />
                    {currentYear}년 신규 상장 기업 ({newlyListedStocks.length}개사)
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    {newlyListedStocks.map(s => s.nameKo).join(', ')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  정규 증권시장에 첫 상장되어 거래가 개시되었습니다. 기업 소개와 공모 정보를 확인하고 포트폴리오에 편입해보세요.
                </p>
              </div>
            </div>

            {onOpenNewListingModal && (
              <button
                type="button"
                onClick={onOpenNewListingModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>신규 상장 기업 소개 팝업 보기</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Top Control Bar: Filters, Search & View Mode Switcher */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        {/* Row 1: Market Tabs & Format Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Market Filter Keycaps */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleMarketFilterChange('ALL')}
              aria-pressed={marketFilter === 'ALL'}
              className={`filter-key ${marketFilter === 'ALL' ? 'is-active' : ''}`}
            >
              <span>전체</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                {allTradableCount}
              </span>
            </button>

            {newlyListedStocks.length > 0 && (
              <button
                type="button"
                onClick={() => handleMarketFilterChange('NEW')}
                aria-pressed={marketFilter === 'NEW'}
                className={`filter-key ${
                  marketFilter === 'NEW'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Sparkles size={12} className={marketFilter === 'NEW' ? 'text-white' : 'text-amber-600'} />
                <span>신규 상장</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  marketFilter === 'NEW' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900'
                }`}>
                  {newlyListedStocks.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleMarketFilterChange('KR')}
              aria-pressed={marketFilter === 'KR'}
              className={`filter-key ${marketFilter === 'KR' ? 'is-active' : ''}`}
            >
              <span>🇰🇷 한국</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                {krTradableCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleMarketFilterChange('US')}
              aria-pressed={marketFilter === 'US'}
              className={`filter-key ${marketFilter === 'US' ? 'is-active' : ''}`}
            >
              <span>🇺🇸 미국</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800">
                {usTradableCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleMarketFilterChange('HOLDING')}
              aria-pressed={marketFilter === 'HOLDING'}
              className={`filter-key ${marketFilter === 'HOLDING' ? 'is-active' : ''}`}
            >
              <span>보유종목</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                {Object.keys(holdings).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleMarketFilterChange('WATCHLIST')}
              aria-pressed={marketFilter === 'WATCHLIST'}
              className={`filter-key ${marketFilter === 'WATCHLIST' ? 'is-active' : ''}`}
            >
              <span>관심종목</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                {watchlist.length}
              </span>
            </button>
          </div>

          {/* View Format (Mosaic vs Table) */}
          <button
            type="button"
            onClick={handleViewFormatToggle}
            className="filter-key"
            aria-label={viewFormat === 'MOSAIC' ? '표 형태로 보기' : '모자이크 타일로 보기'}
          >
            {viewFormat === 'MOSAIC' ? (
              <>
                <TableIcon size={14} className="text-slate-600" />
                <span>표로 보기</span>
              </>
            ) : (
              <>
                <LayoutGrid size={14} className="text-slate-600" />
                <span>모자이크 보기</span>
              </>
            )}
          </button>
        </div>

        {/* Row 2: Search, Sector & Sorting */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Search Box */}
          <div className="relative sm:col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="기업명, 티커, 업종 검색..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sector Filter */}
          <div>
            <select
              value={sectorFilter}
              onChange={e => {
                audioManager.playUiSound('filter');
                setSectorFilter(e.target.value);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">전체 업종 ({availableSectors.length})</option>
              {availableSectors.map(sec => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortBy}
              onChange={e => {
                audioManager.playUiSound('filter');
                setSortBy(e.target.value as any);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="DEFAULT">기본 정렬 (신규상장순)</option>
              <option value="NAME">이름순 (가나다/ABC)</option>
              <option value="TARGET_WEIGHT">목표 비중 높은순</option>
              <option value="HOLDING_WEIGHT">보유 비중 높은순</option>
              <option value="NEWS_COUNT">공개 뉴스 많은순</option>
            </select>
          </div>
        </div>

        {/* Row 3: Mosaic View Mode Buttons */}
        {viewFormat === 'MOSAIC' && (
          <div className="flex items-center gap-1 pt-2 border-t border-slate-100 flex-wrap">
            <span className="text-[12px] font-bold text-slate-500 mr-1.5">보기 모드:</span>
            <button
              type="button"
              onClick={() => handleModeChange('EXPLORE')}
              aria-pressed={mosaicMode === 'EXPLORE'}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mosaicMode === 'EXPLORE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers size={13} />
              <span>탐색 모드</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('TARGET_ALLOCATION')}
              aria-pressed={mosaicMode === 'TARGET_ALLOCATION'}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mosaicMode === 'TARGET_ALLOCATION'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <PieChart size={13} />
              <span>목표배분 모드</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('HOLDINGS_WEIGHT')}
              aria-pressed={mosaicMode === 'HOLDINGS_WEIGHT'}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mosaicMode === 'HOLDINGS_WEIGHT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Coins size={13} />
              <span>실제보유 모드</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Keyboard Chassis / Deck Container */}
      <div className="stock-keyboard-deck">
        {viewFormat === 'MOSAIC' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {/* Spacebar-Style Cash Keycap */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => audioManager.playUiSound('keyTap')}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && audioManager.playUiSound('keyTap')}
              className="cash-key"
              aria-label={`현금 잔고 ${formatKRW(cashKRW)}, 목표 현금비중 ${Math.round(draftCashTargetWeight * 100)}%`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900 font-bold text-[11px]">
                    💵 가용 현금
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    스페이스바 / 안전자산
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-800">
                  {totalPortfolioValue > 0 ? ((cashKRW / totalPortfolioValue) * 100).toFixed(1) : 100}%
                </span>
              </div>

              <div className="my-1.5">
                <span className="text-xs text-emerald-700 font-medium block">현재 보유 현금</span>
                <span className="text-[17px] sm:text-[19px] font-mono font-bold text-emerald-950 block tracking-tight">
                  {formatKRW(cashKRW)}
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-300/60 flex items-center justify-between text-xs font-semibold text-emerald-900">
                <span>목표 현금 비중:</span>
                <span className="font-mono font-bold text-emerald-800 text-[14px]">
                  {Math.round(draftCashTargetWeight * 100)}% ({formatKRW(projectedCashKRW)})
                </span>
              </div>
            </div>

            {/* Tradable Stock Keycaps */}
            {filteredAndSortedStocks.map(stock => {
              const holding = holdings[stock.canonicalId];
              const holdingVal = holding ? holding.currentValueKRW || 0 : 0;
              const holdingWeight = totalPortfolioValue > 0 ? holdingVal / totalPortfolioValue : 0;
              const hasExplicitDraft = draftTargetWeights[stock.canonicalId] !== undefined;
              const draftWeight = hasExplicitDraft ? draftTargetWeights[stock.canonicalId] : 0;
              const effectiveWeight = effectiveTargetWeights[stock.canonicalId] || 0;
              const yearReturn = yearEndReturns ? yearEndReturns[stock.canonicalId] : null;
              const otherStocksSum = totalStockTarget - effectiveWeight;
              const availableHeadroom = Math.max(0, Math.round((1.0 - otherStocksSum) * 100000000) / 100000000);

              return (
                <MosaicTile
                  key={stock.canonicalId}
                  stock={stock}
                  mode={mosaicMode}
                  currentYear={currentYear}
                  totalPortfolioValue={totalPortfolioValue}
                  draftTargetWeight={draftWeight}
                  hasExplicitDraft={hasExplicitDraft}
                  availableHeadroom={availableHeadroom}
                  currentHoldingWeight={holdingWeight}
                  currentHoldingValueKRW={holdingVal}
                  yearEndReturn={yearReturn}
                  isSelected={selectedCanonicalId === stock.canonicalId}
                  isWatchlisted={watchlist.includes(stock.canonicalId)}
                  onClick={() => onSelectStock(stock.canonicalId)}
                  onToggleWatchlist={onToggleWatchlist}
                  onQuickAdjustTarget={newWeight => onUpdateDraftTargetWeight(stock.canonicalId, newWeight)}
                />
              );
            })}

          </div>
        ) : (
          /* Table View Alternative */
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-3">종목명 / 티커</th>
                  <th className="p-3">국가 / 업종</th>
                  <th className="p-3 text-right">기준 주가</th>
                  <th className="p-3 text-center">1년 주가 추이</th>
                  <th className="p-3 text-right">보유 수량 / 금액</th>
                  <th className="p-3 text-right">보유 비중</th>
                  <th className="p-3 text-right">목표 매수 금액</th>
                  <th className="p-3 text-center">빠른 금액 조절</th>
                  <th className="p-3 text-center">뉴스</th>
                  <th className="p-3 text-center">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedStocks.map(stock => {
                  const holding = holdings[stock.canonicalId];
                  const holdingVal = holding ? holding.currentValueKRW || 0 : 0;
                  const holdingWeight = totalPortfolioValue > 0 ? holdingVal / totalPortfolioValue : 0;
                  const hasExplicitDraft = draftTargetWeights[stock.canonicalId] !== undefined;
                  const draftWeight = hasExplicitDraft ? draftTargetWeights[stock.canonicalId] : 0;
                  const effectiveWeight = effectiveTargetWeights[stock.canonicalId] || 0;
                  const targetAmount = Math.round(effectiveWeight * totalPortfolioValue);
                  const otherStocksSum = totalStockTarget - effectiveWeight;
                  const availableHeadroom = Math.max(0, Math.round((1.0 - otherStocksSum) * 100000000) / 100000000);
                  const canIncrease = effectiveWeight < availableHeadroom - 0.000001;
                  const sparkline = getCompany1YrSparkline(stock.canonicalId, currentYear - 1);
                  const defaultBuyAmount = totalPortfolioValue >= 2000000 ? 1000000 : Math.round(totalPortfolioValue * 0.1);
                  const defaultBuyWeight = totalPortfolioValue > 0 ? defaultBuyAmount / totalPortfolioValue : 0.1;

                  const priorYear = currentYear - 1;
                  const rawP_KRW = getStockPriceKRW(stock.canonicalId, priorYear) ?? getStockPriceKRW(stock.canonicalId, currentYear) ?? stock.listingEvent?.firstValidPrice ?? stock.listingEvent?.ipoOfferingPrice ?? null;
                  const rawP_Local = getStockPriceLocal(stock.canonicalId, priorYear) ?? getStockPriceLocal(stock.canonicalId, currentYear) ?? stock.listingEvent?.firstValidPrice ?? stock.listingEvent?.ipoOfferingPrice ?? null;
                  const isKR = stock.market === 'KR';

                  const tablePrice = isKR
                    ? (rawP_KRW !== null && rawP_KRW > 0 ? `${Math.round(rawP_KRW).toLocaleString()}원` : '-')
                    : (rawP_Local !== null && rawP_Local > 0
                        ? (rawP_Local >= 100
                            ? `$${rawP_Local.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                            : `$${rawP_Local.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
                        : '-');
                  const tableKrwHint = !isKR && rawP_KRW !== null && rawP_KRW > 0 ? `약 ${formatCompactKRW(rawP_KRW)}` : null;

                  return (
                    <tr
                      key={stock.canonicalId}
                      className={`hover:bg-blue-50/50 transition cursor-pointer ${
                        hasExplicitDraft ? 'bg-blue-50/30 font-medium' : ''
                      }`}
                      onClick={() => onSelectStock(stock.canonicalId)}
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-sm">{stock.nameKo}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{stock.ticker}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-700">{stock.market === 'KR' ? '한국' : '미국'}</span>
                        <span className="text-slate-400"> · </span>
                        <span className="text-slate-600">{stock.sector}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="font-mono font-black text-slate-950 text-[13.5px]">{tablePrice}</div>
                        {tableKrwHint && (
                          <div className="font-mono text-[10.5px] font-semibold text-slate-500">({tableKrwHint})</div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {sparkline && sparkline.points.length > 1 ? (
                          <div className="flex items-center justify-center gap-2">
                            <svg viewBox="0 0 80 24" className="w-16 h-5 overflow-visible">
                              <path
                                d={sparkline.svgPath}
                                fill="none"
                                stroke={sparkline.isPositive ? '#ef4444' : '#3b82f6'}
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span
                              className={`font-mono font-bold text-[11px] ${
                                sparkline.isPositive ? 'text-red-600' : 'text-blue-600'
                              }`}
                            >
                              {sparkline.isPositive ? '▲' : '▼'}
                              {formatPercent(Math.abs(sparkline.return1Yr))}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {holding ? `${formatKRW(holding.currentValueKRW)} (${holding.shares.toFixed(2)}주)` : '미보유'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        {formatPercent(holdingWeight)}
                      </td>
                      <td className="p-3 text-right">
                        {draftWeight > 0.0001 ? (
                          <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                            {formatCompactKRW(targetAmount)} ({Math.round(draftWeight * 100)}%)
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400">0원</span>
                        )}
                      </td>
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        {draftWeight <= 0.0001 ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                audioManager.playUiSound('allocationUp');
                                onUpdateDraftTargetWeight(stock.canonicalId, Math.min(availableHeadroom, defaultBuyWeight));
                              }}
                              disabled={availableHeadroom < 0.01}
                              className="buy-btn-primary py-1 px-2.5 text-[11px] font-bold"
                            >
                              <ShoppingCart size={12} />
                              <span>+{formatCompactKRW(defaultBuyAmount)} 담기</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                audioManager.playUiSound('allocationDown');
                                onUpdateDraftTargetWeight(stock.canonicalId, 0);
                              }}
                              className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200"
                              title="매수 취소 (0원)"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                audioManager.playUiSound('allocationDown');
                                const step = 1000000 / (totalPortfolioValue || 10000000);
                                onUpdateDraftTargetWeight(stock.canonicalId, Math.max(0, draftWeight - step));
                              }}
                              className="buy-btn-chip text-[10px] py-0.5 px-1.5"
                            >
                              -100만
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                audioManager.playUiSound('allocationDown');
                                const step = 10000 / (totalPortfolioValue || 10000000);
                                onUpdateDraftTargetWeight(stock.canonicalId, Math.max(0, draftWeight - step));
                              }}
                              className="buy-btn-chip text-[10px] py-0.5 px-1.5"
                              title="1만원 미세 감소"
                            >
                              -1만
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!canIncrease) return;
                                audioManager.playUiSound('allocationUp');
                                const step = 10000 / (totalPortfolioValue || 10000000);
                                onUpdateDraftTargetWeight(stock.canonicalId, Math.min(availableHeadroom, draftWeight + step));
                              }}
                              disabled={!canIncrease}
                              className="buy-btn-chip text-[10px] py-0.5 px-1.5"
                              title="1만원 미세 증가"
                            >
                              +1만
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!canIncrease) return;
                                audioManager.playUiSound('allocationUp');
                                const step = 1000000 / (totalPortfolioValue || 10000000);
                                onUpdateDraftTargetWeight(stock.canonicalId, Math.min(availableHeadroom, draftWeight + step));
                              }}
                              disabled={!canIncrease}
                              className="buy-btn-chip text-[10px] py-0.5 px-1.5"
                            >
                              +100만
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[11px] text-slate-700">
                          {stock.newsCount}건
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onSelectStock(stock.canonicalId);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-300 transition"
                        >
                          상세
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {filteredAndSortedStocks.length === 0 && (
          <div className="p-12 text-center bg-white/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">해당 조건의 투자 가능 기업이 없습니다</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {currentYear}년 당시 실제로 상장되어 거래 가능했던 기업만 표시됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                audioManager.playUiSound('keyTap');
                setMarketFilter('ALL');
                setSectorFilter('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw size={13} />
              <span>검색 및 필터 초기화</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
