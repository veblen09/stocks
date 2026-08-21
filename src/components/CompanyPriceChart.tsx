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
  const [period, setPeriod] = useState<NaverPeriodType>('1Y');
  const [candleType, setCandleType] = useState<NaverCandleType>('DAY');
  const [currencyMode, setCurrencyMode] = useState<'KRW' | 'LOCAL'>('KRW');
  const [showMA, setShowMA] = useState({ ma5: true, ma20: true, ma60: true, ma120: false });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Auto-adjust candle type if period changes (e.g. 10Y default to MONTH/WEEK, 1D to DAY)
  const handlePeriodChange = (newPeriod: NaverPeriodType) => {
    setPeriod(newPeriod);
    if (newPeriod === '1D') {
      setCandleType('DAY');
    } else if (newPeriod === '10Y' || newPeriod === 'ALL') {
      if (candleType === 'DAY') setCandleType('MONTH');
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
    prevClose,
    changeAmount,
    changePercent,
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

  const isUp = changeAmount >= 0;
  const activeCandle = hoveredIndex !== null && candles[hoveredIndex] ? candles[hoveredIndex] : candles[candles.length - 1];

  // SVG Dimension & Layout
  const svgWidth = isExpanded ? 900 : 660;
  const svgHeight = isExpanded ? 360 : 280;

  const padLeft = 10;
  const padRight = 65; // Right price axis
  const padTop = 20;
  const padBottom = 24; // Bottom date axis

  const volumeHeightRatio = 0.22;
  const volumeH = (svgHeight - padTop - padBottom) * volumeHeightRatio;
  const mainChartH = (svgHeight - padTop - padBottom) * (1 - volumeHeightRatio) - 14;

  const chartW = svgWidth - padLeft - padRight;
  const candleCount = candles.length;
  const slotW = chartW / candleCount;
  const barW = Math.max(1.5, Math.min(12, slotW * 0.7));

  // Main Price Y-Scale
  const allYValues: number[] = [];
  candles.forEach(c => {
    allYValues.push(c.high, c.low);
    if (showMA.ma5 && c.ma5) allYValues.push(c.ma5);
    if (showMA.ma20 && c.ma20) allYValues.push(c.ma20);
    if (showMA.ma60 && c.ma60) allYValues.push(c.ma60);
    if (showMA.ma120 && c.ma120) allYValues.push(c.ma120);
  });

  const minY = Math.min(...allYValues);
  const maxY = Math.max(...allYValues);
  const ySpan = maxY - minY || 1;
  const yMinPadded = Math.max(0, minY - ySpan * 0.05);
  const yMaxPadded = maxY + ySpan * 0.05;
  const ySpanPadded = yMaxPadded - yMinPadded || 1;

  const getY = (val: number) => {
    return padTop + mainChartH - ((val - yMinPadded) / ySpanPadded) * mainChartH;
  };

  const getX = (idx: number) => {
    return padLeft + idx * slotW + slotW / 2;
  };

  // Volume Y-Scale
  const getVolY = (vol: number) => {
    const volTop = padTop + mainChartH + 14;
    return volTop + volumeH - (vol / (maxVolume || 1)) * volumeH;
  };

  // Moving Average Paths
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

  // Line Chart Path
  const linePathD = candles.reduce((acc, c, idx) => {
    const x = getX(idx);
    const y = getY(c.close);
    return idx === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)},${y.toFixed(1)}`;
  }, '');

  const areaPathD =
    candles.length > 0
      ? `${linePathD} L ${getX(candles.length - 1).toFixed(1)},${padTop + mainChartH} L ${getX(0).toFixed(1)},${padTop + mainChartH} Z`
      : '';

  // Identify Highest & Lowest Points
  const highestCandleIdx = candles.findIndex(c => c.high === highPrice);
  const lowestCandleIdx = candles.findIndex(c => c.low === lowPrice);

  const highestX = highestCandleIdx >= 0 ? getX(highestCandleIdx) : 0;
  const highestY = highestCandleIdx >= 0 ? getY(highPrice) : 0;

  const lowestX = lowestCandleIdx >= 0 ? getX(lowestCandleIdx) : 0;
  const lowestY = lowestCandleIdx >= 0 ? getY(lowPrice) : 0;

  // Hovered item details
  const hoveredCandle = hoveredIndex !== null ? candles[hoveredIndex] : null;
  const hoveredX = hoveredIndex !== null ? getX(hoveredIndex) : null;
  const hoveredY = hoveredCandle ? getY(hoveredCandle.close) : null;

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border transition-colors ${
        isDarkMode
          ? 'bg-slate-950 text-slate-100 border-slate-800'
          : 'bg-white text-slate-900 border-slate-200 shadow-sm'
      }`}
    >
      {/* 1. Naver Finance Style Stock Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Company Title & Price Summary */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">{stockNameKo}</h2>
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                {ticker}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${market === 'KR' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'}`}>
                {market === 'KR' ? '코스피 / 코스닥' : '미국 증시 (US)'}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                {formatPrice(currentPrice)}
              </span>

              <div className={`flex items-center gap-1 font-bold font-mono text-sm sm:text-base ${isUp ? 'text-red-600' : 'text-blue-600'}`}>
                {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>
                  {isUp ? '▲' : '▼'} {formatPrice(Math.abs(changeAmount))}
                </span>
                <span>({isUp ? '+' : ''}{formatPercent(changePercent)})</span>
              </div>
            </div>
          </div>

          {/* Quick Key Stats 4-Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-right text-[11px] font-mono">
            <div className={`p-1.5 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-slate-400 block text-[10px]">전일 종가</span>
              <span className="font-bold">{formatPrice(prevClose)}</span>
            </div>
            <div className={`p-1.5 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-slate-400 block text-[10px]">기간 최고가</span>
              <span className="font-bold text-red-600">{formatPrice(highPrice)}</span>
            </div>
            <div className={`p-1.5 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-slate-400 block text-[10px]">기간 최저가</span>
              <span className="font-bold text-blue-600">{formatPrice(lowPrice)}</span>
            </div>
            <div className={`p-1.5 rounded-lg border hidden sm:block ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-slate-400 block text-[10px]">52주 최고/최저</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                {formatPrice(high52w)} / {formatPrice(low52w)}
              </span>
            </div>
          </div>
        </div>

        {/* Live Hover Info Bar (OHLCV) */}
        <div className={`mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-blue-500" />
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
      </div>

      {/* 2. Control Toolbar (Period Tabs & Candle Type Selectors) */}
      <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/70'}`}>
        {/* Left: Candle Types (일봉 / 주봉 / 월봉 / 라인) */}
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
          {(['DAY', 'WEEK', 'MONTH', 'LINE'] as NaverCandleType[]).map(type => {
            const labels: Record<NaverCandleType, string> = {
              DAY: '일봉',
              WEEK: '주봉',
              MONTH: '월봉',
              LINE: '라인',
            };
            return (
              <button
                key={type}
                type="button"
                onClick={() => setCandleType(type)}
                className={`px-2.5 py-1 font-bold rounded-lg transition cursor-pointer ${
                  candleType === type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>

        {/* Center: Period Range Tabs (1일, 1개월, 1년, 3년, 10년, 전체) */}
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl font-bold">
          {(['1D', '1M', '1Y', '3Y', '10Y', 'ALL'] as NaverPeriodType[]).map(p => {
            const periodLabels: Record<NaverPeriodType, string> = {
              '1D': '1일',
              '1M': '1개월',
              '1Y': '1년',
              '3Y': '3년',
              '10Y': '10년',
              ALL: '전체',
            };
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  period === p
                    ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {periodLabels[p]}
              </button>
            );
          })}
        </div>

        {/* Right: MA Toggles, USD/KRW, Theme & Expand */}
        <div className="flex items-center gap-2">
          {/* Moving Average Indicators */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma5: !prev.ma5 }))}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer ${showMA.ma5 ? 'bg-rose-100 text-rose-700' : 'text-slate-400 opacity-50'}`}
            >
              <span className="w-2 h-0.5 bg-rose-500 rounded-full" />
              <span>5</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma20: !prev.ma20 }))}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer ${showMA.ma20 ? 'bg-amber-100 text-amber-700' : 'text-slate-400 opacity-50'}`}
            >
              <span className="w-2 h-0.5 bg-amber-500 rounded-full" />
              <span>20</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma60: !prev.ma60 }))}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer ${showMA.ma60 ? 'bg-orange-100 text-orange-700' : 'text-slate-400 opacity-50'}`}
            >
              <span className="w-2 h-0.5 bg-orange-500 rounded-full" />
              <span>60</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMA(prev => ({ ...prev, ma120: !prev.ma120 }))}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer ${showMA.ma120 ? 'bg-purple-100 text-purple-700' : 'text-slate-400 opacity-50'}`}
            >
              <span className="w-2 h-0.5 bg-purple-500 rounded-full" />
              <span>120</span>
            </button>
          </div>

          {/* Currency Toggle for US Stock */}
          {isUsStock && (
            <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setCurrencyMode('KRW')}
                className={`px-2 py-0.5 rounded ${currencyMode === 'KRW' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
              >
                KRW
              </button>
              <button
                type="button"
                onClick={() => setCurrencyMode('LOCAL')}
                className={`px-2 py-0.5 rounded ${currencyMode === 'LOCAL' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
              >
                USD
              </button>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title="다크 모드 전환"
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Expand Toggle */}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title={isExpanded ? '차트 축소' : '차트 크게 보기'}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* 3. Interactive Main Chart Canvas */}
      <div className="relative p-2 select-none">
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
            <linearGradient id="naverLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & Right Price Axis Labels */}
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
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <text
                  x={svgWidth - padRight + 6}
                  y={y + 3}
                  textAnchor="start"
                  fill={isDarkMode ? '#64748b' : '#94a3b8'}
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {isLocalCurrency ? `$${priceVal.toFixed(1)}` : Math.round(priceVal).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Line Mode Area & Line */}
          {candleType === 'LINE' && (
            <>
              {areaPathD && <path d={areaPathD} fill="url(#naverLineGrad)" />}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </>
          )}

          {/* Candlestick Mode (일봉, 주봉, 월봉) */}
          {candleType !== 'LINE' &&
            candles.map((c, idx) => {
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
                <g key={idx} className="transition-opacity">
                  {/* Wick (고가 - 저가 심지) */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Body (시가 - 종가 몸통) */}
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

          {/* Highest Price Tag (최고가) */}
          {highestCandleIdx >= 0 && (
            <g>
              <line
                x1={highestX}
                y1={highestY}
                x2={highestX + 25}
                y2={highestY - 12}
                stroke="#ef4444"
                strokeWidth="1"
              />
              <rect
                x={highestX + 25}
                y={highestY - 20}
                width="64"
                height="15"
                rx="3"
                fill="#ef4444"
              />
              <text
                x={highestX + 57}
                y={highestY - 9}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
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
                x2={lowestX + 25}
                y2={lowestY + 12}
                stroke="#3b82f6"
                strokeWidth="1"
              />
              <rect
                x={lowestX + 25}
                y={lowestY + 6}
                width="64"
                height="15"
                rx="3"
                fill="#3b82f6"
              />
              <text
                x={lowestX + 57}
                y={lowestY + 17}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="monospace"
              >
                최저 {isLocalCurrency ? `$${lowPrice.toFixed(1)}` : Math.round(lowPrice).toLocaleString()}
              </text>
            </g>
          )}

          {/* Sub-Chart Divider & Volume Section */}
          <line
            x1={padLeft}
            y1={padTop + mainChartH + 10}
            x2={svgWidth - padRight}
            y2={padTop + mainChartH + 10}
            stroke={isDarkMode ? '#334155' : '#e2e8f0'}
            strokeWidth="1"
          />

          <text
            x={padLeft}
            y={padTop + mainChartH + 20}
            fill={isDarkMode ? '#64748b' : '#94a3b8'}
            fontSize="8.5"
            fontWeight="bold"
          >
            거래량 (Volume)
          </text>

          {/* Volume Bars */}
          {candles.map((c, idx) => {
            const x = getX(idx);
            const yVol = getVolY(c.volume);
            const vHeight = Math.max(1, padTop + mainChartH + 14 + volumeH - yVol);
            const color = c.isYangbong ? '#ef4444' : '#3b82f6';

            return (
              <rect
                key={`vol-${idx}`}
                x={x - barW / 2}
                y={yVol}
                width={barW}
                height={vHeight}
                fill={color}
                opacity={hoveredIndex === idx ? 1 : 0.65}
              />
            );
          })}

          {/* X-Axis Date Ticks */}
          {candles.map((c, idx) => {
            const step = Math.max(1, Math.floor(candleCount / 6));
            const shouldShow = idx % step === 0 || idx === candleCount - 1;
            if (!shouldShow) return null;

            return (
              <text
                key={`x-${idx}`}
                x={getX(idx)}
                y={svgHeight - 6}
                textAnchor="middle"
                fill={isDarkMode ? '#64748b' : '#94a3b8'}
                fontSize="9"
                fontFamily="monospace"
              >
                {c.label}
              </text>
            );
          })}

          {/* Crosshair Cursor & Highlight Guides */}
          {hoveredIndex !== null && hoveredCandle && hoveredX !== null && hoveredY !== null && (
            <g pointerEvents="none">
              {/* Vertical Dotted Line */}
              <line
                x1={hoveredX}
                y1={padTop}
                x2={hoveredX}
                y2={svgHeight - padBottom}
                stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Horizontal Dotted Line */}
              <line
                x1={padLeft}
                y1={hoveredY}
                x2={svgWidth - padRight}
                y2={hoveredY}
                stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Cursor Dot */}
              <circle cx={hoveredX} cy={hoveredY} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />

              {/* Right Axis Price Tag */}
              <rect
                x={svgWidth - padRight}
                y={hoveredY - 9}
                width={padRight}
                height="18"
                fill="#1e293b"
                rx="2"
              />
              <text
                x={svgWidth - padRight + 4}
                y={hoveredY + 4}
                fill="#ffffff"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {isLocalCurrency ? `$${hoveredCandle.close.toFixed(1)}` : Math.round(hoveredCandle.close).toLocaleString()}
              </text>

              {/* Bottom Date Tag */}
              <rect
                x={hoveredX - 25}
                y={svgHeight - 18}
                width="50"
                height="16"
                fill="#1e293b"
                rx="2"
              />
              <text
                x={hoveredX}
                y={svgHeight - 6}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontFamily="monospace"
              >
                {hoveredCandle.label}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* 4. Financial KPI & Historical Analytics Footer */}
      <div className={`p-3 border-t grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs ${isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/60'}`}>
        <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-slate-400 block text-[11px]">직전 1년 수익률</span>
          <span
            className={`font-bold font-mono text-sm mt-0.5 block ${
              stats.last1YrReturn !== null && stats.last1YrReturn >= 0
                ? 'text-red-600'
                : 'text-blue-600'
            }`}
          >
            {stats.last1YrReturn !== null ? `${stats.last1YrReturn >= 0 ? '+' : ''}${formatPercent(stats.last1YrReturn)}` : '자료 부족'}
          </span>
        </div>

        <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-slate-400 block text-[11px]">3년 연평균 (CAGR)</span>
          <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
            {stats.past3YrCAGR !== null ? formatPercent(stats.past3YrCAGR) : '3년 미충족'}
          </span>
        </div>

        <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-slate-400 block text-[11px]">과거 연간 변동성</span>
          <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
            {stats.historicalVolatility !== null ? formatPercent(stats.historicalVolatility) : '이력 부족'}
          </span>
        </div>

        <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-slate-400 block text-[11px]">최대 낙폭 (MDD)</span>
          <span className="font-bold font-mono text-rose-600 text-sm mt-0.5 block">
            {stats.historicalMDD !== null ? `-${formatPercent(stats.historicalMDD)}` : '이력 부족'}
          </span>
        </div>
      </div>
    </div>
  );
};
