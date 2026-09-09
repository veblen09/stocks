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
import rawBenchmarks from '../data/normalized/benchmarks.json';
import type { BenchmarksDataset } from '../types/stockGame';

const BENCHMARKS: BenchmarksDataset = rawBenchmarks as unknown as BenchmarksDataset;

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
  onOpenBenchmarkChart?: (key: 'BENCH_KOSPI' | 'BENCH_SP500') => void;
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
  onOpenBenchmarkChart,
  yearEndReturns,
  isYearEnd = false,
}) => {
  const [viewFormat, setViewFormat] = useState<'MOSAIC' | 'TABLE'>('MOSAIC');
  const [mosaicMode, setMosaicMode] = useState<MosaicViewMode>(isYearEnd ? 'YEAR_END_PERFORMANCE' : 'EXPLORE');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'KR' | 'US' | 'NEW' | 'HOLDING' | 'WATCHLIST'>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'NAME' | 'TARGET_WEIGHT' | 'HOLDING_WEIGHT' | 'NEWS_COUNT'>('DEFAULT');
  const [benchmarkChartMode, setBenchmarkChartMode] = useState<'CANDLE' | 'LINE'>('CANDLE');

  // Compute portfolio total market value for holding weights
  const holdingStockValues = Object.values(holdings).reduce((sum, h) => sum + (h.currentValueKRW || 0), 0);
  const totalPortfolioValue = cashKRW + holdingStockValues;

  // Benchmark levels and 1-Yr Sparklines for current cutoff year
  const kospiSparkline = useMemo(() => {
    return getCompany1YrSparkline('BENCH_KOSPI', currentYear);
  }, [currentYear]);

  const sp500Sparkline = useMemo(() => {
    return getCompany1YrSparkline('BENCH_SP500', currentYear);
  }, [currentYear]);

  const kospiCurrentLevel = BENCHMARKS.kospi?.prices?.[String(currentYear)] || BENCHMARKS.kospi?.prices?.[String(currentYear - 1)] || 100;
  const kospiPriorLevel = BENCHMARKS.kospi?.prices?.[String(currentYear - 1)] || kospiCurrentLevel;
  const kospiChangePt = kospiCurrentLevel - kospiPriorLevel;
  const kospiYearReturn = kospiSparkline ? kospiSparkline.return1Yr : (kospiPriorLevel > 0 ? (kospiCurrentLevel - kospiPriorLevel) / kospiPriorLevel : 0);

  const sp500CurrentLevel = BENCHMARKS.sp500?.prices?.[String(currentYear)] || BENCHMARKS.sp500?.prices?.[String(currentYear - 1)] || 100;
  const sp500PriorLevel = BENCHMARKS.sp500?.prices?.[String(currentYear - 1)] || sp500CurrentLevel;
  const sp500ChangePt = sp500CurrentLevel - sp500PriorLevel;
  const sp500YearReturn = sp500Sparkline ? sp500Sparkline.return1Yr : (sp500PriorLevel > 0 ? (sp500CurrentLevel - sp500PriorLevel) / sp500PriorLevel : 0);

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

        {/* Dedicated Row: Quick Benchmark Chart Launchers (Side-by-Side 2-Column Grid with Daily Candlestick / Line Mini Charts & Daily Volume) */}
        {onOpenBenchmarkChart && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3 pt-0.5">
            {/* 1. KOSPI 200 Benchmark Card */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onOpenBenchmarkChart('BENCH_KOSPI')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpenBenchmarkChart('BENCH_KOSPI'); }}
              className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-slate-50/70 hover:from-blue-100/90 text-blue-950 border border-blue-200/90 hover:border-blue-400 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between gap-2 active:scale-[0.995]"
              title="클릭 시 코스피 200 지수 인터랙티브 대형 차트 및 상세 분석 열기"
            >
              {/* Top Header: Badge, Level, Change, Mode Switcher, High/Low, Button */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-blue-100/90">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
                  <span className="font-black text-sm text-blue-950">🇰🇷 코스피 200</span>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded-md">KS200</span>
                  <span className="text-[10.5px] font-bold text-slate-500 font-mono">{currentYear}년</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Current Level */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black font-mono tabular-nums text-slate-900">
                      {kospiCurrentLevel.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">pt</span>
                  </div>

                  {/* Change & Return */}
                  <span
                    className={`text-[11px] font-mono tabular-nums font-black px-2 py-0.5 rounded-lg border shadow-2xs flex items-center gap-0.5 ${
                      kospiYearReturn >= 0
                        ? 'text-red-700 bg-red-50/95 border-red-200'
                        : 'text-blue-700 bg-blue-50/95 border-blue-200'
                    }`}
                  >
                    <span>{kospiYearReturn >= 0 ? '▲' : '▼'}</span>
                    <span>{kospiChangePt >= 0 ? '+' : ''}{kospiChangePt.toFixed(2)} pt</span>
                    <span className="text-[10px] font-bold opacity-85">({(kospiYearReturn * 100).toFixed(2)}%)</span>
                  </span>

                  {/* Mini Mode Switcher (일봉 vs 라인) */}
                  <div
                    className="flex items-center bg-white/90 p-0.5 rounded-lg border border-slate-200/90 text-[10px] font-bold shadow-2xs"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        audioManager.playUiSound('tab');
                        setBenchmarkChartMode('CANDLE');
                      }}
                      className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                        benchmarkChartMode === 'CANDLE'
                          ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      일봉
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        audioManager.playUiSound('tab');
                        setBenchmarkChartMode('LINE');
                      }}
                      className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                        benchmarkChartMode === 'LINE'
                          ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      라인
                    </button>
                  </div>

                  {/* High / Low Range */}
                  <div className="hidden sm:flex items-center gap-1 text-[10.5px] font-mono bg-white/90 px-1.5 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                    <span className="text-red-600 font-bold">고 {kospiSparkline?.maxPrice.toFixed(2)}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-blue-600 font-bold">저 {kospiSparkline?.minPrice.toFixed(2)}</span>
                  </div>

                  {/* Launch Big Chart Button */}
                  <span className="text-[11px] font-black text-blue-700 bg-blue-100 group-hover:bg-blue-200 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 shadow-2xs">
                    <span>차트</span>
                    <span className="text-[10px]">↗</span>
                  </span>
                </div>
              </div>

              {/* Main Mini Chart & Volume Area (Reduced to 2/3 Height) */}
              <div className="w-full bg-white/95 rounded-xl border border-blue-100/90 p-2 sm:p-2.5 shadow-2xs group-hover:border-blue-300 transition-colors flex flex-col gap-1.5">
                {kospiSparkline && kospiSparkline.points.length > 1 ? (
                  <>
                    {/* 1. Price Area (Daily Candlestick vs Wave Line) */}
                    <div className="w-full h-18 sm:h-20 relative overflow-visible">
                      {/* Scale Indicators & Legend */}
                      <div className="absolute left-1 top-0 flex items-center gap-1.5 z-10 pointer-events-none">
                        <span className="text-[9px] font-mono font-bold text-red-600 bg-red-50/90 px-1 py-0.2 rounded border border-red-100">
                          최고 {kospiSparkline.maxPrice.toFixed(2)} pt
                        </span>
                        {benchmarkChartMode === 'CANDLE' && (
                          <>
                            <span className="text-[8.5px] font-mono font-bold text-amber-600 bg-amber-50/80 px-1 py-0.2 rounded border border-amber-200/60 hidden sm:inline-block">
                              5일선
                            </span>
                            <span className="text-[8.5px] font-mono font-bold text-cyan-600 bg-cyan-50/80 px-1 py-0.2 rounded border border-cyan-200/60 hidden sm:inline-block">
                              20일선
                            </span>
                          </>
                        )}
                      </div>

                      <div className="absolute left-1 bottom-0 text-[9px] font-mono font-bold text-blue-600 bg-blue-50/90 px-1 py-0.2 rounded border border-blue-100 pointer-events-none z-10">
                        최저 {kospiSparkline.minPrice.toFixed(2)} pt
                      </div>
                      <div className="absolute right-1 top-0 text-[9px] font-mono font-bold text-slate-500 bg-slate-100/90 px-1 py-0.2 rounded pointer-events-none z-10">
                        시작 {kospiSparkline.startPrice.toFixed(2)} pt
                      </div>

                      {benchmarkChartMode === 'CANDLE' ? (
                        /* Daily Candlestick SVG (120 trading days) */
                        <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                          {/* Starting Baseline Reference */}
                          <line
                            x1="0"
                            y1={4 + 32 * (1 - (kospiSparkline.startPrice - kospiSparkline.minPrice) / (kospiSparkline.maxPrice - kospiSparkline.minPrice || 1))}
                            x2="120"
                            y2={4 + 32 * (1 - (kospiSparkline.startPrice - kospiSparkline.minPrice) / (kospiSparkline.maxPrice - kospiSparkline.minPrice || 1))}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                            vectorEffect="non-scaling-stroke"
                          />

                          {/* 120 Daily Candles (Wicks + Bodies) */}
                          {kospiSparkline.dailyCandles?.map((c, i) => {
                            const pRange = kospiSparkline.maxPrice - kospiSparkline.minPrice || 1;
                            const x = c.dayIdx + 0.375;
                            const yHigh = 4 + 32 * (1 - (c.high - kospiSparkline.minPrice) / pRange);
                            const yLow = 4 + 32 * (1 - (c.low - kospiSparkline.minPrice) / pRange);
                            const yOpen = 4 + 32 * (1 - (c.open - kospiSparkline.minPrice) / pRange);
                            const yClose = 4 + 32 * (1 - (c.close - kospiSparkline.minPrice) / pRange);
                            const candleColor = c.isYangbong ? '#f43f5e' : '#3b82f6';

                            return (
                              <g key={i}>
                                {/* Wick */}
                                <line
                                  x1={x}
                                  y1={yHigh}
                                  x2={x}
                                  y2={yLow}
                                  stroke={candleColor}
                                  strokeWidth="0.6"
                                  vectorEffect="non-scaling-stroke"
                                />
                                {/* Body */}
                                <rect
                                  x={x - 0.35}
                                  y={Math.min(yOpen, yClose)}
                                  width="0.75"
                                  height={Math.max(0.4, Math.abs(yClose - yOpen))}
                                  fill={candleColor}
                                  rx="0.1"
                                />
                              </g>
                            );
                          })}

                          {/* 20-Day MA Curve (Cyan) */}
                          {kospiSparkline.dailyMa20Path && (
                            <path
                              d={kospiSparkline.dailyMa20Path}
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="0.9"
                              vectorEffect="non-scaling-stroke"
                              opacity="0.85"
                            />
                          )}

                          {/* 5-Day MA Curve (Orange) */}
                          {kospiSparkline.dailyMa5Path && (
                            <path
                              d={kospiSparkline.dailyMa5Path}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="1.1"
                              vectorEffect="non-scaling-stroke"
                              opacity="0.95"
                            />
                          )}
                        </svg>
                      ) : (
                        /* Wave Line SVG */
                        <>
                          <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="bench-line-grad-kospi" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor={kospiSparkline.isPositive ? '#fb7185' : '#60a5fa'} />
                                <stop offset="100%" stopColor={kospiSparkline.isPositive ? '#e11d48' : '#2563eb'} />
                              </linearGradient>
                              <linearGradient id="bench-area-grad-kospi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={kospiSparkline.isPositive ? '#f43f5e' : '#3b82f6'} stopOpacity="0.10" />
                                <stop offset="100%" stopColor={kospiSparkline.isPositive ? '#f43f5e' : '#3b82f6'} stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Starting Baseline Reference */}
                            {kospiSparkline.points[0] && (
                              <line
                                x1="0"
                                y1={kospiSparkline.points[0].y}
                                x2="100"
                                y2={kospiSparkline.points[0].y}
                                stroke="#cbd5e1"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                                vectorEffect="non-scaling-stroke"
                              />
                            )}

                            {/* Gradient Area Fill */}
                            <path d={kospiSparkline.svgAreaPath} fill="url(#bench-area-grad-kospi)" />

                            {/* Crisp, Slim, Elegant Price Line */}
                            <path
                              d={kospiSparkline.svgPath}
                              fill="none"
                              stroke="url(#bench-line-grad-kospi)"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>

                          {/* Small circular live terminal dot */}
                          {kospiSparkline.points[kospiSparkline.points.length - 1] && (
                            <div
                              style={{
                                left: `${kospiSparkline.points[kospiSparkline.points.length - 1].x}%`,
                                top: `${(kospiSparkline.points[kospiSparkline.points.length - 1].y / 40) * 100}%`,
                              }}
                              className={`absolute w-2 h-2 rounded-full border-[1.5px] border-white shadow-xs -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 ${
                                kospiSparkline.isPositive ? 'bg-rose-600' : 'bg-blue-600'
                              }`}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* 2. Daily Volume Histogram Area (일별 거래량 120거래일) */}
                    <div className="w-full h-11 sm:h-12 pt-1 border-t border-slate-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-500 font-bold px-0.5">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          <span>일별 거래량</span>
                        </span>
                        <span className="text-[8.5px] text-slate-400 font-normal">연간 120거래일 추이</span>
                      </div>

                      {/* SVG Daily Volume Bars & Moving Average */}
                      <div className="w-full flex-1 relative h-6 overflow-hidden my-0.5">
                        <svg viewBox="0 0 120 24" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                          {/* Daily Volume Bars */}
                          {kospiSparkline.dailyVolumes?.map((dv, i) => {
                            const barH = Math.max(1.8, dv.normalizedH * 22);
                            return (
                              <rect
                                key={i}
                                x={dv.dayIdx}
                                y={24 - barH}
                                width="0.75"
                                height={barH}
                                fill={dv.isYangbong ? '#f43f5e' : '#3b82f6'}
                                opacity="0.82"
                                rx="0.15"
                              />
                            );
                          })}

                          {/* 10-Day Volume MA Line */}
                          {kospiSparkline.dailyVolumeMaPath && (
                            <path
                              d={kospiSparkline.dailyVolumeMaPath}
                              fill="none"
                              stroke="#94a3b8"
                              strokeWidth="0.75"
                              vectorEffect="non-scaling-stroke"
                              opacity="0.8"
                            />
                          )}
                        </svg>
                      </div>

                      {/* Month Label Indicators Along Bottom */}
                      <div className="w-full flex justify-between items-center text-[7.5px] sm:text-[8px] font-mono text-slate-400 px-0.5 leading-none">
                        <span>1월</span>
                        <span>2월</span>
                        <span>3월</span>
                        <span>4월</span>
                        <span>5월</span>
                        <span>6월</span>
                        <span>7월</span>
                        <span>8월</span>
                        <span>9월</span>
                        <span>10월</span>
                        <span>11월</span>
                        <span>12월</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-28 flex items-center justify-center text-xs text-slate-400 font-mono">차트 데이터 로딩 중...</div>
                )}
              </div>
            </div>

            {/* 2. S&P 500 Benchmark Card */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onOpenBenchmarkChart('BENCH_SP500')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpenBenchmarkChart('BENCH_SP500'); }}
              className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-slate-50/70 hover:from-purple-100/90 text-purple-950 border border-purple-200/90 hover:border-purple-400 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between gap-2 active:scale-[0.995]"
              title="클릭 시 S&P 500 지수 인터랙티브 대형 차트 및 상세 분석 열기"
            >
              {/* Top Header: Badge, Level, Change, Mode Switcher, High/Low, Button */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-purple-100/90">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse shrink-0"></span>
                  <span className="font-black text-sm text-purple-950">🇺🇸 S&P 500</span>
                  <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100/90 px-1.5 py-0.5 rounded-md">SPX</span>
                  <span className="text-[10.5px] font-bold text-slate-500 font-mono">{currentYear}년</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Current Level */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black font-mono tabular-nums text-slate-900">
                      ${sp500CurrentLevel.toFixed(2)}
                    </span>
                  </div>

                  {/* Change & Return */}
                  <span
                    className={`text-[11px] font-mono tabular-nums font-black px-2 py-0.5 rounded-lg border shadow-2xs flex items-center gap-0.5 ${
                      sp500YearReturn >= 0
                        ? 'text-red-700 bg-red-50/95 border-red-200'
                        : 'text-blue-700 bg-blue-50/95 border-blue-200'
                    }`}
                  >
                    <span>{sp500YearReturn >= 0 ? '▲' : '▼'}</span>
                    <span>{sp500ChangePt >= 0 ? '+$' : '-$'}{Math.abs(sp500ChangePt).toFixed(2)}</span>
                    <span className="text-[10px] font-bold opacity-85">({(sp500YearReturn * 100).toFixed(2)}%)</span>
                  </span>

                  {/* Mini Mode Switcher (일봉 vs 라인) */}
                  <div
                    className="flex items-center bg-white/90 p-0.5 rounded-lg border border-slate-200/90 text-[10px] font-bold shadow-2xs"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        audioManager.playUiSound('tab');
                        setBenchmarkChartMode('CANDLE');
                      }}
                      className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                        benchmarkChartMode === 'CANDLE'
                          ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      일봉
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        audioManager.playUiSound('tab');
                        setBenchmarkChartMode('LINE');
                      }}
                      className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                        benchmarkChartMode === 'LINE'
                          ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      라인
                    </button>
                  </div>

                  {/* High / Low Range */}
                  <div className="hidden sm:flex items-center gap-1 text-[10.5px] font-mono bg-white/90 px-1.5 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                    <span className="text-red-600 font-bold">고 ${sp500Sparkline?.maxPrice.toFixed(2)}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-blue-600 font-bold">저 ${sp500Sparkline?.minPrice.toFixed(2)}</span>
                  </div>

                  {/* Launch Big Chart Button */}
                  <span className="text-[11px] font-black text-purple-700 bg-purple-100 group-hover:bg-purple-200 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-0.5 shadow-2xs">
                    <span>차트</span>
                    <span className="text-[10px]">↗</span>
                  </span>
                </div>
              </div>

              {/* Main Mini Chart & Volume Area (Reduced to 2/3 Height) */}
              <div className="w-full bg-white/95 rounded-xl border border-purple-100/90 p-2 sm:p-2.5 shadow-2xs group-hover:border-purple-300 transition-colors flex flex-col gap-1.5">
                {sp500Sparkline && sp500Sparkline.points.length > 1 ? (
                  <>
                    {/* 1. Price Area (Daily Candlestick vs Wave Line) */}
                    <div className="w-full h-18 sm:h-20 relative overflow-visible">
                      {/* Scale Indicators & Legend */}
                      <div className="absolute left-1 top-0 flex items-center gap-1.5 z-10 pointer-events-none">
                        <span className="text-[9px] font-mono font-bold text-red-600 bg-red-50/90 px-1 py-0.2 rounded border border-red-100">
                          최고 ${sp500Sparkline.maxPrice.toFixed(2)}
                        </span>
                        {benchmarkChartMode === 'CANDLE' && (
                          <>
                            <span className="text-[8.5px] font-mono font-bold text-amber-600 bg-amber-50/80 px-1 py-0.2 rounded border border-amber-200/60 hidden sm:inline-block">
                              5일선
                            </span>
                            <span className="text-[8.5px] font-mono font-bold text-cyan-600 bg-cyan-50/80 px-1 py-0.2 rounded border border-cyan-200/60 hidden sm:inline-block">
                              20일선
                            </span>
                          </>
                        )}
                      </div>

                      <div className="absolute left-1 bottom-0 text-[9px] font-mono font-bold text-blue-600 bg-blue-50/90 px-1 py-0.2 rounded border border-blue-100 pointer-events-none z-10">
                        최저 ${sp500Sparkline.minPrice.toFixed(2)}
                      </div>
                      <div className="absolute right-1 top-0 text-[9px] font-mono font-bold text-slate-500 bg-slate-100/90 px-1 py-0.2 rounded pointer-events-none z-10">
                        시작 ${sp500Sparkline.startPrice.toFixed(2)}
                      </div>

                      {benchmarkChartMode === 'CANDLE' ? (
                        /* Daily Candlestick SVG (120 trading days) */
                        <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                          {/* Starting Baseline Reference */}
                          <line
                            x1="0"
                            y1={4 + 32 * (1 - (sp500Sparkline.startPrice - sp500Sparkline.minPrice) / (sp500Sparkline.maxPrice - sp500Sparkline.minPrice || 1))}
                            x2="120"
                            y2={4 + 32 * (1 - (sp500Sparkline.startPrice - sp500Sparkline.minPrice) / (sp500Sparkline.maxPrice - sp500Sparkline.minPrice || 1))}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                            vectorEffect="non-scaling-stroke"
                          />

                          {/* 120 Daily Candles (Wicks + Bodies) */}
                          {sp500Sparkline.dailyCandles?.map((c, i) => {
                            const pRange = sp500Sparkline.maxPrice - sp500Sparkline.minPrice || 1;
                            const x = c.dayIdx + 0.375;
                            const yHigh = 4 + 32 * (1 - (c.high - sp500Sparkline.minPrice) / pRange);
                            const yLow = 4 + 32 * (1 - (c.low - sp500Sparkline.minPrice) / pRange);
                            const yOpen = 4 + 32 * (1 - (c.open - sp500Sparkline.minPrice) / pRange);
                            const yClose = 4 + 32 * (1 - (c.close - sp500Sparkline.minPrice) / pRange);
                            const candleColor = c.isYangbong ? '#f43f5e' : '#3b82f6';

                            return (
                              <g key={i}>
                                {/* Wick */}
                                <line
                                  x1={x}
                                  y1={yHigh}
                                  x2={x}
                                  y2={yLow}
                                  stroke={candleColor}
                                  strokeWidth="0.6"
                                  vectorEffect="non-scaling-stroke"
                                />
                                {/* Body */}
                                <rect
                                  x={x - 0.35}
                                  y={Math.min(yOpen, yClose)}
                                  width="0.75"
                                  height={Math.max(0.4, Math.abs(yClose - yOpen))}
                                  fill={candleColor}
                                  rx="0.1"
                                />
                              </g>
                            );
                          })}

                          {/* 20-Day MA Curve (Cyan) */}
                          {sp500Sparkline.dailyMa20Path && (
                            <path
                              d={sp500Sparkline.dailyMa20Path}
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="0.9"
                              vectorEffect="non-scaling-stroke"
                              opacity="0.85"
                            />
                          )}

                          {/* 5-Day MA Curve (Orange) */}
                          {sp500Sparkline.dailyMa5Path && (
                            <path
                              d={sp500Sparkline.dailyMa5Path}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="1.1"
                              vectorEffect="non-scaling-stroke"
                              opacity="0.95"
                            />
                          )}
                        </svg>
                      ) : (
                        /* Wave Line SVG */
                        <>
                          <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="bench-line-grad-sp500" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor={sp500Sparkline.isPositive ? '#fb7185' : '#60a5fa'} />
                                <stop offset="100%" stopColor={sp500Sparkline.isPositive ? '#e11d48' : '#2563eb'} />
                              </linearGradient>
                              <linearGradient id="bench-area-grad-sp500" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={sp500Sparkline.isPositive ? '#f43f5e' : '#3b82f6'} stopOpacity="0.10" />
                                <stop offset="100%" stopColor={sp500Sparkline.isPositive ? '#f43f5e' : '#3b82f6'} stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Starting Baseline Reference */}
                            {sp500Sparkline.points[0] && (
                              <line
                                x1="0"
                                y1={sp500Sparkline.points[0].y}
                                x2="100"
                                y2={sp500Sparkline.points[0].y}
                                stroke="#cbd5e1"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                                vectorEffect="non-scaling-stroke"
                              />
                            )}

                            {/* Gradient Area Fill */}
                            <path d={sp500Sparkline.svgAreaPath} fill="url(#bench-area-grad-sp500)" />

                            {/* Crisp, Slim, Elegant Price Line */}
                            <path
                              d={sp500Sparkline.svgPath}
                              fill="none"
                              stroke="url(#bench-line-grad-sp500)"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>

                          {/* Small circular live terminal dot */}
                          {sp500Sparkline.points[sp500Sparkline.points.length - 1] && (
                            <div
                              style={{
                                left: `${sp500Sparkline.points[sp500Sparkline.points.length - 1].x}%`,
                                top: `${(sp500Sparkline.points[sp500Sparkline.points.length - 1].y / 40) * 100}%`,
                              }}
                              className={`absolute w-2 h-2 rounded-full border-[1.5px] border-white shadow-xs -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 ${
                                sp500Sparkline.isPositive ? 'bg-rose-600' : 'bg-blue-600'
                              }`}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* 2. Daily Volume Histogram Area (일별 거래량 120거래일) */}
                    <div className="w-full h-11 sm:h-12 pt-1 border-t border-slate-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-500 font-bold px-0.5">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          <span>일별 거래량</span>
                        </span>
                        <span className="text-[8.5px] text-slate-400 font-normal">연간 120거래일 추이</span>
                      </div>

                      {/* SVG Daily Volume Bars & Moving Average */}
                      <div className="w-full flex-1 relative h-6 overflow-hidden my-0.5">
                        <svg viewBox="0 0 120 24" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                          {/* Daily Volume Bars */}
                          {sp500Sparkline.dailyVolumes?.map((dv, i) => {
                            const barH = Math.max(1.8, dv.normalizedH * 22);
                            return (
                              <rect
                                key={i}
                                x={dv.dayIdx}
                                y={24 - barH}
                                width="0.75"
                                height={barH}
                                fill={dv.isYangbong ? '#f43f5e' : '#3b82f6'}
                                opacity="0.82"
                                rx="0.15"
                              />
                            );
                          })}

                          {/* 10-Day Volume MA Line */}
                          {sp500Sparkline.dailyVolumeMaPath && (
                            <path
                              d={sp500Sparkline.dailyVolumeMaPath}
                              fill="none"
                              stroke="#94a3b8"
                              strokeWidth="0.75"
                              vectorEffect="non-scaling-stroke"
                              opacity="0.8"
                            />
                          )}
                        </svg>
                      </div>

                      {/* Month Label Indicators Along Bottom */}
                      <div className="w-full flex justify-between items-center text-[7.5px] sm:text-[8px] font-mono text-slate-400 px-0.5 leading-none">
                        <span>1월</span>
                        <span>2월</span>
                        <span>3월</span>
                        <span>4월</span>
                        <span>5월</span>
                        <span>6월</span>
                        <span>7월</span>
                        <span>8월</span>
                        <span>9월</span>
                        <span>10월</span>
                        <span>11월</span>
                        <span>12월</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-28 flex items-center justify-center text-xs text-slate-400 font-mono">차트 데이터 로딩 중...</div>
                )}
              </div>
            </div>
          </div>
        )}

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
