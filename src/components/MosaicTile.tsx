import React from 'react';
import {
  Sparkles,
  Newspaper,
  Star,
  CheckCircle2,
} from 'lucide-react';
import type { TradableStockItem, MosaicViewMode } from '../types/stockUniverse';
import { formatKRW, formatPercent, getReturnColor } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';

interface MosaicTileProps {
  stock: TradableStockItem;
  mode: MosaicViewMode;
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

  // Handle quick +/- step
  const handleStepAdjust = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    if (delta > 0) {
      if (!canIncrease) return;
      audioManager.playUiSound('allocationUp');
    } else {
      audioManager.playUiSound('allocationDown');
    }
    if (onQuickAdjustTarget) {
      const nextVal = Math.max(0, Math.min(maxCap, Math.round((draftTargetWeight + delta) * 100) / 100));
      onQuickAdjustTarget(nextVal);
    }
  };

  // Accessible descriptive label
  const ariaLabel = `${stock.nameKo}, ${stock.ticker}, ${isKR ? '한국' : '미국'}, ${stock.sector}, ${
    isHolding ? `현재 보유 ${Math.round(currentHoldingWeight * 100)}%` : '미보유'
  }, ${hasTarget ? `목표 ${Math.round(draftTargetWeight * 100)}%` : ''}`;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-pressed={isSelected || hasTarget}
      onClick={handleTileClick}
      onKeyDown={handleKeyDown}
      className={`stock-key group ${isHolding ? 'is-holding' : ''} ${
        isSelected ? 'ring-2 ring-blue-600 border-blue-600' : ''
      }`}
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
      <div className="space-y-1 my-1">
        <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 leading-snug tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
          {stock.nameKo}
        </h3>
        <div className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-slate-500 font-medium">
          <span className="font-mono font-semibold text-slate-700">{stock.ticker}</span>
          <span>·</span>
          <span className="line-clamp-1">{stock.sector}</span>
        </div>
      </div>

      {/* 3. Bottom: Mode-specific info & Target Allocation Controls */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-2">
        {/* Mode 1: Target Allocation Mode or Default */}
        {mode === 'TARGET_ALLOCATION' || mode === 'EXPLORE' ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-medium text-slate-500">목표 비중:</span>
              <span className="font-mono font-bold text-slate-900 text-[14px]">
                {Math.round(draftTargetWeight * 100)}%
              </span>
            </div>

            {/* Target Weight Visual Fill Gauge */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, Math.round(draftTargetWeight * 100))}%` }}
              />
            </div>

            {/* Quick +/- Step Buttons (Auto-capped to 100% total) */}
            {onQuickAdjustTarget && (
              <div className="flex items-center justify-between pt-1 gap-1">
                <button
                  type="button"
                  onClick={e => handleStepAdjust(e, -0.05)}
                  disabled={draftTargetWeight <= 0}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 text-[11px] font-bold border border-slate-300 transition-colors"
                  aria-label={`${stock.nameKo} 목표비중 5% 감소`}
                >
                  -5%
                </button>
                <button
                  type="button"
                  onClick={e => handleStepAdjust(e, -0.01)}
                  disabled={draftTargetWeight <= 0}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 text-[11px] font-bold border border-slate-300 transition-colors"
                  aria-label={`${stock.nameKo} 목표비중 1% 감소`}
                >
                  -1%
                </button>
                <button
                  type="button"
                  onClick={e => handleStepAdjust(e, +0.01)}
                  disabled={!canIncrease}
                  title={!canIncrease ? '자산배분 100%에 도달했습니다' : undefined}
                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed text-blue-700 text-[11px] font-bold border border-blue-200 transition-colors"
                  aria-label={`${stock.nameKo} 목표비중 1% 증가`}
                >
                  +1%
                </button>
                <button
                  type="button"
                  onClick={e => handleStepAdjust(e, +0.05)}
                  disabled={!canIncrease}
                  title={!canIncrease ? '자산배분 100%에 도달했습니다' : undefined}
                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed text-blue-700 text-[11px] font-bold border border-blue-200 transition-colors"
                  aria-label={`${stock.nameKo} 목표비중 5% 증가`}
                >
                  +5%
                </button>
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
