import React, { useState, useMemo, useRef } from 'react';
import {
  getCompanyNaverChartData,
  type NaverCandleType,
  type NaverPeriodType,
} from '../engine/companyChartEngine';
import { formatKRW, formatPercent } from '../utils/formatMoney';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Mountain,
  BarChart2,
} from 'lucide-react';

interface CompanyPriceChartProps {
  canonicalId: string;
  upToYear: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const CompanyPriceChart: React.FC<CompanyPriceChartProps> = ({
  canonicalId,
  upToYear,
  isExpanded = false,
  onToggleExpand,
}) => {
  // Primary view mode: 'MOUNTAIN' (Area line chart with gradient fill) vs 'CANDLE' (Candlestick + MA)
  const [chartMode, setChartMode] = useState<'MOUNTAIN' | 'CANDLE'>('MOUNTAIN');
  const [period, setPeriod] = useState<NaverPeriodType>('10Y');
  const [candleType, setCandleType] = useState<NaverCandleType>('LINE');
  const [currencyMode, setCurrencyMode] = useState<'KRW' | 'LOCAL'>('KRW');
  const [showMA, setShowMA] = useState({ ma5: true, ma20: true, ma60: true, ma120: false });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Tab Selection Handler (Naver Finance Style)
  const handleSelectTab = (type: 'CANDLE' | 'PERIOD', val: NaverCandleType | NaverPeriodType) => {
    if (type === 'CANDLE') {
      const cType = val as NaverCandleType;
      setCandleType(cType);
      setChartMode('CANDLE');
      if (cType === 'DAY') setPeriod('1Y');
      else if (cType === 'WEEK') setPeriod('3Y');
      else if (cType === 'MONTH') setPeriod('10Y');
    } else {
      const pVal = val as NaverPeriodType;
      setPeriod(pVal);
      setChartMode('MOUNTAIN');
      setCandleType('LINE');
    }
  };

  const chartData = useMemo(() => {
    return getCompanyNaverChartData(canonicalId, upToYear, candleType, period, currencyMode);
  }, [canonicalId, upToYear, candleType, period, currencyMode]);

  const containerRef = useRef<HTMLDivElement>(null);

  if (!chartData || chartData.candles.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
        <AlertCircle size={24} className="mx-auto mb-2 text-slate-400" />
        <span>{upToYear}년 기준 조회 가능한 과거 주가 시계열 데이터가 없습니다.</span>
      </div>
    );
  }

  const {
    stockNameKo,
    ticker,
    market,
    currentPrice,
    changeAmount,
    changePercent,
    periodChangeAmount,
    periodChangePercent,
    highPrice,
    lowPrice,
    high52w,
    low52w,
    candles,
    maxVolume,
    stats,
  } = chartData;

  const isUsStock = market === 'US';
  const isLocalCurrency = isUsStock && currencyMode === 'LOCAL';

  const formatPrice = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    if (isLocalCurrency) {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return formatKRW(val);
  };

  // Check period gain vs daily gain
  const displayChangeAmount = chartMode === 'MOUNTAIN' ? periodChangeAmount : changeAmount;
  const displayChangePercent = chartMode === 'MOUNTAIN' ? periodChangePercent : changePercent;
  const isUp = displayChangeAmount >= 0;

  const periodLabelMap: Record<NaverPeriodType, string> = {
    '1D': '1일',
    '1M': '지난 1개월',
    '3M': '지난 3개월',
    '1Y': '지난 1년',
    '3Y': '지난 3년',
    '10Y': '지난 10년',
    'ALL': '전체 기간',
  };

  const activeCandle =
    hoveredIndex !== null && candles[hoveredIndex] ? candles[hoveredIndex] : candles[candles.length - 1];

  // SVG Geometry
  const svgWidth = isExpanded ? 900 : 660;
  const svgHeight = isExpanded ? 340 : 270;

  const padLeft = 65; // Left price Y-axis labels (Naver style)
  const padRight = 15;
  const padTop = 20;
  const padBottom = 28; // Bottom X-axis dates

  const volumeHeightRatio = 0.18;
  const volumeH = (svgHeight - padTop - padBottom) * volumeHeightRatio;
  const mainChartH = (svgHeight - padTop - padBottom) * (1 - volumeHeightRatio) - 10;
  const baseY = padTop + mainChartH;

  const chartW = svgWidth - padLeft - padRight;
  const candleCount = candles.length;
  const slotW = chartW / Math.max(1, candleCount);
  const barW = Math.max(1.5, Math.min(10, slotW * 0.7));

  // Y-Scale calculations
  const allYValues: number[] = [];
  candles.forEach(c => {
    if (chartMode === 'CANDLE') {
      allYValues.push(c.high, c.low);
      if (showMA.ma5 && c.ma5) allYValues.push(c.ma5);
      if (showMA.ma20 && c.ma20) allYValues.push(c.ma20);
      if (showMA.ma60 && c.ma60) allYValues.push(c.ma60);
      if (showMA.ma120 && c.ma120) allYValues.push(c.ma120);
    } else {
      allYValues.push(c.close);
    }
  });

  const minY = Math.min(...allYValues);
  const maxY = Math.max(...allYValues);
  const ySpan = maxY - minY || 1;
  const yMinPadded = Math.max(0, minY - ySpan * 0.06);
  const yMaxPadded = maxY + ySpan * 0.06;
  const ySpanPadded = yMaxPadded - yMinPadded || 1;

  const getY = (val: number) => {
    return padTop + mainChartH - ((val - yMinPadded) / ySpanPadded) * mainChartH;
  };

  const getX = (idx: number) => {
    return padLeft + idx * slotW + slotW / 2;
  };

  // Volume Y-Scale
  const getVolY = (vol: number) => {
    return baseY - (vol / (maxVolume || 1)) * volumeH;
  };

  // Smooth Bezier Spline Path Generator (Mountain Curve)
  const mountainPoints = useMemo(() => {
    return candles.map((c, idx) => ({
      x: getX(idx),
      y: getY(c.close),
      price: c.close,
    }));
  }, [candles, slotW, padLeft, padTop, mainChartH, yMinPadded, ySpanPadded]);

  const smoothLinePath = useMemo(() => {
    if (mountainPoints.length === 0) return '';
    if (mountainPoints.length === 1) return `M ${mountainPoints[0].x},${mountainPoints[0].y}`;
    if (mountainPoints.length === 2) {
      return `M ${mountainPoints[0].x},${mountainPoints[0].y} L ${mountainPoints[1].x},${mountainPoints[1].y}`;
    }

    let d = `M ${mountainPoints[0].x.toFixed(1)},${mountainPoints[0].y.toFixed(1)}`;
    for (let i = 0; i < mountainPoints.length - 1; i++) {
      const p0 = mountainPoints[i === 0 ? 0 : i - 1];
      const p1 = mountainPoints[i];
      const p2 = mountainPoints[i + 1];
      const p3 = mountainPoints[i + 2 >= mountainPoints.length ? mountainPoints.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }, [mountainPoints]);

  const smoothAreaPath = useMemo(() => {
    if (mountainPoints.length === 0) return '';
    const firstX = mountainPoints[0].x;
    const lastX = mountainPoints[mountainPoints.length - 1].x;
    return `${smoothLinePath} L ${lastX.toFixed(1)},${baseY.toFixed(1)} L ${firstX.toFixed(1)},${baseY.toFixed(1)} Z`;
  }, [smoothLinePath, mountainPoints, baseY]);

  // Moving Average Paths for Candle Mode
  const buildMAPath = (maKey: 'ma5' | 'ma20' | 'ma60' | 'ma120') => {
    let d = '';
    candles.forEach((c, idx) => {
      const val = c[maKey];
      if (val !== null && val !== undefined) {
        const x = getX(idx);
        const y = getY(val);
        d = d === '' ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `${d} L ${x.toFixed(1)},${y.toFixed(1)}`;
      }
    });
    return d;
  };

  // Highest & Lowest points
  const highestCandleIdx = candles.findIndex(c => c.high === highPrice || c.close === highPrice);
  const lowestCandleIdx = candles.findIndex(c => c.low === lowPrice || c.close === lowPrice);

  const highestX = highestCandleIdx >= 0 ? getX(highestCandleIdx) : 0;
  const highestY = highestCandleIdx >= 0 ? getY(highPrice) : 0;

  const lowestX = lowestCandleIdx >= 0 ? getX(lowestCandleIdx) : 0;
  const lowestY = lowestCandleIdx >= 0 ? getY(lowPrice) : 0;

  // Hover item details
  const hoveredCandle = hoveredIndex !== null ? candles[hoveredIndex] : null;
  const hoveredX = hoveredIndex !== null ? getX(hoveredIndex) : null;
  const hoveredY = hoveredCandle ? getY(hoveredCandle.close) : null;

  // 52-Week Range Gauge %
  const range52Span = high52w - low52w || 1;
  const gaugePercent = Math.min(100, Math.max(0, ((currentPrice - low52w) / range52Span) * 100));

  // Mountain Color Theme (Emerald Green as in Naver Capture)
  const mountainStroke = isUp ? '#059669' : '#2563eb';
  const mountainGradientId = `naverMountainGrad_${canonicalId}`;

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDarkMode
          ? 'bg-slate-950 text-slate-100 border-slate-800'
          : 'bg-white text-slate-900 border-slate-200 shadow-sm'
      }`}
    >
      {/* 1. Naver Finance Style Stock Header */}
      <div className={`p-4 sm:p-5 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-white'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Company Title & Price Summary */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {stockNameKo}
              </h2>
              <span className="text-xs font-mono font-bold text-slate-500">
                {ticker} · {market === 'KR' ? 'KOSPI' : 'NASDAQ'}
              </span>
            </div>

            {/* Big Price Display */}
            <div className="flex flex-wrap items-baseline gap-2.5 mt-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-950 dark:text-white">
                {formatPrice(currentPrice)}
              </span>

              <div
                className={`flex items-center gap-1 font-bold font-mono text-sm sm:text-base ${
                  isUp ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>
                  {isUp ? '▲' : '▼'}{formatPrice(Math.abs(displayChangeAmount))}
                </span>
                <span>({isUp ? '+' : ''}{formatPercent(displayChangePercent)})</span>
                <span className="text-xs font-sans text-slate-500 font-semibold ml-0.5">
                  · {chartMode === 'MOUNTAIN' ? periodLabelMap[period] : '전일 대비'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-medium mt-1">
              KRX {upToYear}.12.31 종가 기준 · 장중
            </div>
          </div>

          {/* Right Controls: Theme, Currency, Expand */}
          <div className="flex items-center gap-1.5 self-start">
            {/* View Mode Toggle: Mountain vs Candlestick */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setChartMode('MOUNTAIN')}
                className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  chartMode === 'MOUNTAIN'
                    ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="산 모양 면적 차트 보기"
              >
                <Mountain size={12} />
                <span>산 모양</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode('CANDLE')}
                className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  chartMode === 'CANDLE'
                    ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="봉차트(캔들스틱) 보기"
              >
                <BarChart2 size={12} />
                <span>봉차트</span>
              </button>
            </div>

            {/* Currency Toggle for US Stock */}
            {isUsStock && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCurrencyMode('KRW')}
                  className={`px-2 py-0.5 rounded ${
                    currencyMode === 'KRW' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  KRW
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyMode('LOCAL')}
                  className={`px-2 py-0.5 rounded ${
                    currencyMode === 'LOCAL' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  USD
                </button>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="다크 모드 전환"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Expand Toggle */}
            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                title={isExpanded ? '차트 축소' : '차트 크게 보기'}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Live Hover Info Bar (OHLCV) */}
        {hoveredCandle && (
          <div
            className={`mt-3 pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
              isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-500" />
              <span className="font-bold text-slate-900 dark:text-slate-100">{activeCandle.date}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span>시: <strong>{formatPrice(activeCandle.open)}</strong></span>
              <span>고: <strong className="text-red-600">{formatPrice(activeCandle.high)}</strong></span>
              <span>저: <strong className="text-blue-600">{formatPrice(activeCandle.low)}</strong></span>
              <span>종: <strong className={activeCandle.isYangbong ? 'text-red-600' : 'text-blue-600'}>{formatPrice(activeCandle.close)}</strong></span>
              <span>량: <strong>{activeCandle.volume.toLocaleString()}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Naver Style Unified Tab Toolbar */}
      <div
        className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
          isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'
        }`}
      >
        {/* Left: Combined Candle & Period Range Tabs (Exact Naver Layout) */}
        <div className="flex items-center gap-1 flex-wrap font-bold">
          {/* Candle Tabs: 일봉, 주봉, 월봉 */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-slate-800">
            {(['DAY', 'WEEK', 'MONTH'] as NaverCandleType[]).map(cType => {
              const labels: Record<string, string> = { DAY: '일봉', WEEK: '주봉', MONTH: '월봉' };
              const isActive = chartMode === 'CANDLE' && candleType === cType;
              return (
                <button
                  key={cType}
                  type="button"
                  onClick={() => handleSelectTab('CANDLE', cType)}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                    isActive
                      ? 'border border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {labels[cType]}
                </button>
              );
            })}
          </div>

          {/* Period Range Tabs: 1일, 3개월, 1년, 3년, 10년, 전체 */}
          <div className="flex items-center gap-0.5 pl-1">
            {(['1D', '3M', '1Y', '3Y', '10Y', 'ALL'] as NaverPeriodType[]).map(pVal => {
              const periodLabels: Record<NaverPeriodType, string> = {
                '1D': '1일',
                '1M': '1개월',
                '3M': '3개월',
                '1Y': '1년',
                '3Y': '3년',
                '10Y': '10년',
                'ALL': '전체',
              };
              const isActive = chartMode === 'MOUNTAIN' && period === pVal;
              return (
                <button
                  key={pVal}
                  type="button"
                  onClick={() => handleSelectTab('PERIOD', pVal)}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                    isActive
                      ? 'border border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {periodLabels[pVal]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: MA Toggles (Active only in Candle mode) */}
        {chartMode === 'CANDLE' && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma5: !prev.ma5 }))}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded cursor-pointer ${
                showMA.ma5 ? 'bg-rose-100 text-rose-700' : 'text-slate-400 opacity-40'
              }`}
            >
              <span className="w-2 h-0.5 bg-rose-500 rounded-full" />
              <span>5</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma20: !prev.ma20 }))}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded cursor-pointer ${
                showMA.ma20 ? 'bg-amber-100 text-amber-700' : 'text-slate-400 opacity-40'
              }`}
            >
              <span className="w-2 h-0.5 bg-amber-500 rounded-full" />
              <span>20</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma60: !prev.ma60 }))}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded cursor-pointer ${
                showMA.ma60 ? 'bg-orange-100 text-orange-700' : 'text-slate-400 opacity-40'
              }`}
            >
              <span className="w-2 h-0.5 bg-orange-500 rounded-full" />
              <span>60</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma120: !prev.ma120 }))}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded cursor-pointer ${
                showMA.ma120 ? 'bg-purple-100 text-purple-700' : 'text-slate-400 opacity-40'
              }`}
            >
              <span className="w-2 h-0.5 bg-purple-500 rounded-full" />
              <span>120</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Interactive Main Chart Canvas */}
      <div className="relative p-2 sm:p-3 select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full overflow-visible"
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            const idx = Math.floor((mouseX - padLeft) / slotW);
            if (idx >= 0 && idx < candles.length) {
              setHoveredIndex(idx);
            }
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Naver Finance Mountain Gradient */}
            <linearGradient id={mountainGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={mountainStroke} stopOpacity="0.35" />
              <stop offset="50%" stopColor={mountainStroke} stopOpacity="0.12" />
              <stop offset="100%" stopColor={mountainStroke} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & Left Y-Axis Price Labels (Naver Style) */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((pct, i) => {
            const y = padTop + mainChartH * pct;
            const priceVal = yMaxPadded - pct * ySpanPadded;
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke={isDarkMode ? '#1e293b' : '#f1f5f9'}
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill={isDarkMode ? '#64748b' : '#94a3b8'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {isLocalCurrency ? `$${priceVal.toFixed(1)}` : Math.round(priceVal).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Baseline (Dark horizontal boundary at the bottom) */}
          <line
            x1={padLeft}
            y1={baseY}
            x2={svgWidth - padRight}
            y2={baseY}
            stroke={isDarkMode ? '#334155' : '#475569'}
            strokeWidth="1.2"
          />

          {/* ======================================================== */}
          {/* MODE A: Mountain / Area Line Chart (Naver Finance Look)  */}
          {/* ======================================================== */}
          {chartMode === 'MOUNTAIN' && (
            <>
              {/* Mountain Gradient Area */}
              {smoothAreaPath && <path d={smoothAreaPath} fill={`url(#${mountainGradientId})`} />}

              {/* Mountain Smooth Line */}
              {smoothLinePath && (
                <path
                  d={smoothLinePath}
                  fill="none"
                  stroke={mountainStroke}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Volume Bars along the baseline (subtle slate gray) */}
              {candles.map((c, idx) => {
                const x = getX(idx);
                const yVol = getVolY(c.volume);
                const vHeight = Math.max(1, baseY - yVol);
                const isHov = hoveredIndex === idx;

                return (
                  <rect
                    key={`vol-${idx}`}
                    x={x - barW / 2}
                    y={yVol}
                    width={barW}
                    height={vHeight}
                    fill={isDarkMode ? '#64748b' : '#cbd5e1'}
                    opacity={isHov ? 0.9 : 0.45}
                  />
                );
              })}
            </>
          )}

          {/* ======================================================== */}
          {/* MODE B: Candlestick Mode (일봉, 주봉, 월봉)               */}
          {/* ======================================================== */}
          {chartMode === 'CANDLE' && (
            <>
              {candles.map((c, idx) => {
                const x = getX(idx);
                const yOpen = getY(c.open);
                const yClose = getY(c.close);
                const yHigh = getY(c.high);
                const yLow = getY(c.low);

                const candleTop = Math.min(yOpen, yClose);
                const candleHeight = Math.max(2, Math.abs(yClose - yOpen));
                const isYang = c.isYangbong;
                const color = isYang ? '#ef4444' : '#3b82f6';

                return (
                  <g key={idx}>
                    {/* Wick */}
                    <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" />
                    {/* Body */}
                    <rect
                      x={x - barW / 2}
                      y={candleTop}
                      width={barW}
                      height={candleHeight}
                      fill={color}
                      rx="0.5"
                    />
                  </g>
                );
              })}

              {/* Moving Average Polyline Overlays */}
              {showMA.ma5 && (
                <path d={buildMAPath('ma5')} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
              )}
              {showMA.ma20 && (
                <path d={buildMAPath('ma20')} fill="none" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
              )}
              {showMA.ma60 && (
                <path d={buildMAPath('ma60')} fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
              )}
              {showMA.ma120 && (
                <path d={buildMAPath('ma120')} fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
              )}

              {/* Candle Volume Bars (Colored) */}
              {candles.map((c, idx) => {
                const x = getX(idx);
                const yVol = getVolY(c.volume);
                const vHeight = Math.max(1, baseY - yVol);
                const color = c.isYangbong ? '#ef4444' : '#3b82f6';

                return (
                  <rect
                    key={`vol-${idx}`}
                    x={x - barW / 2}
                    y={yVol}
                    width={barW}
                    height={vHeight}
                    fill={color}
                    opacity={hoveredIndex === idx ? 0.9 : 0.5}
                  />
                );
              })}
            </>
          )}

          {/* Highest Price Tag (최고가) */}
          {highestCandleIdx >= 0 && (
            <g>
              <line
                x1={highestX}
                y1={highestY}
                x2={highestX + 20}
                y2={highestY - 10}
                stroke="#ef4444"
                strokeWidth="1"
              />
              <rect x={highestX + 20} y={highestY - 18} width="60" height="15" rx="3" fill="#ef4444" />
              <text
                x={highestX + 50}
                y={highestY - 7}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                최고 {isLocalCurrency ? `$${highPrice.toFixed(1)}` : Math.round(highPrice).toLocaleString()}
              </text>
            </g>
          )}

          {/* Lowest Price Tag (최저가) */}
          {lowestCandleIdx >= 0 && (
            <g>
              <line
                x1={lowestX}
                y1={lowestY}
                x2={lowestX + 20}
                y2={lowestY + 10}
                stroke="#3b82f6"
                strokeWidth="1"
              />
              <rect x={lowestX + 20} y={lowestY + 4} width="60" height="15" rx="3" fill="#3b82f6" />
              <text
                x={lowestX + 50}
                y={lowestY + 15}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                최저 {isLocalCurrency ? `$${lowPrice.toFixed(1)}` : Math.round(lowPrice).toLocaleString()}
              </text>
            </g>
          )}

          {/* X-Axis Date Ticks (Evenly spaced dates like Naver: 2018/01, 2021/01, 2024/01) */}
          {candles.map((c, idx) => {
            const step = Math.max(1, Math.floor(candleCount / 5));
            const shouldShow = idx % step === 0 || idx === candleCount - 1;
            if (!shouldShow) return null;

            return (
              <text
                key={`x-${idx}`}
                x={getX(idx)}
                y={svgHeight - 8}
                textAnchor="middle"
                fill={isDarkMode ? '#64748b' : '#94a3b8'}
                fontSize="9.5"
                fontFamily="monospace"
                fontWeight="600"
              >
                {c.label}
              </text>
            );
          })}

          {/* Crosshair Cursor & Interactive Guide */}
          {hoveredIndex !== null && hoveredCandle && hoveredX !== null && hoveredY !== null && (
            <g pointerEvents="none">
              {/* Vertical Guide Line */}
              <line
                x1={hoveredX}
                y1={padTop}
                x2={hoveredX}
                y2={baseY}
                stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Current Point Dot */}
              <circle
                cx={hoveredX}
                cy={hoveredY}
                r="4.5"
                fill={mountainStroke}
                stroke="#ffffff"
                strokeWidth="2"
                className="shadow-xs"
              />

              {/* Bottom Date Badge */}
              <rect x={hoveredX - 28} y={svgHeight - 20} width="56" height="16" fill="#1e293b" rx="3" />
              <text
                x={hoveredX}
                y={svgHeight - 8}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {hoveredCandle.label}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* 4. Naver Signature: 52-Week Price Range Slider Bar */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
        <div
          className={`p-3.5 rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          } space-y-2`}
        >
          <div className="relative pt-5 pb-1">
            {/* '현재가' badge pointer */}
            <div
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 pointer-events-none"
              style={{ left: `${Math.min(95, Math.max(5, gaugePercent))}%` }}
            >
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 shadow-2xs">
                현재가
              </span>
            </div>
            {/* Track */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full relative overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, gaugePercent))}%` }}
              />
            </div>
            {/* Dot Marker */}
            <div
              className="w-3.5 h-3.5 bg-emerald-600 border-2 border-white dark:border-slate-900 rounded-full absolute top-[27px] -translate-y-1/2 -translate-x-1/2 shadow-xs transition-all duration-300"
              style={{ left: `${Math.min(98, Math.max(2, gaugePercent))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>
              52주 최저 <strong className="font-mono text-slate-900 dark:text-white">{formatPrice(low52w)}</strong>
            </span>
            <span>
              52주 최고 <strong className="font-mono text-slate-900 dark:text-white">{formatPrice(high52w)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 5. Financial Analytics & Historical Metrics Footer */}
      <div
        className={`p-3 border-t grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs ${
          isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/60'
        }`}
      >
        <div
          className={`p-2.5 rounded-xl border ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-slate-400 block text-[11px]">직전 1년 수익률</span>
          <span
            className={`font-bold font-mono text-sm mt-0.5 block ${
              stats.last1YrReturn !== null && stats.last1YrReturn >= 0 ? 'text-red-600' : 'text-blue-600'
            }`}
          >
            {stats.last1YrReturn !== null
              ? `${stats.last1YrReturn >= 0 ? '+' : ''}${formatPercent(stats.last1YrReturn)}`
              : '자료 부족'}
          </span>
        </div>

        <div
          className={`p-2.5 rounded-xl border ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-slate-400 block text-[11px]">3년 연평균 (CAGR)</span>
          <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
            {stats.past3YrCAGR !== null ? formatPercent(stats.past3YrCAGR) : '3년 미충족'}
          </span>
        </div>

        <div
          className={`p-2.5 rounded-xl border ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-slate-400 block text-[11px]">과거 연간 변동성</span>
          <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
            {stats.historicalVolatility !== null ? formatPercent(stats.historicalVolatility) : '이력 부족'}
          </span>
        </div>

        <div
          className={`p-2.5 rounded-xl border ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-slate-400 block text-[11px]">최대 낙폭 (MDD)</span>
          <span className="font-bold font-mono text-rose-600 text-sm mt-0.5 block">
            {stats.historicalMDD !== null ? `-${formatPercent(stats.historicalMDD)}` : '이력 부족'}
          </span>
        </div>
      </div>
    </div>
  );
};
