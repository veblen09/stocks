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
  Activity,
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
  // Primary view mode: 'MOUNTAIN' (Area line chart) vs 'CANDLE' (Candlestick + MA)
  const [chartMode, setChartMode] = useState<'MOUNTAIN' | 'CANDLE'>('MOUNTAIN');
  const [period, setPeriod] = useState<NaverPeriodType>('1Y');
  const [candleType, setCandleType] = useState<NaverCandleType>('LINE');
  const [currencyMode, setCurrencyMode] = useState<'KRW' | 'LOCAL'>('KRW');
  const [showMA, setShowMA] = useState({ ma5: true, ma20: true, ma60: true, ma120: false });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Tab Selection Handler (Naver Pay Securities Style)
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
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
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

  // Period gain vs daily gain
  const displayChangeAmount = chartMode === 'MOUNTAIN' ? periodChangeAmount : changeAmount;
  const displayChangePercent = chartMode === 'MOUNTAIN' ? periodChangePercent : changePercent;
  const isUp = displayChangeAmount >= 0;

  const periodLabelMap: Record<NaverPeriodType, string> = {
    '1D': '오늘 장중',
    '1M': '지난 1개월',
    '3M': '지난 3개월',
    '1Y': '지난 1년',
    '3Y': '지난 3년',
    '10Y': '지난 10년',
    'ALL': '전체 기간',
  };

  const activeCandle =
    hoveredIndex !== null && candles[hoveredIndex] ? candles[hoveredIndex] : candles[candles.length - 1];

  // SVG Geometry Settings
  const svgWidth = isExpanded ? 920 : 680;
  const svgHeight = isExpanded ? 350 : 280;

  const padLeft = 68; // Y-axis price labels
  const padRight = 24;
  const padTop = 24;
  const padBottom = 28; // X-axis date labels

  const volumeHeightRatio = 0.17;
  const volumeH = (svgHeight - padTop - padBottom) * volumeHeightRatio;
  const mainChartH = (svgHeight - padTop - padBottom) * (1 - volumeHeightRatio) - 12;
  const baseY = padTop + mainChartH;

  const chartW = svgWidth - padLeft - padRight;
  const candleCount = candles.length;
  const slotW = chartW / Math.max(1, candleCount);
  const barW = Math.max(1.5, Math.min(10, slotW * 0.72));

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
  const yMinPadded = Math.max(0, minY - ySpan * 0.08);
  const yMaxPadded = maxY + ySpan * 0.08;
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

  // Smooth Monotone Spline Path Generator
  const mountainPoints = useMemo(() => {
    return candles.map((c, idx) => ({
      x: getX(idx),
      y: getY(c.close),
      price: c.close,
    }));
  }, [candles, slotW, padLeft, padTop, mainChartH, yMinPadded, ySpanPadded]);

  const smoothLinePath = useMemo(() => {
    if (mountainPoints.length === 0) return '';
    if (mountainPoints.length === 1) return `M ${mountainPoints[0].x.toFixed(1)},${mountainPoints[0].y.toFixed(1)}`;
    if (mountainPoints.length === 2) {
      return `M ${mountainPoints[0].x.toFixed(1)},${mountainPoints[0].y.toFixed(1)} L ${mountainPoints[1].x.toFixed(1)},${mountainPoints[1].y.toFixed(1)}`;
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

  // Highest & Lowest points for Callout Tags
  let highestIdx = 0;
  let highestVal = -Infinity;
  let lowestIdx = 0;
  let lowestVal = Infinity;

  candles.forEach((c, idx) => {
    const highVal = chartMode === 'CANDLE' ? c.high : c.close;
    const lowVal = chartMode === 'CANDLE' ? c.low : c.close;
    if (highVal > highestVal) {
      highestVal = highVal;
      highestIdx = idx;
    }
    if (lowVal < lowestVal) {
      lowestVal = lowVal;
      lowestIdx = idx;
    }
  });

  const highestX = getX(highestIdx);
  const highestY = getY(highestVal);

  const lowestX = getX(lowestIdx);
  const lowestY = getY(lowestVal);

  // Hover item details
  const hoveredCandle = hoveredIndex !== null ? candles[hoveredIndex] : null;
  const hoveredX = hoveredIndex !== null ? getX(hoveredIndex) : null;
  const hoveredY = hoveredCandle ? getY(chartMode === 'CANDLE' ? hoveredCandle.close : hoveredCandle.close) : null;

  // 52-Week Range Gauge %
  const range52Span = high52w - low52w || 1;
  const gaugePercent = Math.min(100, Math.max(0, ((currentPrice - low52w) / range52Span) * 100));

  // Naver Pay Signature Palette
  // Up: Naver Red #f04452 / Down: Naver Blue #1e70e7 / Mountain Accent: Emerald #059669
  const mountainStroke = isUp ? '#059669' : '#1e70e7';
  const mountainGradientId = `naverMountainGrad_${canonicalId}`;

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDarkMode
          ? 'bg-slate-950 text-slate-100 border-slate-800 shadow-xl'
          : 'bg-white text-slate-900 border-slate-200 shadow-sm'
      }`}
    >
      {/* 1. Naver Pay Securities Style Clean Stock Header */}
      <div className={`p-4 sm:p-5 border-b ${isDarkMode ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-100 bg-white'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Company Title & Price Summary */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {stockNameKo}
              </h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {ticker}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                {market === 'KR' ? 'KOSPI' : 'NASDAQ'}
              </span>
            </div>

            {/* Big Price Display */}
            <div className="flex flex-wrap items-baseline gap-2.5 mt-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-950 dark:text-white">
                {formatPrice(currentPrice)}
              </span>

              <div
                className={`flex items-center gap-1 font-bold font-mono text-sm sm:text-base ${
                  isUp ? 'text-[#f04452]' : 'text-[#1e70e7]'
                }`}
              >
                {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>
                  {isUp ? '▲' : '▼'} {formatPrice(Math.abs(displayChangeAmount))}
                </span>
                <span>({formatPercent(displayChangePercent)})</span>
                <span className="text-xs font-sans text-slate-400 dark:text-slate-500 font-semibold ml-1">
                  · {chartMode === 'MOUNTAIN' ? periodLabelMap[period] : '전일 대비'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>{market === 'KR' ? 'KRX' : 'NASDAQ'} {upToYear}.12.31 종가 기준</span>
            </div>
          </div>

          {/* Right Controls: Mode Toggle, Currency, Theme, Expand */}
          <div className="flex items-center gap-2 self-start flex-wrap">
            {/* View Mode Toggle: Mountain vs Candlestick */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => {
                  setChartMode('MOUNTAIN');
                  setCandleType('LINE');
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'MOUNTAIN'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="산 모양 면적 라인 차트"
              >
                <Mountain size={13} />
                <span>산 모양</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChartMode('CANDLE');
                  if (candleType === 'LINE') setCandleType('DAY');
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'CANDLE'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="캔들스틱 봉차트"
              >
                <BarChart2 size={13} />
                <span>봉차트</span>
              </button>
            </div>

            {/* Currency Toggle for US Stock */}
            {isUsStock && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setCurrencyMode('KRW')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    currencyMode === 'KRW' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  KRW
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyMode('LOCAL')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    currencyMode === 'LOCAL' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500'
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
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 transition cursor-pointer"
              title="다크 모드 전환"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Expand Toggle */}
            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 transition cursor-pointer"
                title={isExpanded ? '차트 축소' : '차트 크게 보기'}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            )}
          </div>
        </div>

        {/* Live Hover Info Bar (OHLCV) */}
        {hoveredCandle && (
          <div
            className={`mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
              isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-500" />
              <span className="font-bold text-slate-900 dark:text-slate-100">{activeCandle.date}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span>시가: <strong>{formatPrice(activeCandle.open)}</strong></span>
              <span>고가: <strong className="text-[#f04452]">{formatPrice(activeCandle.high)}</strong></span>
              <span>저가: <strong className="text-[#1e70e7]">{formatPrice(activeCandle.low)}</strong></span>
              <span>종가: <strong className={activeCandle.isYangbong ? 'text-[#f04452]' : 'text-[#1e70e7]'}>{formatPrice(activeCandle.close)}</strong></span>
              <span>거래량: <strong>{activeCandle.volume.toLocaleString()}주</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Naver Pay Securities Unified Tab Toolbar */}
      <div
        className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
          isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/70'
        }`}
      >
        {/* Left: Period Range & Candle Resolution Tabs */}
        <div className="flex items-center gap-1 flex-wrap font-bold">
          {/* Period Range Tabs: 1일, 3개월, 1년, 3년, 10년, 전체 */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-slate-800">
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
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {periodLabels[pVal]}
                </button>
              );
            })}
          </div>

          {/* Candle Tabs: 일봉, 주봉, 월봉 */}
          <div className="flex items-center gap-0.5 pl-1">
            {(['DAY', 'WEEK', 'MONTH'] as NaverCandleType[]).map(cType => {
              const labels: Record<string, string> = { DAY: '일봉', WEEK: '주봉', MONTH: '월봉' };
              const isActive = chartMode === 'CANDLE' && candleType === cType;
              return (
                <button
                  key={cType}
                  type="button"
                  onClick={() => handleSelectTab('CANDLE', cType)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-blue-500/40 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {labels[cType]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: MA Toggles (Active in Candle mode) */}
        {chartMode === 'CANDLE' && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma5: !prev.ma5 }))}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer transition ${
                showMA.ma5 ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900' : 'text-slate-400 opacity-40'
              }`}
            >
              <span className="w-2 h-0.5 bg-[#ef4444] rounded-full" />
              <span>5일선</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma20: !prev.ma20 }))}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer transition ${
                showMA.ma20 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900' : 'text-slate-400 opacity-40'
              }`}
            >
              <span className="w-2 h-0.5 bg-[#f59e0b] rounded-full" />
              <span>20일선</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma60: !prev.ma60 }))}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer transition ${
                showMA.ma60 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' : 'text-slate-400 opacity-40'
              }`}
            >
              <span className="w-2 h-0.5 bg-[#10b981] rounded-full" />
              <span>60일선</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma120: !prev.ma120 }))}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer transition ${
                showMA.ma120 ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900' : 'text-slate-400 opacity-40'
              }`}
            >
              <span className="w-2 h-0.5 bg-[#8b5cf6] rounded-full" />
              <span>120일선</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Interactive Main SVG Chart Canvas */}
      <div className="relative p-3 select-none">
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
              <stop offset="0%" stopColor={mountainStroke} stopOpacity="0.32" />
              <stop offset="60%" stopColor={mountainStroke} stopOpacity="0.08" />
              <stop offset="100%" stopColor={mountainStroke} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & Left Y-Axis Price Labels */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((pct, i) => {
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
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {isLocalCurrency ? `$${priceVal.toFixed(2)}` : Math.round(priceVal).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Baseline (Boundary line above volume bars) */}
          <line
            x1={padLeft}
            y1={baseY}
            x2={svgWidth - padRight}
            y2={baseY}
            stroke={isDarkMode ? '#334155' : '#e2e8f0'}
            strokeWidth="1.2"
          />

          {/* ======================================================== */}
          {/* MODE A: Mountain Area Line Chart (Naver Finance Look)    */}
          {/* ======================================================== */}
          {chartMode === 'MOUNTAIN' && (
            <>
              {/* Mountain Gradient Area */}
              {smoothAreaPath && <path d={smoothAreaPath} fill={`url(#${mountainGradientId})`} />}

              {/* Mountain Crisp Spline Line */}
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

              {/* Volume Bars along the baseline */}
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
                    opacity={isHov ? 0.95 : 0.45}
                    rx="0.5"
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
                const color = isYang ? '#f04452' : '#1e70e7';

                return (
                  <g key={idx}>
                    {/* High-Low Wick */}
                    <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" />
                    {/* Open-Close Body */}
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
                <path d={buildMAPath('ma5')} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              )}
              {showMA.ma20 && (
                <path d={buildMAPath('ma20')} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
              )}
              {showMA.ma60 && (
                <path d={buildMAPath('ma60')} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
              )}
              {showMA.ma120 && (
                <path d={buildMAPath('ma120')} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
              )}

              {/* Candle Volume Bars */}
              {candles.map((c, idx) => {
                const x = getX(idx);
                const yVol = getVolY(c.volume);
                const vHeight = Math.max(1, baseY - yVol);
                const color = c.isYangbong ? '#f04452' : '#1e70e7';

                return (
                  <rect
                    key={`vol-${idx}`}
                    x={x - barW / 2}
                    y={yVol}
                    width={barW}
                    height={vHeight}
                    fill={color}
                    opacity={hoveredIndex === idx ? 0.95 : 0.4}
                    rx="0.5"
                  />
                );
              })}
            </>
          )}

          {/* Highest Price Tag (최고가 핀) */}
          {highestIdx >= 0 && (
            <g pointerEvents="none">
              <line
                x1={highestX}
                y1={highestY}
                x2={highestX}
                y2={Math.max(padTop - 6, highestY - 14)}
                stroke="#f04452"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <rect
                x={Math.min(svgWidth - padRight - 68, Math.max(padLeft, highestX - 34))}
                y={Math.max(4, highestY - 20)}
                width="68"
                height="16"
                rx="4"
                fill="#f04452"
              />
              <text
                x={Math.min(svgWidth - padRight - 34, Math.max(padLeft + 34, highestX))}
                y={Math.max(15, highestY - 8)}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="monospace"
              >
                최고 {isLocalCurrency ? `$${highestVal.toFixed(2)}` : Math.round(highestVal).toLocaleString()}
              </text>
            </g>
          )}

          {/* Lowest Price Tag (최저가 핀) */}
          {lowestIdx >= 0 && (
            <g pointerEvents="none">
              <line
                x1={lowestX}
                y1={lowestY}
                x2={lowestX}
                y2={Math.min(baseY - 4, lowestY + 14)}
                stroke="#1e70e7"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <rect
                x={Math.min(svgWidth - padRight - 68, Math.max(padLeft, lowestX - 34))}
                y={Math.min(baseY - 18, lowestY + 4)}
                width="68"
                height="16"
                rx="4"
                fill="#1e70e7"
              />
              <text
                x={Math.min(svgWidth - padRight - 34, Math.max(padLeft + 34, lowestX))}
                y={Math.min(baseY - 6, lowestY + 16)}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="monospace"
              >
                최저 {isLocalCurrency ? `$${lowestVal.toFixed(2)}` : Math.round(lowestVal).toLocaleString()}
              </text>
            </g>
          )}

          {/* X-Axis Date Ticks */}
          {candles.map((c, idx) => {
            const step = Math.max(1, Math.floor(candleCount / 6));
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
                r="5"
                fill={chartMode === 'CANDLE' ? (hoveredCandle.isYangbong ? '#f04452' : '#1e70e7') : mountainStroke}
                stroke="#ffffff"
                strokeWidth="2.5"
                className="shadow-md"
              />

              {/* Bottom Date Badge */}
              <rect x={hoveredX - 30} y={svgHeight - 20} width="60" height="16" fill="#0f172a" rx="4" />
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
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20">
        <div
          className={`p-3.5 rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/90 shadow-2xs'
          } space-y-2`}
        >
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Activity size={12} className="text-emerald-500" />
              <span>52주 시세 위치</span>
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
              {gaugePercent.toFixed(1)}% 지점
            </span>
          </div>

          <div className="relative pt-5 pb-1">
            {/* '현재가' badge pointer */}
            <div
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 pointer-events-none z-10"
              style={{ left: `${Math.min(94, Math.max(6, gaugePercent))}%` }}
            >
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                현재 {formatPrice(currentPrice)}
              </span>
            </div>
            {/* Track */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, gaugePercent))}%` }}
              />
            </div>
            {/* Dot Marker */}
            <div
              className="w-3.5 h-3.5 bg-emerald-600 border-2 border-white dark:border-slate-900 rounded-full absolute top-[27px] -translate-y-1/2 -translate-x-1/2 shadow-xs transition-all duration-300"
              style={{ left: `${Math.min(98, Math.max(2, gaugePercent))}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300 pt-0.5">
            <span>
              52주 최저 <strong className="font-mono text-slate-900 dark:text-white ml-1">{formatPrice(low52w)}</strong>
            </span>
            <span>
              52주 최고 <strong className="font-mono text-slate-900 dark:text-white ml-1">{formatPrice(high52w)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 5. Key Financial Analytics & Historical Metrics Grid */}
      <div
        className={`p-3 border-t grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs ${
          isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/60'
        }`}
      >
        <div
          className={`p-2.5 rounded-xl border transition ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block text-[11px] font-semibold">직전 1년 수익률</span>
          <span
            className={`font-black font-mono text-sm mt-0.5 block ${
              stats.last1YrReturn !== null && stats.last1YrReturn >= 0 ? 'text-[#f04452]' : 'text-[#1e70e7]'
            }`}
          >
            {stats.last1YrReturn !== null ? formatPercent(stats.last1YrReturn) : '자료 부족'}
          </span>
        </div>

        <div
          className={`p-2.5 rounded-xl border transition ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block text-[11px] font-semibold">3년 연평균 (CAGR)</span>
          <span className="font-black font-mono text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
            {stats.past3YrCAGR !== null ? formatPercent(stats.past3YrCAGR) : '3년 미충족'}
          </span>
        </div>

        <div
          className={`p-2.5 rounded-xl border transition ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block text-[11px] font-semibold">과거 연간 변동성</span>
          <span className="font-black font-mono text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
            {stats.historicalVolatility !== null ? formatPercent(stats.historicalVolatility) : '이력 부족'}
          </span>
        </div>

        <div
          className={`p-2.5 rounded-xl border transition ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-2xs'
          }`}
        >
          <span className="text-slate-400 block text-[11px] font-semibold">최대 낙폭 (MDD)</span>
          <span className="font-black font-mono text-rose-600 text-sm mt-0.5 block">
            {stats.historicalMDD !== null ? `-${formatPercent(stats.historicalMDD)}` : '이력 부족'}
          </span>
        </div>
      </div>
    </div>
  );
};
