import React, { useState, useMemo } from 'react';
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

/**
 * Concise KRW formatter for Y-axis scale ticks
 */
function formatYAxisKRW(amount: number): string {
  if (amount <= 0) return '0원';
  if (amount >= 1000000000000) {
    const jo = amount / 1000000000000;
    return `${jo % 1 === 0 ? jo : jo.toFixed(1)}조`;
  }
  if (amount >= 100000000) {
    const eok = amount / 100000000;
    return `${eok % 1 === 0 ? eok : eok.toFixed(1)}억`;
  }
  if (amount >= 10000) {
    const man = amount / 10000;
    return `${Math.round(man)}만`;
  }
  return `${Math.round(amount)}원`;
}

export const MarketReplayChart: React.FC<MarketReplayChartProps> = ({
  points,
  currentMonthIndex,
  startTotalAssetsKRW,
  showBenchmark,
  benchmarkName = '코스피 200',
  motionPreference = 'NORMAL',
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const benchmarkLabel = benchmarkName || '코스피 200';

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
  const width = 760;
  const height = 260;
  const padding = { top: 32, right: 140, bottom: 32, left: 62 };

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

  // Y-axis tick marks
  const yTicks = useMemo(() => {
    const count = 4; // 5 ticks total
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(minVal + (valRange * i) / count);
    }
    return ticks;
  }, [minVal, valRange]);

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

  // Collision-free 2-line badge label positioning for right side
  let labelPortfolioY = portfolioY;
  let labelBenchmarkY = benchmarkY;
  let labelPeakY = currentPeakY;

  const minLabelSpacing = 30;
  const labelItems: { id: string; y: number }[] = [
    { id: 'portfolio', y: labelPortfolioY },
    ...(showBenchmark ? [{ id: 'benchmark', y: labelBenchmarkY }] : []),
    ...(isUnderwater ? [{ id: 'peak', y: labelPeakY }] : []),
  ];

  labelItems.sort((a, b) => a.y - b.y);

  for (let i = 1; i < labelItems.length; i++) {
    if (labelItems[i].y - labelItems[i - 1].y < minLabelSpacing) {
      labelItems[i].y = labelItems[i - 1].y + minLabelSpacing;
    }
  }

  const maxAllowedY = bottomY - 10;
  if (labelItems.length > 0 && labelItems[labelItems.length - 1].y > maxAllowedY) {
    const overflow = labelItems[labelItems.length - 1].y - maxAllowedY;
    for (let i = labelItems.length - 1; i >= 0; i--) {
      labelItems[i].y -= overflow;
      if (i > 0 && labelItems[i].y - labelItems[i - 1].y < minLabelSpacing) {
        labelItems[i - 1].y = labelItems[i].y - minLabelSpacing;
      }
    }
  }

  for (const item of labelItems) {
    if (item.id === 'portfolio') labelPortfolioY = item.y;
    if (item.id === 'benchmark') labelBenchmarkY = item.y;
    if (item.id === 'peak') labelPeakY = item.y;
  }

  return (
    <div className="relative w-full select-none space-y-2.5">
      {/* 1. Real-time Asset & Peak Comparison Status Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-1">
        {/* Card 1: My Current Portfolio Value */}
        <div className="flex flex-col p-2.5 rounded-xl bg-blue-50/90 border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-blue-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-pulse"></span>
              내 현재 자산 ({currentPoint.month === 0 ? '1/1' : `${currentPoint.month}월`})
            </span>
            <span className={`text-[10px] font-black font-mono ${currentPoint.ytdReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              YTD {currentPoint.ytdReturn >= 0 ? '+' : ''}{(currentPoint.ytdReturn * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-sm font-black text-blue-950 font-mono mt-1">
            {formatKRW(currentPoint.portfolioValueKRW)}
          </span>
        </div>

        {/* Card 2: Historical Peak (High-Water Mark) */}
        <div className="flex flex-col p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-800 flex items-center gap-1">
              👑 역대 최고점
            </span>
            {isUnderwater ? (
              <span className="text-[9.5px] font-black text-rose-600 bg-rose-100/80 px-1.5 py-0.2 rounded border border-rose-200">
                낙폭 {(currentPoint.drawdown * 100).toFixed(1)}%
              </span>
            ) : (
              <span className="text-[9.5px] font-black text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded">
                신고가 달성
              </span>
            )}
          </div>
          <span className="text-sm font-black text-emerald-950 font-mono mt-1">
            {formatKRW(currentPoint.runningPeakKRW)}
          </span>
        </div>

        {/* Card 3: Gap / Recovery Amount to Peak */}
        <div className={`flex flex-col p-2.5 rounded-xl border shadow-2xs ${
          isUnderwater ? 'bg-rose-50/90 border-rose-200' : 'bg-emerald-50/90 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold flex items-center gap-1 ${
              isUnderwater ? 'text-rose-700' : 'text-emerald-700'
            }`}>
              {isUnderwater ? '📉 고점 대비 차이' : '✨ 최고점 상태'}
            </span>
            {isUnderwater && (
              <span className="text-[9px] font-bold text-rose-600">
                {currentPoint.monthsUnderwater}개월째 하락
              </span>
            )}
          </div>
          <span className={`text-sm font-black font-mono mt-1 ${
            isUnderwater ? 'text-rose-950' : 'text-emerald-900'
          }`}>
            {isUnderwater ? `-${formatKRW(currentPoint.lossFromPeakKRW)}` : '🎉 역대 최고가 경신'}
          </span>
        </div>

        {/* Card 4: Market Benchmark */}
        {showBenchmark && (
          <div className="flex flex-col p-2.5 rounded-xl bg-slate-100/90 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1 truncate">
                <span className="w-2.5 h-0.5 border-t-2 border-dashed border-slate-500 inline-block"></span>
                벤치마크 ({benchmarkLabel})
              </span>
              <span className={`text-[10px] font-black font-mono ${
                currentPoint.primaryBenchmarkYtdReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {currentPoint.primaryBenchmarkYtdReturn >= 0 ? '+' : ''}{(currentPoint.primaryBenchmarkYtdReturn * 100).toFixed(1)}%
              </span>
            </div>
            <span className="text-sm font-black text-slate-900 font-mono mt-1">
              {formatKRW(currentPoint.primaryBenchmarkValueKRW)}
            </span>
          </div>
        )}
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

        {/* Y-Axis Horizontal Grid Lines & Scale Tick Labels */}
        {yTicks.map((tickVal, idx) => {
          const y = getY(tickVal);
          if (y < padding.top - 2 || y > bottomY + 2) return null;
          return (
            <g key={`ytick-${idx}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotWidth}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-slate-400 font-sans text-[9px] font-semibold select-none"
              >
                {formatYAxisKRW(tickVal)}
              </text>
            </g>
          );
        })}

        {/* Chart Background Bottom Baseline */}
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
                stroke={isCurrent ? '#93c5fd' : '#f8fafc'}
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

        {/* Peak Asset Reference Guideline (회복 목표 수평 기준선: 오직 낙폭 상태일 때만 표시) */}
        {isUnderwater && currentPeakY >= padding.top - 10 && currentPeakY <= bottomY && (
          <g>
            <line
              x1={padding.left}
              y1={currentPeakY}
              x2={padding.left + plotWidth}
              y2={currentPeakY}
              stroke="#059669"
              strokeWidth="1.4"
              strokeDasharray="4 3"
              opacity="0.85"
            />
            {/* Small label at the left start of peak line */}
            <text
              x={padding.left + 4}
              y={currentPeakY - 4}
              className="fill-emerald-700 font-sans text-[8.5px] font-extrabold select-none"
            >
              👑 역대 최고점 회복선 ({formatKRW(currentPoint.runningPeakKRW)})
            </text>
            {/* Right side badge */}
            <g transform={`translate(${padding.left + plotWidth + 6}, ${labelPeakY})`}>
              <rect
                x={0}
                y={-12}
                width={128}
                height={25}
                rx={6}
                fill="#ecfdf5"
                stroke="#059669"
                strokeWidth="1.2"
              />
              <text
                x={6}
                y={-1}
                className="fill-emerald-800 font-sans text-[8.5px] font-black"
              >
                👑 역대 최고점
              </text>
              <text
                x={6}
                y={10}
                className="fill-emerald-950 font-mono text-[9px] font-black"
              >
                {formatKRW(currentPoint.runningPeakKRW)}
              </text>
            </g>
          </g>
        )}

        {/* Visual Gap Connector Line & Drop Column between Peak and Current Portfolio Point */}
        {isUnderwater && (
          <g>
            <rect
              x={lastX - 2.5}
              y={Math.min(currentPeakY, portfolioY)}
              width={5}
              height={Math.abs(portfolioY - currentPeakY)}
              fill="rgba(244, 63, 94, 0.16)"
              rx={2}
            />
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
            <g transform={`translate(${lastX + 6}, ${labelBenchmarkY})`}>
              <rect
                x={0}
                y={-12}
                width={128}
                height={25}
                rx={6}
                fill="#f8fafc"
                stroke="#94a3b8"
                strokeWidth="1.2"
              />
              <text
                x={6}
                y={-1}
                className="fill-slate-700 font-sans text-[8px] font-extrabold truncate"
              >
                벤치마크 ({benchmarkLabel})
              </text>
              <text
                x={6}
                y={10}
                className="fill-slate-900 font-mono text-[9px] font-black"
              >
                {formatKRW(currentPoint.primaryBenchmarkValueKRW)}
              </text>
            </g>
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

        {/* Direct Label & Value Badge on My Portfolio End */}
        <g transform={`translate(${lastX + 6}, ${labelPortfolioY})`}>
          <rect
            x={0}
            y={-12}
            width={128}
            height={25}
            rx={6}
            fill="#eff6ff"
            stroke="#2563eb"
            strokeWidth="1.5"
          />
          <text
            x={6}
            y={-1}
            className="fill-blue-800 font-sans text-[8.5px] font-black"
          >
            🔵 내 포트폴리오
          </text>
          <text
            x={6}
            y={10}
            className="fill-blue-950 font-mono text-[9.5px] font-black"
          >
            {formatKRW(currentPoint.portfolioValueKRW)}
          </text>
        </g>

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
                  <span className="w-2 h-0.5 bg-slate-400 inline-block"></span> 벤치마크 ({benchmarkLabel}):
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

