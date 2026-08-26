import React, { useMemo } from 'react';
import {
  Sparkles,
  Newspaper,
  Star,
  CheckCircle2,
  ShoppingCart,
} from 'lucide-react';
import type { TradableStockItem, MosaicViewMode } from '../types/stockUniverse';
import { formatKRW, formatCompactKRW, formatPercent, getReturnColor } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';
import { getCompany1YrSparkline } from '../engine/companyChartEngine';

interface MosaicTileProps {
  stock: TradableStockItem;
  mode: MosaicViewMode;
  currentYear?: number;
  totalPortfolioValue?: number;
  draftTargetWeight?: number; // 0.00 to 1.00
  availableHeadroom?: number; // Maximum allowed target weight without exceeding 100% total
  currentHoldingWeight?: number; // 0.00 to 1.00
  currentHoldingValueKRW?: number;
  yearEndReturn?: number | null; // Available only in YEAR_END_PERFORMANCE mode
  isSelected?: boolean;
  isWatchlisted?: boolean;
  onClick: () => void;
  onToggleWatchlist?: (canonicalId: string) => void;
  onQuickAdjustTarget?: (newWeight: number) => void;
}

export const MosaicTile: React.FC<MosaicTileProps> = ({
  stock,
  mode,
  currentYear = 2000,
  totalPortfolioValue = 10000000,
  draftTargetWeight = 0,
  availableHeadroom,
  currentHoldingWeight = 0,
  currentHoldingValueKRW = 0,
  yearEndReturn,
  isSelected = false,
  isWatchlisted = false,
  onClick,
  onToggleWatchlist,
  onQuickAdjustTarget,
}) => {
  const isHolding = currentHoldingWeight > 0.0001;
  const hasTarget = draftTargetWeight > 0.0001;
  const isKR = stock.market === 'KR';

  // Calculate current target amount in KRW
  const targetAmountKRW = Math.round(draftTargetWeight * totalPortfolioValue);

  // Default single buy amount based on portfolio size
  const defaultSingleBuyAmount = totalPortfolioValue >= 2000000 ? 1000000 : Math.round(totalPortfolioValue * 0.1);
  const defaultSingleBuyWeight = totalPortfolioValue > 0 ? defaultSingleBuyAmount / totalPortfolioValue : 0.1;

  // 1-year sparkline for intuitive trend visualization
  const sparkline = useMemo(() => {
    return getCompany1YrSparkline(stock.canonicalId, currentYear - 1);
  }, [stock.canonicalId, currentYear]);

  // Maximum allowed for this stock
  const maxCap = availableHeadroom !== undefined ? availableHeadroom : 1.0;
  const canIncrease = draftTargetWeight < maxCap - 0.0001;

  // Handle tile click (opens detail panel with tileOpen sound)
  const handleTileClick = () => {
    audioManager.playUiSound('tileOpen');
    onClick();
  };

  // Handle keyboard activation (Enter or Space)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTileClick();
    }
  };

  // Handle star watchlist click without opening parent tile
  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioManager.playUiSound('keyTap');
    if (onToggleWatchlist) {
      onToggleWatchlist(stock.canonicalId);
    }
  };

  // Handle amount-based step adjust (+/- 100만, +/- 10만, +/- 1만)
  const handleAmountAdjust = (e: React.MouseEvent, deltaAmount: number) => {
    e.stopPropagation();
    if (totalPortfolioValue <= 0) return;
    const currentAmount = draftTargetWeight * totalPortfolioValue;
    const maxAllowedAmount = maxCap * totalPortfolioValue;
    const targetAmount = Math.max(0, Math.min(maxAllowedAmount, currentAmount + deltaAmount));
    const nextWeight = Math.round((targetAmount / totalPortfolioValue) * 1000000) / 1000000;

    if (deltaAmount > 0) {
      if (!canIncrease) return;
      audioManager.playUiSound('allocationUp');
    } else {
      audioManager.playUiSound('allocationDown');
    }
    if (onQuickAdjustTarget) {
      onQuickAdjustTarget(nextWeight);
    }
  };

  // Handle quick direct buy target
  const handleDirectBuy = (e: React.MouseEvent, targetPct: number) => {
    e.stopPropagation();
    if (!canIncrease && targetPct > draftTargetWeight) return;
    audioManager.playUiSound('allocationUp');
    if (onQuickAdjustTarget) {
      const nextVal = Math.max(0, Math.min(maxCap, Math.round(targetPct * 1000000) / 1000000));
      onQuickAdjustTarget(nextVal);
    }
  };

  // Accessible descriptive label
  const ariaLabel = `${stock.nameKo}, ${stock.ticker}, ${isKR ? '한국' : '미국'}, ${stock.sector}, ${
    isHolding ? `현재 보유 ${formatKRW(currentHoldingValueKRW)} (${Math.round(currentHoldingWeight * 100)}%)` : '미보유'
  }, ${hasTarget ? `매수 설정 ${formatCompactKRW(targetAmountKRW)} (${Math.round(draftTargetWeight * 100)}%)` : '매수 가능'}`;


  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-pressed={isSelected || hasTarget}
      onClick={handleTileClick}
      onKeyDown={handleKeyDown}
      className={`stock-key group ${isHolding ? 'is-holding' : ''} ${
        hasTarget ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30' : ''
      } ${isSelected ? 'ring-2 ring-blue-700 border-blue-700' : ''}`}
    >
      {/* 1. Top Badges & Watchlist Bar */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Market Badge */}
          <span
            className={`px-2 py-0.5 rounded-md font-bold text-[11px] leading-tight ${
              isKR
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-purple-100 text-purple-800 border border-purple-200'
            }`}
          >
            {isKR ? '🇰🇷 한국' : '🇺🇸 미국'}
          </span>

          {/* New Listing Badge */}
          {stock.isNewlyListed && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-0.5">
              <Sparkles size={11} className="text-amber-600" />
              <span>NEW</span>
            </span>
          )}

          {/* Holding Badge */}
          {isHolding && (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] flex items-center gap-0.5">
              <CheckCircle2 size={11} className="text-emerald-600" />
              <span>보유 중</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* News Count Badge */}
          {stock.newsCount > 0 && (
            <span
              title={`공개된 뉴스 ${stock.newsCount}건`}
              className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200 flex items-center gap-0.5"
            >
              <Newspaper size={11} className="text-slate-500" />
              <span>{stock.newsCount}</span>
            </span>
          )}

          {/* Watchlist Star Button (Isolated Click) */}
          <button
            type="button"
            onClick={handleStarClick}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isWatchlisted
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-300 hover:text-slate-500'
            }`}
            aria-label={isWatchlisted ? '관심종목 해제' : '관심종목 추가'}
          >
            <Star size={14} className={isWatchlisted ? 'fill-amber-400' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Center: Company Name & Identifiers (High Contrast) */}
      <div className="space-y-1 my-1 relative">
        <div className="group/name relative inline-block max-w-full">
          <h3
            title={`${stock.nameKo}${stock.nameEn && stock.nameEn !== stock.nameKo ? ` (${stock.nameEn})` : ''} · ${stock.ticker} · ${stock.sector}`}
            className="text-[15px] sm:text-[16px] font-bold text-slate-900 leading-snug tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer"
          >
            {stock.nameKo}
          </h3>

          {/* Instant Rich Hover Tooltip for Long Company Names */}
          <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 z-40 hidden group-hover/name:block bg-slate-900/95 text-white text-xs px-3 py-1.5 rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150 min-w-max max-w-xs break-keep">
            <div className="font-bold text-[13px] text-white flex items-center gap-1.5 flex-wrap">
              <span>{stock.nameKo}</span>
              {stock.nameEn && stock.nameEn !== stock.nameKo && (
                <span className="text-slate-300 font-normal text-xs">({stock.nameEn})</span>
              )}
            </div>
            <div className="text-[11px] text-blue-300 font-mono mt-0.5">
              {stock.ticker} · <span className="text-slate-300 font-sans">{stock.sector}</span>
            </div>
          </div>
        </div>

        <div
          title={`${stock.ticker} · ${stock.sector}`}
          className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-slate-500 font-medium cursor-help"
        >
          <span className="font-mono font-semibold text-slate-700">{stock.ticker}</span>
          <span>·</span>
          <span className="line-clamp-1" title={stock.sector}>{stock.sector}</span>
        </div>

        {/* 1-Year Mini Sparkline (Naver Style Chart) */}
        <div
          onClick={e => {
            e.stopPropagation();
            handleTileClick();
          }}
          className="mt-1.5 mb-1 p-1.5 rounded-xl bg-slate-50/90 hover:bg-blue-50/60 border border-slate-200/60 hover:border-blue-200 transition-all flex items-center justify-between gap-2 cursor-pointer group/spark"
          title="클릭 시 과거 주가 차트 상세 보기"
        >
          <div className="flex-1 min-w-0 h-6 flex items-center">
            {sparkline && sparkline.points.length > 1 ? (
              <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`grad-${stock.canonicalId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkline.isPositive ? '#ef4444' : '#3b82f6'} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={sparkline.isPositive ? '#ef4444' : '#3b82f6'} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={sparkline.svgAreaPath} fill={`url(#grad-${stock.canonicalId})`} />
                <path
                  d={sparkline.svgPath}
                  fill="none"
                  stroke={sparkline.isPositive ? '#ef4444' : '#3b82f6'}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <div className="w-full text-[9px] text-slate-400 font-mono text-center">차트 분석 중</div>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9px] text-slate-400 block font-medium">최근 1년</span>
            {sparkline ? (
              <span
                className={`text-[11px] font-bold font-mono ${
                  sparkline.isPositive ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                {sparkline.isPositive ? '▲' : '▼'} {formatPercent(Math.abs(sparkline.return1Yr))}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">-</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom: Mode-specific info & Target Allocation Controls */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-2">
        {/* Mode 1: Target Allocation Mode or Default */}
        {mode === 'TARGET_ALLOCATION' || mode === 'EXPLORE' ? (
          <div className="space-y-2">
            {!hasTarget ? (
              /* Sleek Single Full-Width Buy Button when target is 0 KRW */
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>매수 설정</span>
                  <span className="font-mono text-slate-400 text-[10px]">0원 (미설정)</span>
                </div>

                <button
                  type="button"
                  onClick={e => handleDirectBuy(e, Math.min(maxCap, defaultSingleBuyWeight))}
                  disabled={maxCap <= 0.0001}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap active:scale-98"
                  title={`${stock.nameKo} +${formatCompactKRW(defaultSingleBuyAmount)} 매수 담기`}
                >
                  <ShoppingCart size={13} className="shrink-0 text-white/90" />
                  <span>+{formatCompactKRW(defaultSingleBuyAmount)} 매수 담기</span>
                </button>
              </div>
            ) : (
              /* Active Target Allocation Controls when target > 0 KRW */
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center gap-1">
                    <ShoppingCart size={10} />
                    <span>매수 담김</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-blue-700 text-sm">
                      {formatCompactKRW(targetAmountKRW)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({Math.round(draftTargetWeight * 100)}%)
                    </span>
                    <button
                      type="button"
                      onClick={e => handleDirectBuy(e, 0)}
                      className="w-4 h-4 rounded-full bg-slate-200/80 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center text-[10px] font-bold transition cursor-pointer ml-0.5"
                      title="매수 취소 (0원)"
                      aria-label={`${stock.nameKo} 매수 취소`}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Target Weight Visual Fill Gauge */}
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-200"
                    style={{ width: `${Math.min(100, Math.round(draftTargetWeight * 100))}%` }}
                  />
                </div>

                {/* Quick Steppers: Major (100만/10만) & Fine-Tuning (1만) */}
                {onQuickAdjustTarget && (
                  <div className="space-y-1 w-full pt-0.5">
                    {/* Row 1: Major Adjustments */}
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        type="button"
                        onClick={e => handleAmountAdjust(e, -1000000)}
                        disabled={draftTargetWeight <= 0}
                        className="w-full py-1.5 text-center rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 text-[10.5px] font-bold font-mono border border-slate-200 transition-colors cursor-pointer"
                        aria-label={`${stock.nameKo} 100만원 감소`}
                      >
                        -100만
                      </button>
                      <button
                        type="button"
                        onClick={e => handleAmountAdjust(e, -100000)}
                        disabled={draftTargetWeight <= 0}
                        className="w-full py-1.5 text-center rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 text-[10.5px] font-bold font-mono border border-slate-200 transition-colors cursor-pointer"
                        aria-label={`${stock.nameKo} 10만원 감소`}
                      >
                        -10만
                      </button>
                      <button
                        type="button"
                        onClick={e => handleAmountAdjust(e, +100000)}
                        disabled={!canIncrease}
                        title={!canIncrease ? '자산 한도에 도달했습니다' : undefined}
                        className="w-full py-1.5 text-center rounded-lg bg-blue-50 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed text-blue-700 text-[10.5px] font-bold font-mono border border-blue-200 transition-colors cursor-pointer"
                        aria-label={`${stock.nameKo} 10만원 증가`}
                      >
                        +10만
                      </button>
                      <button
                        type="button"
                        onClick={e => handleAmountAdjust(e, +1000000)}
                        disabled={!canIncrease}
                        title={!canIncrease ? '자산 한도에 도달했습니다' : undefined}
                        className="w-full py-1.5 text-center rounded-lg bg-blue-50 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed text-blue-700 text-[10.5px] font-bold font-mono border border-blue-200 transition-colors cursor-pointer"
                        aria-label={`${stock.nameKo} 100만원 증가`}
                      >
                        +100만
                      </button>
                    </div>

                    {/* Row 2: 1만원 Fine-Tuning */}
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={e => handleAmountAdjust(e, -10000)}
                        disabled={draftTargetWeight <= 0}
                        className="w-full py-1 text-center rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 text-[10px] font-bold font-mono border border-slate-200 transition-colors cursor-pointer"
                        aria-label={`${stock.nameKo} 1만원 미세 감소`}
                      >
                        -1만원 (미세)
                      </button>
                      <button
                        type="button"
                        onClick={e => handleAmountAdjust(e, +10000)}
                        disabled={!canIncrease}
                        title={!canIncrease ? '자산 한도에 도달했습니다' : undefined}
                        className="w-full py-1 text-center rounded-lg bg-blue-50/60 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed text-blue-600 text-[10px] font-bold font-mono border border-blue-100 transition-colors cursor-pointer"
                        aria-label={`${stock.nameKo} 1만원 미세 증가`}
                      >
                        +1만원 (미세)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}


        {/* Mode 2: Actual Holdings Weight */}
        {mode === 'HOLDINGS_WEIGHT' && (
          <div className="space-y-1 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">보유 비중:</span>
              <span className="font-mono font-bold text-slate-900 text-[13px]">
                {formatPercent(currentHoldingWeight)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">평가 금액:</span>
              <span className="font-mono font-semibold">
                {isHolding ? formatKRW(currentHoldingValueKRW) : '미보유'}
              </span>
            </div>
          </div>
        )}

        {/* Mode 3: Year-End Performance */}
        {mode === 'YEAR_END_PERFORMANCE' && (
          <div className="space-y-1 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">당해 연간 수익률:</span>
              <span className={`font-mono font-bold text-[13px] ${getReturnColor(yearEndReturn || 0)}`}>
                {yearEndReturn !== null && yearEndReturn !== undefined ? formatPercent(yearEndReturn) : '상장 초기/미제공'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
