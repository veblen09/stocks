import React, { useState } from 'react';
import { getCompanyMonthlyReplaySeries } from '../../engine/companyChartEngine';
import { formatKRW, formatPercent } from '../../utils/formatMoney';
import type { MotionPreference } from './marketReplayTypes';
import type { StockHolding } from '../../types/stockGame';

interface IndividualStockReplayChartProps {
  canonicalId: string;
  year: number;
  currentMonth: number;
  motionPreference?: MotionPreference;
  holding?: StockHolding;
}

export const IndividualStockReplayChart: React.FC<IndividualStockReplayChartProps> = ({
  canonicalId,
  year,
  currentMonth,
  holding,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const series = getCompanyMonthlyReplaySeries(canonicalId, year, currentMonth);

  if (!series || series.points.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-100 rounded-2xl text-slate-500 text-xs">
        {year}년 실시간 주가 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const isUsStock = series.market === 'US';
  const visiblePoints = series.points;
  const latestPoint = visiblePoints[visiblePoints.length - 1];

  // SVG Chart dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 50;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 30;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const pricesKRW = visiblePoints.map(p => p.priceKRW);
  const minPrice = Math.min(...pricesKRW);
  const maxPrice = Math.max(...pricesKRW);
  const priceSpan = maxPrice - minPrice || 1;

  const yMin = Math.max(0, minPrice - priceSpan * 0.1);
  const yMax = maxPrice + priceSpan * 0.15;
  const yRange = yMax - yMin || 1;

  const getX = (m: number) => {
    // 13 points total (0: 1/1, 1..12: 1~12월)
    return padLeft + (m / 12) * chartW;
  };

  const getY = (val: number) => {
    return padTop + chartH - ((val - yMin) / yRange) * chartH;
  };

  const svgPoints = visiblePoints.map(p => ({
    x: getX(p.month),
    y: getY(p.priceKRW),
    point: p,
  }));

  const linePathD = svgPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaPathD =
    svgPoints.length > 0
      ? `${linePathD} L ${svgPoints[svgPoints.length - 1].x},${padTop + chartH} L ${svgPoints[0].x},${padTop + chartH} Z`
      : '';

  const activeHover = hoveredIndex !== null ? visiblePoints[hoveredIndex] : null;

  return (
    <div className="space-y-3">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{isUsStock ? '🇺🇸' : '🇰🇷'}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">{series.stockNameKo}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold">
                {series.ticker}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold font-mono text-white">
                {formatKRW(latestPoint.priceKRW)}
              </span>
              {isUsStock && (
                <span className="text-xs font-mono text-slate-400">
                  (${latestPoint.priceLocal.toFixed(2)})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-sans">
              누적 YTD ({currentMonth === 0 ? '1/1' : `${currentMonth}월`})
            </span>
            <span
              className={`font-bold text-sm ${
                latestPoint.ytdReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {latestPoint.ytdReturn >= 0 ? '+' : ''}
              {formatPercent(latestPoint.ytdReturn)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-sans">
              {currentMonth === 0 ? '1/1 기준' : `${currentMonth}월 당월`}
            </span>
            <span
              className={`font-bold text-sm ${
                latestPoint.monthlyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currentMonth === 0 ? '기준가' : `${latestPoint.monthlyReturn >= 0 ? '+' : ''}${formatPercent(latestPoint.monthlyReturn)}`}
            </span>
          </div>

          {holding && holding.shares > 0 && (
            <div className="text-right pl-3 border-l border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">내 보유 평가액</span>
              <span className="font-bold text-sm text-blue-300">
                {formatKRW(holding.shares * latestPoint.priceKRW)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="singleStockGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((pct, i) => {
            const y = padTop + chartH * pct;
            const val = yMax - pct * yRange;
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="2 2"
                  strokeWidth="0.8"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {formatKRW(val)}
                </text>
              </g>
            );
          })}

          {/* Year Start Baseline */}
          <line
            x1={padLeft}
            y1={getY(series.startPriceKRW)}
            x2={svgWidth - padRight}
            y2={getY(series.startPriceKRW)}
            stroke="#64748b"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Area Fill */}
          {areaPathD && <path d={areaPathD} fill="url(#singleStockGrad)" />}

          {/* Line Path */}
          {linePathD && (
            <path
              d={linePathD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points & Hitboxes */}
          {svgPoints.map((pt, idx) => {
            const isLast = idx === svgPoints.length - 1;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                className="cursor-pointer"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isLast || isHovered ? 5 : 3.5}
                  fill={isHovered ? '#ffffff' : '#38bdf8'}
                />
                {isLast && (
                  <circle cx={pt.x} cy={pt.y} r="8" fill="#38bdf8" opacity="0.3">
                    <animate
                      attributeName="r"
                      values="5;9;5"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.5;0.1;0.5"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
              </g>
            );
          })}

          {/* X Axis month nodes 0 (1/1) .. 12 */}
          {Array.from({ length: 13 }, (_, i) => i).map(m => {
            const x = getX(m);
            const isRevealed = m <= currentMonth;
            const label = m === 0 ? '1/1' : `${m}월`;

            return (
              <g key={m}>
                <text
                  x={x}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  fill={isRevealed ? '#94a3b8' : '#475569'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight={m === currentMonth ? 'bold' : 'normal'}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {activeHover && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs shadow-xl font-mono flex items-center gap-3 pointer-events-none z-10">
            <span className="text-cyan-300 font-bold">{activeHover.monthLabel}</span>
            <span className="text-white font-bold">{formatKRW(activeHover.priceKRW)}</span>
            <span
              className={`font-bold ${
                activeHover.monthlyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              당월 {activeHover.monthlyReturn >= 0 ? '+' : ''}
              {formatPercent(activeHover.monthlyReturn)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
