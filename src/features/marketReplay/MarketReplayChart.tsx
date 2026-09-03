import React, { useState } from 'react';
import type { MonthlyPortfolioPoint, MotionPreference } from './marketReplayTypes';
import { formatKRW, formatPercent } from '../../utils/formatMoney';

interface MarketReplayChartProps {
  points: MonthlyPortfolioPoint[];
  currentMonthIndex: number; // 0 to 11
  startTotalAssetsKRW: number;
  cumulativePrincipalKRW: number;
  showBenchmark: boolean;
  benchmarkName?: string;
  motionPreference?: MotionPreference;
}

export const MarketReplayChart: React.FC<MarketReplayChartProps> = ({
  points,
  currentMonthIndex,
  startTotalAssetsKRW,
  showBenchmark,
  motionPreference = 'NORMAL',
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // STRICT ZERO LOOKAHEAD LEAK: slice strictly from 0 to currentMonthIndex + 1
  const visiblePoints = points.slice(0, Math.min(points.length, currentMonthIndex + 1));
  const currentPoint = visiblePoints[visiblePoints.length - 1];

  if (!currentPoint || visiblePoints.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-bold">
        시장이 준비 중입니다...
      </div>
    );
  }

  // Dimensions & ViewBox
  const width = 680;
  const height = 240;
  const padding = { top: 32, right: 96, bottom: 32, left: 55 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Calculate dynamic Min and Max focusing on the active intra-year movements
  const allVisibleValues = visiblePoints.flatMap(p => [
    p.portfolioValueKRW,
    p.runningPeakKRW,
    showBenchmark ? p.primaryBenchmarkValueKRW : p.portfolioValueKRW,
  ]);
  allVisibleValues.push(startTotalAssetsKRW);

  const rawMin = Math.min(...allVisibleValues);
  const rawMax = Math.max(...allVisibleValues);
  const isUnderwater = currentPoint.runningPeakKRW > currentPoint.portfolioValueKRW * 1.008;
  const buffer = visiblePoints.length === 1
    ? Math.max(rawMax * 0.15, 100000)
    : Math.max((rawMax - rawMin) * 0.12, rawMax * 0.02);

  const minVal = Math.max(0, rawMin - buffer);
  const maxVal = rawMax + buffer;
  const valRange = Math.max(1, maxVal - minVal);

  const getX = (monthIdx: number) => {
    return padding.left + (monthIdx / 12) * plotWidth;
  };

  const getY = (val: number) => {
    const norm = (val - minVal) / valRange;
    return padding.top + plotHeight - norm * plotHeight;
  };

  // Helper for smooth cubic spline paths
  const getSplinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    let path = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const portfolioPoints = visiblePoints.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.portfolioValueKRW),
  }));

  const portfolioPathD = getSplinePath(portfolioPoints);

  // Build Area Path under portfolio
  const firstX = getX(0);
  const lastX = getX(visiblePoints.length - 1);
  const bottomY = padding.top + plotHeight;
  const areaPathD = `${portfolioPathD} L ${lastX.toFixed(1)},${bottomY} L ${firstX.toFixed(1)},${bottomY} Z`;

  // Build Benchmark Path (if toggled)
  const benchmarkPoints = showBenchmark
    ? visiblePoints.map((p, idx) => ({
        x: getX(idx),
        y: getY(p.primaryBenchmarkValueKRW),
      }))
    : [];
  const benchmarkPathD = showBenchmark ? getSplinePath(benchmarkPoints) : '';

  // Baseline Y coordinates
  const currentPeakY = getY(currentPoint.runningPeakKRW);
  const portfolioY = getY(currentPoint.portfolioValueKRW);
  const benchmarkY = showBenchmark ? getY(currentPoint.primaryBenchmarkValueKRW) : 0;

  // Collision-free label positioning for right side
  let labelPortfolioY = portfolioY;
  let labelBenchmarkY = benchmarkY;
  let labelPeakY = currentPeakY;

  if (showBenchmark && Math.abs(labelPortfolioY - labelBenchmarkY) < 14) {
    if (labelPortfolioY < labelBenchmarkY) {
      labelPortfolioY -= 7;
      labelBenchmarkY += 7;
    } else {
      labelPortfolioY += 7;
      labelBenchmarkY -= 7;
    }
  }

  if (isUnderwater && Math.abs(labelPortfolioY - labelPeakY) < 14) {
    labelPeakY = Math.min(labelPortfolioY - 14, labelPeakY);
  }

  return (
    <div className="relative w-full select-none space-y-2">
      {/* Top Legend Bar (직관적 차트 범례) */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] pb-1 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 1. My Portfolio */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-extrabold shadow-2xs">
            <span className="w-3.5 h-1 bg-blue-600 rounded-full inline-block"></span>
            <span>내 포트폴리오</span>
          </div>

          {/* 2. Market Benchmark */}
          {showBenchmark && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 font-bold shadow-2xs">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-500 inline-block"></span>
              <span>시장 벤치마크 지수</span>
            </div>
          )}

          {/* 3. All-time Peak (Only shown if currently in drawdown) */}
          {isUnderwater && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
              <span className="w-3 h-0.5 border-t-2 border-dotted border-emerald-600 inline-block"></span>
              <span>역대 최고점 (회복선)</span>
            </div>
          )}
        </div>

        {/* New High Tag info */}
        <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200">
          <span>★ HIGH:</span>
          <span>신고가 경신 마커</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible font-mono text-[10px]"
      >
        <defs>
          <linearGradient id="portfolioAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#2563eb" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Chart Background Grid */}
        <line
          x1={padding.left}
          y1={bottomY}
          x2={padding.left + plotWidth}
          y2={bottomY}
          stroke="#cbd5e1"
          strokeWidth="1"
        />

        {/* Months X-Axis Grid & Labels (1/1 시작 ~ 12월, 총 13개) */}
        {Array.from({ length: 13 }).map((_, idx) => {
          const x = getX(idx);
          const isRevealed = idx < visiblePoints.length;
          const isCurrent = idx === visiblePoints.length - 1;
          const label = idx === 0 ? '1/1' : `${idx}월`;

          return (
            <g key={idx}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={bottomY}
                stroke={isCurrent ? '#93c5fd' : '#f1f5f9'}
                strokeWidth={isCurrent ? '1.5' : '1'}
                strokeDasharray={isCurrent ? '3 3' : undefined}
              />
              <text
                x={x}
                y={bottomY + 18}
                textAnchor="middle"
                className={`transition-colors font-sans ${idx === 0 ? 'text-[10px]' : 'text-[11px]'} ${
                  isCurrent
                    ? 'fill-blue-600 font-extrabold text-xs'
                    : isRevealed
                    ? idx === 0 ? 'fill-blue-600 font-bold' : 'fill-slate-700 font-bold'
                    : 'fill-slate-300'
                }`}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Peak Asset Dotted Line (역대 최고점 회복 기준선: 오직 낙폭 상태일 때만 표시) */}
        {isUnderwater && currentPeakY >= padding.top && currentPeakY <= bottomY && (
          <g>
            <line
              x1={padding.left}
              y1={currentPeakY}
              x2={padding.left + plotWidth}
              y2={currentPeakY}
              stroke="#10b981"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              opacity="0.7"
            />
            <text
              x={padding.left + plotWidth + 6}
              y={labelPeakY + 3}
              className="fill-emerald-600 font-sans text-[9px] font-bold"
            >
              역대 최고점
            </text>
          </g>
        )}

        {/* Drawdown Area & Vertical Drop Line */}
        {isUnderwater && (
          <g>
            <line
              x1={lastX}
              y1={currentPeakY}
              x2={lastX}
              y2={portfolioY}
              stroke="#e11d48"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          </g>
        )}

        {/* Area under curve */}
        <path d={areaPathD} fill="url(#portfolioAreaGrad)" />

        {/* Benchmark Race Path (시장 벤치마크 지수) */}
        {showBenchmark && benchmarkPathD && (
          <g>
            <path
              d={benchmarkPathD}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="4 3"
              opacity="0.85"
            />
            <text
              x={lastX + 6}
              y={labelBenchmarkY + 3}
              className="fill-slate-600 font-sans text-[9px] font-extrabold"
            >
              시장 벤치마크
            </text>
          </g>
        )}

        {/* Main Portfolio Path */}
        <path
          d={portfolioPathD}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />

        {/* Direct Label on My Portfolio End */}
        <text
          x={lastX + 6}
          y={labelPortfolioY + 3}
          className="fill-blue-700 font-sans text-[9px] font-black"
        >
          내 포트폴리오
        </text>

        {/* Visible Monthly Node Points */}
        {visiblePoints.map((p, idx) => {
          const x = getX(idx);
          const y = getY(p.portfolioValueKRW);
          const isCurrent = idx === visiblePoints.length - 1;

          return (
            <g
              key={idx}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredPointIndex(idx)}
              onMouseLeave={() => setHoveredPointIndex(null)}
            >
              {/* Point Circle */}
              <circle
                cx={x}
                cy={y}
                r={isCurrent ? (motionPreference === 'OFF' ? 5 : 6) : 3.5}
                className={`transition-all duration-200 ${
                  isCurrent
                    ? 'fill-blue-600 stroke-white stroke-2 shadow-lg animate-pulse'
                    : 'fill-white stroke-blue-600 stroke-2 hover:fill-blue-100 hover:r-5'
                }`}
              />

              {/* Special Marker on New High */}
              {p.isNewHigh && (
                <g>
                  <circle cx={x} cy={y - 12} r={3.5} fill="#10b981" />
                  <text
                    x={x}
                    y={y - 17}
                    textAnchor="middle"
                    className="fill-emerald-700 font-sans font-black text-[8px]"
                  >
                    ★ HIGH
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip for explored months */}
      {hoveredPointIndex !== null && visiblePoints[hoveredPointIndex] && (
        <div
          className="absolute z-30 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-mono whitespace-nowrap pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 animate-scale-up"
          style={{
            left: `${(getX(hoveredPointIndex) / width) * 100}%`,
            top: `${(getY(visiblePoints[hoveredPointIndex].portfolioValueKRW) / height) * 100}%`,
          }}
        >
          <div className="flex items-center justify-between gap-3 text-[11px] pb-1.5 border-b border-slate-700">
            <span className="font-extrabold text-blue-300">
              {visiblePoints[hoveredPointIndex].month === 0
                ? `${visiblePoints[hoveredPointIndex].year}년 1월 1일 (시작)`
                : `${visiblePoints[hoveredPointIndex].year}년 ${visiblePoints[hoveredPointIndex].month}월`}
            </span>
            <span
              className={`font-bold ${
                visiblePoints[hoveredPointIndex].monthlyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {visiblePoints[hoveredPointIndex].month === 0
                ? '출발선 (기준)'
                : `당월: ${formatPercent(visiblePoints[hoveredPointIndex].monthlyReturn)}`}
            </span>
          </div>
          <div className="pt-1.5 space-y-1 text-[10px]">
            <div className="flex justify-between gap-4">
              <span className="text-blue-300 font-sans font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> 내 자산:
              </span>
              <span className="font-black text-white">
                {formatKRW(visiblePoints[hoveredPointIndex].portfolioValueKRW)}
              </span>
            </div>
            {showBenchmark && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-400 font-sans font-medium flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-slate-400 inline-block"></span> 시장 벤치마크:
                </span>
                <span className="font-bold text-slate-300">
                  {formatKRW(visiblePoints[hoveredPointIndex].primaryBenchmarkValueKRW)}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-slate-400 font-sans">YTD 수익률:</span>
              <span className="font-bold text-blue-200">
                {formatPercent(visiblePoints[hoveredPointIndex].ytdReturn)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400 font-sans">고점대비 낙폭:</span>
              <span
                className={`font-bold ${
                  visiblePoints[hoveredPointIndex].drawdown < -0.001 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatPercent(visiblePoints[hoveredPointIndex].drawdown)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
