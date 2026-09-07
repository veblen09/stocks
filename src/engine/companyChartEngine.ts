import {
  STOCKS_BY_ID,
  getStockPriceLocal,
  getStockPriceKRW,
  getStockAnnualReturn,
  getHistoricalStockStats,
  type HistoricalStockStats,
} from './returnEngine';
import { getFxRate } from './fxEngine';
import rawMonthlyPrices from '../data/normalized/monthly_prices.json';
import rawBenchmarks from '../data/normalized/benchmarks.json';
import type { BenchmarksDataset } from '../types/stockGame';

const BENCHMARKS: BenchmarksDataset = rawBenchmarks as unknown as BenchmarksDataset;

export interface BenchmarkChartMeta {
  canonicalId: string;
  nameKo: string;
  nameEn: string;
  ticker: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
  firstValidYear: number;
  description: string;
}

export const BENCHMARK_CHARTS: Record<string, BenchmarkChartMeta> = {
  BENCH_KOSPI: {
    canonicalId: 'BENCH_KOSPI',
    nameKo: '한국 코스피 200 지수 (KOSPI 200)',
    nameEn: 'KOSPI 200 Index',
    ticker: 'KS200',
    market: 'KR',
    currency: 'KRW',
    firstValidYear: 1980,
    description: '대한민국 유가증권시장 시가총액 상위 200대 우량 대형주 지수',
  },
  kospi: {
    canonicalId: 'BENCH_KOSPI',
    nameKo: '한국 코스피 200 지수 (KOSPI 200)',
    nameEn: 'KOSPI 200 Index',
    ticker: 'KS200',
    market: 'KR',
    currency: 'KRW',
    firstValidYear: 1980,
    description: '대한민국 유가증권시장 시가총액 상위 200대 우량 대형주 지수',
  },
  BENCH_SP500: {
    canonicalId: 'BENCH_SP500',
    nameKo: '미국 S&P 500 지수 (S&P 500 Index)',
    nameEn: 'S&P 500 Index',
    ticker: 'SPX',
    market: 'US',
    currency: 'USD',
    firstValidYear: 1980,
    description: '미국 증시 시가총액 상위 500대 대표 우량 기업 지수',
  },
  sp500: {
    canonicalId: 'BENCH_SP500',
    nameKo: '미국 S&P 500 지수 (S&P 500 Index)',
    nameEn: 'S&P 500 Index',
    ticker: 'SPX',
    market: 'US',
    currency: 'USD',
    firstValidYear: 1980,
    description: '미국 증시 시가총액 상위 500대 대표 우량 기업 지수',
  },
};

const MONTHLY_PRICES: Record<string, Record<string, { priceLocal: number; year: number; month: number; date: string }>> =
  rawMonthlyPrices as unknown as Record<string, Record<string, { priceLocal: number; year: number; month: number; date: string }>>;

export interface CompanyPricePoint {
  year: number;
  month?: number;
  date: string;
  label: string;
  priceLocal: number;
  priceKRW: number;
  periodReturn?: number | null;
  drawdownFromPeak: number;
  isAllTimeHigh: boolean;
}

export interface CompanyHistoricalPriceSeries {
  canonicalId: string;
  stockNameKo: string;
  stockNameEn: string;
  ticker: string;
  currency: 'KRW' | 'USD';
  market: 'KR' | 'US';
  listingDate?: string;
  firstValidYear: number;
  upToYear: number;
  points: CompanyPricePoint[];
  allTimeHighKRW: number;
  allTimeHighLocal: number;
  allTimeLowKRW: number;
  allTimeLowLocal: number;
  currentPriceKRW: number;
  currentPriceLocal: number;
  stats: HistoricalStockStats;
}

export interface Sparkline1YrData {
  canonicalId: string;
  year: number;
  startPrice: number;
  endPrice: number;
  return1Yr: number;
  isPositive: boolean;
  minPrice: number;
  maxPrice: number;
  points: { x: number; y: number; price: number; month: number }[];
  svgPath: string;
  svgAreaPath: string;
}

export type NaverCandleType = 'DAY' | 'WEEK' | 'MONTH' | 'LINE';
export type NaverPeriodType = '1D' | '1M' | '3M' | '1Y' | '3Y' | '10Y' | 'ALL';

export interface NaverCandleItem {
  date: string;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  isYangbong: boolean;
  ma5?: number | null;
  ma20?: number | null;
  ma60?: number | null;
  ma120?: number | null;
  volumeMa5?: number | null;
  volumeMa20?: number | null;
}

export interface NaverChartData {
  canonicalId: string;
  stockNameKo: string;
  ticker: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
  currencyMode: 'KRW' | 'LOCAL';
  upToYear: number;
  candleType: NaverCandleType;
  period: NaverPeriodType;
  candles: NaverCandleItem[];
  currentPrice: number;
  prevClose: number;
  changeAmount: number;
  changePercent: number;
  periodStartPrice: number;
  periodChangeAmount: number;
  periodChangePercent: number;
  highPrice: number;
  lowPrice: number;
  high52w: number;
  low52w: number;
  allTimeHigh: number;
  allTimeLow: number;
  totalVolume: number;
  maxVolume: number;
  stats: HistoricalStockStats;
}

/**
 * Deterministic pseudo-random float in [0, 1)
 */
function pseudoRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Deterministic standard normal pseudo-random number
 */
function pseudoRandNorm(seed: number): number {
  const u1 = Math.max(1e-6, pseudoRand(seed));
  const u2 = pseudoRand(seed + 1000);
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Hash integer from string + numbers
 */
function hashSeed(str: string, num1 = 0, num2 = 0): number {
  let h = 2166136261 ^ num1 ^ (num2 << 5);
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return Math.abs(h % 100000);
}

export interface MonthPriceItem {
  year: number;
  month: number;
  price: number;
  date: string;
}

/**
 * Helper to detect if a monthly price sequence is synthetic linear interpolation or flat dummy constants
 */
export function isSyntheticLinearOrFlat(prices: number[]): boolean {
  if (prices.length < 3) return true;

  const maxP = Math.max(...prices);
  const minP = Math.min(...prices);
  const span = maxP - minP;

  // Case 1: Flat dummy constants across the year
  if (span < 0.001 * Math.max(1, maxP)) return true;

  // Case 2: Pure linear interpolation (P[m] = P0 + m * delta)
  const diffs: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    diffs.push(prices[i] - prices[i - 1]);
  }

  const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const diffVar = diffs.reduce((a, b) => a + Math.pow(b - meanDiff, 2), 0) / diffs.length;
  const relDiffStd = Math.sqrt(diffVar) / Math.max(1e-6, span);

  // If standard deviation of month-over-month step is near zero (< 0.015), it is a synthetic straight line
  if (relDiffStd < 0.02) return true;

  return false;
}

/**
 * Returns 12 realistic monthly prices for a given year.
 * If authentic raw monthly data is available (with real market variance), uses it.
 * If raw data is missing, flat, or synthetic linear filler, generates a natural, realistic
 * autoregressive price wave anchored to startPrice (year-end of y-1) and endPrice (year-end of y).
 */
export function getYearMonthlyPrices(
  canonicalId: string,
  year: number,
  useLocal = false
): MonthPriceItem[] {
  const benchMeta = BENCHMARK_CHARTS[canonicalId];
  const stock = benchMeta
    ? {
        canonicalId: benchMeta.canonicalId,
        nameKo: benchMeta.nameKo,
        nameEn: benchMeta.nameEn,
        ticker: benchMeta.ticker,
        market: benchMeta.market,
        currency: benchMeta.currency,
        firstValidYear: benchMeta.firstValidYear,
      }
    : STOCKS_BY_ID[canonicalId];

  if (!stock) return [];

  const dataKey = benchMeta ? benchMeta.canonicalId : canonicalId;
  const rawMonths: (MonthPriceItem | null)[] = [];
  let validCount = 0;

  for (let m = 1; m <= 12; m++) {
    const mStr = m.toString().padStart(2, '0');
    const ym = `${year}-${mStr}`;
    const mData = MONTHLY_PRICES[dataKey]?.[ym];

    if (mData && mData.priceLocal > 0) {
      let p = mData.priceLocal;
      if (!useLocal && stock.market === 'US') {
        const fxData = MONTHLY_PRICES['FX_USDKRW']?.[ym];
        const fxRate = fxData && fxData.priceLocal > 0 ? fxData.priceLocal : getFxRate(year);
        p = mData.priceLocal * fxRate;
      }
      rawMonths.push({
        year,
        month: m,
        price: p,
        date: mData.date || `${ym}-28`,
      });
      validCount++;
    } else {
      rawMonths.push(null);
    }
  }

  const validItems = rawMonths.filter((m): m is MonthPriceItem => m !== null && m.price > 0);
  const validPrices = validItems.map(m => m.price);
  const isSynthetic = isSyntheticLinearOrFlat(validPrices);

  // If complete, non-synthetic real market data exists, use it
  if (validCount >= 10 && !isSynthetic) {
    const filled: MonthPriceItem[] = [];
    let lastP = (useLocal ? getStockPriceLocal(canonicalId, year - 1) : getStockPriceKRW(canonicalId, year - 1)) || 100;
    for (let m = 1; m <= 12; m++) {
      const item = rawMonths[m - 1];
      if (item) {
        lastP = item.price;
        filled.push(item);
      } else {
        const mStr = m.toString().padStart(2, '0');
        filled.push({
          year,
          month: m,
          price: lastP,
          date: `${year}-${mStr}-28`,
        });
      }
    }
    return filled;
  }

  // Otherwise, construct a smooth momentum-driven monthly series with natural market swings
  let startP = 1000;
  let endP = 1000;

  if (benchMeta) {
    if (benchMeta.canonicalId === 'BENCH_KOSPI') {
      startP = BENCHMARKS.kospi?.prices?.[String(year - 1)] || BENCHMARKS.kospi?.prices?.[String(year)] || 100;
      endP = BENCHMARKS.kospi?.prices?.[String(year)] || startP;
    } else {
      const fxPrior = getFxRate(year - 1);
      const fxCur = getFxRate(year);
      const spPrior = BENCHMARKS.sp500?.prices?.[String(year - 1)] || 100;
      const spCur = BENCHMARKS.sp500?.prices?.[String(year)] || spPrior;
      startP = useLocal ? spPrior : spPrior * fxPrior;
      endP = useLocal ? spCur : spCur * fxCur;
    }
  } else {
    startP =
      (useLocal ? getStockPriceLocal(canonicalId, year - 1) : getStockPriceKRW(canonicalId, year - 1)) ||
      (useLocal ? getStockPriceLocal(canonicalId, year) : getStockPriceKRW(canonicalId, year)) ||
      1000;
    endP =
      (useLocal ? getStockPriceLocal(canonicalId, year) : getStockPriceKRW(canonicalId, year)) ||
      startP;
  }

  const result: MonthPriceItem[] = [];
  const seedBase = hashSeed(canonicalId, year, 101);
  let curRunningPrice = startP;
  let lastReturn = 0;

  for (let m = 1; m <= 12; m++) {
    const mStr = m.toString().padStart(2, '0');

    if (m === 12) {
      result.push({
        year,
        month: 12,
        price: endP,
        date: `${year}-12-28`,
      });
      continue;
    }

    const remainingMonths = 13 - m;
    const requiredDrift = (Math.log(Math.max(1, endP)) - Math.log(Math.max(1, curRunningPrice))) / remainingMonths;
    const monthlyVol = 0.052; // Realistic monthly macro volatility ~5.2%
    const shock = pseudoRandNorm(seedBase + m * 37) * monthlyVol;

    // Autoregressive momentum: smooth multi-month waves with trend continuity
    const stepReturn = 0.32 * lastReturn + 0.68 * shock + requiredDrift;
    lastReturn = stepReturn;

    curRunningPrice = Math.max(1, curRunningPrice * Math.exp(stepReturn));

    result.push({
      year,
      month: m,
      price: curRunningPrice,
      date: `${year}-${mStr}-28`,
    });
  }

  return result;
}

/**
 * Fast 1-year Sparkline calculation for Mosaic Tiles
 */
export function getCompany1YrSparkline(
  canonicalId: string,
  upToYear: number
): Sparkline1YrData | null {
  const stock = STOCKS_BY_ID[canonicalId];
  if (!stock || upToYear < stock.firstValidYear) return null;

  const monthlyList = getYearMonthlyPrices(canonicalId, upToYear, false);
  if (monthlyList.length === 0) return null;

  const startP =
    getStockPriceKRW(canonicalId, upToYear - 1) ||
    monthlyList[0].price ||
    1000;
  const endP =
    getStockPriceKRW(canonicalId, upToYear) ||
    monthlyList[monthlyList.length - 1].price;

  const rawPrices = [startP, ...monthlyList.map(pt => pt.price)];

  const width = 100;
  const height = 28;
  const padTop = 3;
  const padBottom = 3;
  const usableH = height - padTop - padBottom;

  const minP = Math.min(...rawPrices);
  const maxP = Math.max(...rawPrices);
  const pRange = maxP - minP || 1;

  const sampledPoints: { x: number; y: number; price: number; month: number }[] = [];
  rawPrices.forEach((p, idx) => {
    const x = (idx / (rawPrices.length - 1)) * width;
    const y = padTop + usableH - ((p - minP) / pRange) * usableH;
    sampledPoints.push({ x, y, price: p, month: idx });
  });

  // Smooth spline path for sparkline
  let svgPath = `M ${sampledPoints[0].x.toFixed(1)},${sampledPoints[0].y.toFixed(1)}`;
  for (let i = 0; i < sampledPoints.length - 1; i++) {
    const p0 = sampledPoints[i === 0 ? 0 : i - 1];
    const p1 = sampledPoints[i];
    const p2 = sampledPoints[i + 1];
    const p3 = sampledPoints[i + 2 >= sampledPoints.length ? sampledPoints.length - 1 : i + 2];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    svgPath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const svgAreaPath = `${svgPath} L ${width},${height} L 0,${height} Z`;
  const return1Yr = startP > 0 ? (endP - startP) / startP : 0;

  return {
    canonicalId,
    year: upToYear,
    startPrice: startP,
    endPrice: endP,
    return1Yr,
    isPositive: return1Yr >= 0,
    minPrice: minP,
    maxPrice: maxP,
    points: sampledPoints,
    svgPath,
    svgAreaPath,
  };
}

/**
 * Generate full Naver Finance-style OHLCV + MA series for any resolution & period
 */
export function getCompanyNaverChartData(
  canonicalId: string,
  upToYear: number,
  candleType: NaverCandleType = 'DAY',
  period: NaverPeriodType = '1Y',
  currencyMode: 'KRW' | 'LOCAL' = 'KRW'
): NaverChartData | null {
  const benchMeta = BENCHMARK_CHARTS[canonicalId];
  const stock = benchMeta
    ? {
        canonicalId: benchMeta.canonicalId,
        nameKo: benchMeta.nameKo,
        nameEn: benchMeta.nameEn,
        ticker: benchMeta.ticker,
        market: benchMeta.market,
        currency: benchMeta.currency,
        firstValidYear: benchMeta.firstValidYear,
      }
    : STOCKS_BY_ID[canonicalId];

  if (!stock || upToYear < stock.firstValidYear) return null;

  const isUsStock = stock.market === 'US';
  const useLocal = isUsStock && currencyMode === 'LOCAL';

  // Determine year range needed
  let startYear = Math.max(1980, stock.firstValidYear);
  if (period === '1D' || period === '1M' || period === '3M' || period === '1Y') {
    startYear = upToYear;
  } else if (period === '3Y') {
    startYear = Math.max(stock.firstValidYear, upToYear - 2);
  } else if (period === '10Y') {
    startYear = Math.max(stock.firstValidYear, upToYear - 9);
  } else if (period === 'ALL') {
    startYear = Math.max(1980, stock.firstValidYear);
  }

  // Fetch complete, smooth monthly dataset for all years in scope
  const allMonthlyList: MonthPriceItem[] = [];
  for (let y = Math.max(1980, stock.firstValidYear - 1); y <= upToYear; y++) {
    const yearMonths = getYearMonthlyPrices(canonicalId, y, useLocal);
    allMonthlyList.push(...yearMonths);
  }

  const baseVol = isUsStock ? 2800000 : 950000;
  const rawCandles: {
    date: string;
    label: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[] = [];

  if (period === '1D') {
    // Intraday 30-min simulation for the latest trading day (09:00 ~ 15:30)
    const times = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'
    ];
    const latestMonth = allMonthlyList[allMonthlyList.length - 1];
    const prevMonth = allMonthlyList[allMonthlyList.length - 2] || latestMonth;
    const dayClose = latestMonth.price;
    const prevClose = prevMonth.price;
    let curPrice = prevClose * (1 + (pseudoRand(upToYear * 17) - 0.48) * 0.008);
    let intradayDelta = 0;

    times.forEach((t, i) => {
      const stepSeed = hashSeed(canonicalId, upToYear, i * 7 + 10);
      const isTargetClose = i === times.length - 1;
      const open = curPrice;
      const remainingSteps = times.length - i;
      const stepDrift = (dayClose - open) / remainingSteps;
      const stepShock = pseudoRandNorm(stepSeed) * dayClose * 0.004;

      intradayDelta = 0.4 * intradayDelta + 0.6 * stepShock + stepDrift;
      const close = isTargetClose ? dayClose : Math.max(1, open + intradayDelta);
      const high = Math.max(open, close) * (1 + Math.abs(pseudoRandNorm(stepSeed + 1)) * 0.0035);
      const low = Math.min(open, close) * (1 - Math.abs(pseudoRandNorm(stepSeed + 2)) * 0.0035);

      const progress = (i + 1) / times.length;
      const uShape = Math.abs(progress - 0.5) * 2;
      const vol = Math.round(baseVol * 0.07 * (0.65 + uShape * 0.7 + pseudoRand(stepSeed + 3) * 0.4));

      curPrice = close;
      rawCandles.push({
        date: `${upToYear}-12-28 ${t}`,
        label: t,
        open,
        high,
        low,
        close,
        volume: vol,
      });
    });
  } else if (period === '1M' || period === '3M') {
    // High-resolution daily candles for 1M (20 days) or 3M (60 days)
    const numMonths = period === '1M' ? 1 : 3;
    const targetMonths = allMonthlyList.filter(m => m.year <= upToYear).slice(-numMonths);
    const tradingDaysPerMonth = 20;

    targetMonths.forEach(mItem => {
      const globalIdx = allMonthlyList.findIndex(m => m.year === mItem.year && m.month === mItem.month);
      const prevMPrice = globalIdx > 0 ? allMonthlyList[globalIdx - 1].price : mItem.price * 0.98;
      const monthClose = mItem.price;

      let currentDayPrice = prevMPrice;
      let dailyMomentum = 0;

      for (let d = 1; d <= tradingDaysPerMonth; d++) {
        const daySeed = hashSeed(canonicalId, mItem.year * 100 + mItem.month, d);
        const remainingDays = tradingDaysPerMonth - d + 1;
        const drift = (Math.log(Math.max(1, monthClose)) - Math.log(Math.max(1, currentDayPrice))) / remainingDays;
        const dailyShock = pseudoRandNorm(daySeed) * 0.011;

        dailyMomentum = 0.35 * dailyMomentum + 0.65 * dailyShock + drift;
        const open = currentDayPrice;
        const close = d === tradingDaysPerMonth ? monthClose : Math.max(1, open * Math.exp(dailyMomentum));
        const dayHigh = Math.max(open, close) * (1 + Math.abs(pseudoRandNorm(daySeed + 1)) * 0.007);
        const dayLow = Math.min(open, close) * (1 - Math.abs(pseudoRandNorm(daySeed + 2)) * 0.007);
        const vol = Math.round(baseVol * (0.7 + pseudoRand(daySeed + 3) * 0.75));

        currentDayPrice = close;
        const dayStr = Math.round(d * 1.45).toString().padStart(2, '0');

        rawCandles.push({
          date: `${mItem.year}-${mItem.month.toString().padStart(2, '0')}-${dayStr}`,
          label: `${mItem.month}/${dayStr}`,
          open,
          high: dayHigh,
          low: dayLow,
          close,
          volume: vol,
        });
      }
    });
  } else if (period === '1Y' || (candleType === 'DAY' && period !== '3Y' && period !== '10Y' && period !== 'ALL')) {
    // 1-Year High Resolution: 12 months x 20 trading days = 240 rich daily candles
    const targetMonths = allMonthlyList.filter(m => m.year === upToYear);
    const priorYearEnd =
      allMonthlyList.find(m => m.year === upToYear - 1 && m.month === 12)?.price ||
      (targetMonths[0] ? targetMonths[0].price * 0.95 : 1000);

    const tradingDaysPerMonth = 20;
    let runningPrice = priorYearEnd;
    let dailyMomentum = 0;

    targetMonths.forEach(mItem => {
      const monthClose = mItem.price;

      for (let d = 1; d <= tradingDaysPerMonth; d++) {
        const daySeed = hashSeed(canonicalId, upToYear * 100 + mItem.month, d);
        const remainingDays = tradingDaysPerMonth - d + 1;
        const drift = (Math.log(Math.max(1, monthClose)) - Math.log(Math.max(1, runningPrice))) / remainingDays;
        const dailyShock = pseudoRandNorm(daySeed) * 0.012;

        dailyMomentum = 0.38 * dailyMomentum + 0.62 * dailyShock + drift;
        const open = runningPrice;
        const close = d === tradingDaysPerMonth ? monthClose : Math.max(1, open * Math.exp(dailyMomentum));
        const dayHigh = Math.max(open, close) * (1 + Math.abs(pseudoRandNorm(daySeed + 1)) * 0.008);
        const dayLow = Math.min(open, close) * (1 - Math.abs(pseudoRandNorm(daySeed + 2)) * 0.008);
        const vol = Math.round(baseVol * (0.7 + pseudoRand(daySeed + 3) * 0.8));

        runningPrice = close;
        const dayStr = Math.round(d * 1.45).toString().padStart(2, '0');

        rawCandles.push({
          date: `${upToYear}-${mItem.month.toString().padStart(2, '0')}-${dayStr}`,
          label: `${upToYear.toString().slice(2)}.${mItem.month.toString().padStart(2, '0')}`,
          open,
          high: dayHigh,
          low: dayLow,
          close,
          volume: vol,
        });
      }
    });
  } else if (period === '3Y' || candleType === 'WEEK') {
    // 3-Year: 36 months x 4 weeks = 144 weekly candles
    const targetMonths = allMonthlyList.filter(m => m.year >= startYear && m.year <= upToYear);
    const weeksPerMonth = 4;
    let runningPrice = targetMonths[0]?.price || 1000;
    let weekMomentum = 0;

    targetMonths.forEach(mItem => {
      const monthClose = mItem.price;

      for (let w = 1; w <= weeksPerMonth; w++) {
        const weekSeed = hashSeed(canonicalId, mItem.year * 100 + mItem.month, w * 11);
        const remainingWeeks = weeksPerMonth - w + 1;
        const drift = (Math.log(Math.max(1, monthClose)) - Math.log(Math.max(1, runningPrice))) / remainingWeeks;
        const weekShock = pseudoRandNorm(weekSeed) * 0.022;

        weekMomentum = 0.35 * weekMomentum + 0.65 * weekShock + drift;
        const open = runningPrice;
        const close = w === weeksPerMonth ? monthClose : Math.max(1, open * Math.exp(weekMomentum));
        const high = Math.max(open, close) * (1 + Math.abs(pseudoRandNorm(weekSeed + 1)) * 0.012);
        const low = Math.min(open, close) * (1 - Math.abs(pseudoRandNorm(weekSeed + 2)) * 0.012);
        const vol = Math.round(baseVol * 4 * (0.75 + pseudoRand(weekSeed + 3) * 0.7));

        runningPrice = close;
        rawCandles.push({
          date: `${mItem.year}-${mItem.month.toString().padStart(2, '0')} W${w}`,
          label: `${mItem.year.toString().slice(2)}.${mItem.month}`,
          open,
          high,
          low,
          close,
          volume: vol,
        });
      }
    });
  } else {
    // 10Y or ALL: Monthly candles
    const targetMonths = allMonthlyList.filter(m => m.year >= startYear && m.year <= upToYear);
    targetMonths.forEach((mItem, mIdx) => {
      const prevPrice = mIdx > 0 ? targetMonths[mIdx - 1].price : mItem.price * 0.96;
      const mSeed = hashSeed(canonicalId, mItem.year, mItem.month);
      const open = prevPrice;
      const close = mItem.price;
      const high = Math.max(open, close) * (1 + Math.abs(pseudoRandNorm(mSeed + 1)) * 0.025);
      const low = Math.min(open, close) * (1 - Math.abs(pseudoRandNorm(mSeed + 2)) * 0.025);
      const vol = Math.round(baseVol * 18 * (0.75 + pseudoRand(mSeed + 3) * 0.7));

      rawCandles.push({
        date: mItem.date,
        label: `${mItem.year}.${mItem.month.toString().padStart(2, '0')}`,
        open,
        high,
        low,
        close,
        volume: vol,
      });
    });
  }

  // Calculate Moving Averages (5, 20, 60, 120) & Volume MA
  const fullCandles: NaverCandleItem[] = rawCandles.map((c, idx) => {
    const prevC = idx > 0 ? rawCandles[idx - 1].close : c.open;
    const change = c.close - prevC;
    const changePercent = prevC > 0 ? change / prevC : 0;
    const isYangbong = c.close >= c.open;

    const calcMA = (periodN: number) => {
      if (idx < periodN - 1) return null;
      let sum = 0;
      for (let k = idx - periodN + 1; k <= idx; k++) {
        sum += rawCandles[k].close;
      }
      return sum / periodN;
    };

    const calcVolMA = (periodN: number) => {
      if (idx < periodN - 1) return null;
      let sum = 0;
      for (let k = idx - periodN + 1; k <= idx; k++) {
        sum += rawCandles[k].volume;
      }
      return sum / periodN;
    };

    return {
      ...c,
      change,
      changePercent,
      isYangbong,
      ma5: calcMA(5),
      ma20: calcMA(20),
      ma60: calcMA(60),
      ma120: calcMA(120),
      volumeMa5: calcVolMA(5),
      volumeMa20: calcVolMA(20),
    };
  });

  if (fullCandles.length === 0) return null;

  const currentCandle = fullCandles[fullCandles.length - 1];
  const firstCandle = fullCandles[0];
  const prevClose = fullCandles.length > 1 ? fullCandles[fullCandles.length - 2].close : firstCandle.open;
  const currentPrice = currentCandle.close;
  const changeAmount = currentPrice - prevClose;
  const changePercent = prevClose > 0 ? changeAmount / prevClose : 0;

  const periodStartPrice = firstCandle ? firstCandle.open : currentPrice;
  const periodChangeAmount = currentPrice - periodStartPrice;
  const periodChangePercent = periodStartPrice > 0 ? periodChangeAmount / periodStartPrice : 0;

  const allHighs = fullCandles.map(c => c.high);
  const allLows = fullCandles.map(c => c.low);
  const allVols = fullCandles.map(c => c.volume);

  const highPrice = Math.max(...allHighs);
  const lowPrice = Math.min(...allLows);
  const maxVolume = Math.max(...allVols, 1000);
  const totalVolume = allVols.reduce((a, b) => a + b, 0);

  // 52-week High/Low (last 240 daily points or 12 monthly points)
  const last52wCandles = fullCandles.slice(-Math.min(fullCandles.length, 240));
  const high52w = Math.max(...last52wCandles.map(c => c.high));
  const low52w = Math.min(...last52wCandles.map(c => c.low));

  const stats = benchMeta
    ? {
        yearsOfData: upToYear - 1980 + 1,
        last1YrReturn: periodChangePercent,
        prior1YReturn: periodChangePercent,
        past3YrCAGR: 0.08,
        cagr3Y: 0.08,
        past5YrCAGR: 0.09,
        cagr5Y: 0.09,
        historicalVolatility: 0.18,
        volatility3Y: 0.18,
        historicalMDD: 0.35,
        mddHistorical: 0.35,
      }
    : getHistoricalStockStats(canonicalId, upToYear, true);

  return {
    canonicalId,
    stockNameKo: stock.nameKo,
    ticker: stock.ticker,
    market: stock.market,
    currency: stock.currency,
    currencyMode,
    upToYear,
    candleType,
    period,
    candles: fullCandles,
    currentPrice,
    prevClose,
    changeAmount,
    changePercent,
    periodStartPrice,
    periodChangeAmount,
    periodChangePercent,
    highPrice,
    lowPrice,
    high52w,
    low52w,
    allTimeHigh: Math.max(...allHighs),
    allTimeLow: Math.min(...allLows),
    totalVolume,
    maxVolume,
    stats,
  };
}

/**
 * Returns historical price trajectory for an individual company up to upToYear
 * (STRICT: Never leaks data past upToYear)
 */
export function getCompanyHistoricalPriceSeries(
  canonicalId: string,
  upToYear: number,
  resolution: 'ANNUAL' | 'MONTHLY' = 'ANNUAL'
): CompanyHistoricalPriceSeries | null {
  const benchMeta = BENCHMARK_CHARTS[canonicalId];
  const stock = benchMeta
    ? {
        canonicalId: benchMeta.canonicalId,
        nameKo: benchMeta.nameKo,
        nameEn: benchMeta.nameEn,
        ticker: benchMeta.ticker,
        market: benchMeta.market,
        currency: benchMeta.currency,
        firstValidYear: benchMeta.firstValidYear,
      }
    : STOCKS_BY_ID[canonicalId];

  if (!stock) return null;

  const startYear = Math.max(1980, stock.firstValidYear - 1);
  const points: CompanyPricePoint[] = [];

  let runningPeakLocal = 0;
  let runningPeakKRW = 0;
  let allTimeLowLocal = Infinity;
  let allTimeLowKRW = Infinity;

  if (resolution === 'MONTHLY') {
    for (let y = startYear; y <= upToYear; y++) {
      const yearMonths = getYearMonthlyPrices(canonicalId, y, false);
      const yearMonthsLocal = getYearMonthlyPrices(canonicalId, y, true);

      for (let m = 1; m <= 12; m++) {
        const mStr = m.toString().padStart(2, '0');
        const mKRW = yearMonths[m - 1];
        const mLocal = yearMonthsLocal[m - 1];

        const priceLocal = mLocal ? mLocal.price : 0;
        const priceKRW = mKRW ? mKRW.price : priceLocal;

        if (priceLocal > 0) {
          const isAth = priceLocal > runningPeakLocal;
          if (priceLocal > runningPeakLocal) runningPeakLocal = priceLocal;
          if (priceKRW > runningPeakKRW) runningPeakKRW = priceKRW;
          if (priceLocal < allTimeLowLocal) allTimeLowLocal = priceLocal;
          if (priceKRW < allTimeLowKRW) allTimeLowKRW = priceKRW;

          const drawdown = runningPeakLocal > 0 ? (priceLocal - runningPeakLocal) / runningPeakLocal : 0;

          points.push({
            year: y,
            month: m,
            date: `${y}-${mStr}-28`,
            label: `${y}.${mStr}`,
            priceLocal,
            priceKRW,
            drawdownFromPeak: drawdown,
            isAllTimeHigh: isAth,
          });
        }
      }
    }
  }

  if (points.length === 0) {
    for (let y = startYear; y <= upToYear; y++) {
      const pLocal = getStockPriceLocal(canonicalId, y);
      const pKRW = getStockPriceKRW(canonicalId, y);

      if (pLocal !== null && pLocal > 0) {
        const isAth = pLocal > runningPeakLocal;
        if (pLocal > runningPeakLocal) runningPeakLocal = pLocal;
        if (pKRW && pKRW > runningPeakKRW) runningPeakKRW = pKRW;
        if (pLocal < allTimeLowLocal) allTimeLowLocal = pLocal;
        if (pKRW && pKRW < allTimeLowKRW) allTimeLowKRW = pKRW;

        const drawdown = runningPeakLocal > 0 ? (pLocal - runningPeakLocal) / runningPeakLocal : 0;
        const annualRet = getStockAnnualReturn(canonicalId, y, true);

        points.push({
          year: y,
          month: 12,
          date: `${y}-12-31`,
          label: `${y}년`,
          priceLocal: pLocal,
          priceKRW: pKRW || pLocal,
          periodReturn: annualRet,
          drawdownFromPeak: drawdown,
          isAllTimeHigh: isAth,
        });
      }
    }
  }

  const currentPriceLocal = points.length > 0 ? points[points.length - 1].priceLocal : 0;
  const currentPriceKRW = points.length > 0 ? points[points.length - 1].priceKRW : 0;
  const stats = getHistoricalStockStats(canonicalId, upToYear, true);

  return {
    canonicalId,
    stockNameKo: stock.nameKo,
    stockNameEn: stock.nameEn,
    ticker: stock.ticker,
    currency: stock.currency,
    market: stock.market,
    listingDate: 'listingDate' in stock ? stock.listingDate : undefined,
    firstValidYear: stock.firstValidYear,
    upToYear,
    points,
    allTimeHighKRW: runningPeakKRW,
    allTimeHighLocal: runningPeakLocal,
    allTimeLowKRW: allTimeLowKRW === Infinity ? 0 : allTimeLowKRW,
    allTimeLowLocal: allTimeLowLocal === Infinity ? 0 : allTimeLowLocal,
    currentPriceKRW,
    currentPriceLocal,
    stats,
  };
}

/**
 * Returns real-time stock price trajectory for year Y from month 1 to currentMonth
 */
export function getCompanyMonthlyReplaySeries(
  canonicalId: string,
  year: number,
  currentMonth: number
): {
  canonicalId: string;
  stockNameKo: string;
  ticker: string;
  currency: 'KRW' | 'USD';
  market: 'KR' | 'US';
  startPriceKRW: number;
  startPriceLocal: number;
  currentPriceKRW: number;
  currentPriceLocal: number;
  ytdReturn: number;
  monthlyReturn: number;
  points: {
    month: number;
    monthLabel: string;
    priceLocal: number;
    priceKRW: number;
    monthlyReturn: number;
    ytdReturn: number;
  }[];
} | null {
  const stock = STOCKS_BY_ID[canonicalId];
  if (!stock) return null;

  const pStartLocal = getStockPriceLocal(canonicalId, year - 1) || 1;
  const pStartKRW = getStockPriceKRW(canonicalId, year - 1) || 1;

  const yearMonthsKRW = getYearMonthlyPrices(canonicalId, year, false);
  const yearMonthsLocal = getYearMonthlyPrices(canonicalId, year, true);

  const points: {
    month: number;
    monthLabel: string;
    priceLocal: number;
    priceKRW: number;
    monthlyReturn: number;
    ytdReturn: number;
  }[] = [
    {
      month: 0,
      monthLabel: '1/1',
      priceLocal: pStartLocal,
      priceKRW: pStartKRW,
      monthlyReturn: 0,
      ytdReturn: 0,
    },
  ];

  let prevPriceKRW = pStartKRW;

  for (let m = 1; m <= Math.min(12, currentMonth); m++) {
    const curPriceKRW = yearMonthsKRW[m - 1]?.price || prevPriceKRW;
    const curPriceLocal = yearMonthsLocal[m - 1]?.price || curPriceKRW;

    const monthlyRet = prevPriceKRW > 0 ? (curPriceKRW - prevPriceKRW) / prevPriceKRW : 0;
    const ytdRet = pStartKRW > 0 ? (curPriceKRW - pStartKRW) / pStartKRW : 0;

    prevPriceKRW = curPriceKRW;

    points.push({
      month: m,
      monthLabel: `${m}월`,
      priceLocal: curPriceLocal,
      priceKRW: curPriceKRW,
      monthlyReturn: monthlyRet,
      ytdReturn: ytdRet,
    });
  }

  const latestPoint = points[points.length - 1];

  return {
    canonicalId,
    stockNameKo: stock.nameKo,
    ticker: stock.ticker,
    currency: stock.currency,
    market: stock.market,
    startPriceKRW: pStartKRW,
    startPriceLocal: pStartLocal,
    currentPriceKRW: latestPoint ? latestPoint.priceKRW : pStartKRW,
    currentPriceLocal: latestPoint ? latestPoint.priceLocal : pStartLocal,
    ytdReturn: latestPoint ? latestPoint.ytdReturn : 0,
    monthlyReturn: latestPoint ? latestPoint.monthlyReturn : 0,
    points,
  };
}
