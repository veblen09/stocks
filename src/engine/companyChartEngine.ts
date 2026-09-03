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
  date: string; // e.g. "2007-03-15" or "09:30"
  label: string; // e.g. "03/15" or "2007.03"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  isYangbong: boolean; // Red (true) or Blue (false)
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
 * Fast 1-year Sparkline calculation for Mosaic Tiles
 */
export function getCompany1YrSparkline(
  canonicalId: string,
  upToYear: number
): Sparkline1YrData | null {
  const stock = STOCKS_BY_ID[canonicalId];
  if (!stock || upToYear < stock.firstValidYear) return null;

  const monthlyPoints: { month: number; price: number }[] = [];
  const startP = getStockPriceKRW(canonicalId, upToYear - 1);

  // Check 12 monthly prices for upToYear
  for (let m = 1; m <= 12; m++) {
    const mStr = m.toString().padStart(2, '0');
    const ym = `${upToYear}-${mStr}`;
    const mData = MONTHLY_PRICES[canonicalId]?.[ym];

    let p = 0;
    if (mData && mData.priceLocal > 0) {
      if (stock.market === 'US') {
        const fxData = MONTHLY_PRICES['FX_USDKRW']?.[ym];
        const fxRate = fxData && fxData.priceLocal > 0 ? fxData.priceLocal : getFxRate(upToYear);
        p = mData.priceLocal * fxRate;
      } else {
        p = mData.priceLocal;
      }
    } else if (m === 12) {
      p = getStockPriceKRW(canonicalId, upToYear) || 0;
    }
    if (p > 0) {
      monthlyPoints.push({ month: m, price: p });
    }
  }

  // Fallback if missing intra-year monthly data: interpolate from startPrice to endPrice
  const endP = getStockPriceKRW(canonicalId, upToYear) || startP || 1000;
  const baseStart = startP && startP > 0 ? startP : endP;

  if (monthlyPoints.length < 3) {
    monthlyPoints.length = 0;
    for (let m = 1; m <= 12; m++) {
      const progress = m / 12;
      // Slight pseudo-random walk connecting start to end
      const seed = ((canonicalId.charCodeAt(0) * 17 + m * 31 + upToYear * 7) % 100) / 100 - 0.5;
      const interP = baseStart + (endP - baseStart) * progress + baseStart * seed * 0.04;
      monthlyPoints.push({ month: m, price: Math.max(10, interP) });
    }
    monthlyPoints[11].price = endP;
  }

  const prices = monthlyPoints.map(pt => pt.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const pRange = maxP - minP || 1;

  const width = 100;
  const height = 30;
  const padTop = 3;
  const padBottom = 3;
  const usableH = height - padTop - padBottom;

  const coords = monthlyPoints.map((pt, idx) => {
    const x = (idx / (monthlyPoints.length - 1)) * width;
    const y = padTop + usableH - ((pt.price - minP) / pRange) * usableH;
    return { x, y, price: pt.price, month: pt.month };
  });

  const svgPath = coords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, '');

  const svgAreaPath = `${svgPath} L ${width},${height} L 0,${height} Z`;

  const return1Yr = baseStart > 0 ? (endP - baseStart) / baseStart : 0;

  return {
    canonicalId,
    year: upToYear,
    startPrice: baseStart,
    endPrice: endP,
    return1Yr,
    isPositive: return1Yr >= 0,
    minPrice: minP,
    maxPrice: maxP,
    points: coords,
    svgPath,
    svgAreaPath,
  };
}

/**
 * Deterministic pseudo-random number generator for candle wicks and daily bars
 */
function pseudoRand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
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
  const stock = STOCKS_BY_ID[canonicalId];
  if (!stock || upToYear < stock.firstValidYear) return null;

  const isUsStock = stock.market === 'US';
  const useLocal = isUsStock && currencyMode === 'LOCAL';

  // 1. Determine start year based on period
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

  // 2. Fetch raw monthly points
  const rawMonthlyList: { year: number; month: number; price: number; date: string }[] = [];
  for (let y = Math.max(1980, stock.firstValidYear - 1); y <= upToYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const mStr = m.toString().padStart(2, '0');
      const ym = `${y}-${mStr}`;
      const mData = MONTHLY_PRICES[canonicalId]?.[ym];

      let price = 0;
      if (mData && mData.priceLocal > 0) {
        if (useLocal) {
          price = mData.priceLocal;
        } else if (stock.market === 'US') {
          const fxData = MONTHLY_PRICES['FX_USDKRW']?.[ym];
          const fxRate = fxData && fxData.priceLocal > 0 ? fxData.priceLocal : getFxRate(y);
          price = mData.priceLocal * fxRate;
        } else {
          price = mData.priceLocal;
        }
      } else if (m === 12) {
        price = (useLocal ? getStockPriceLocal(canonicalId, y) : getStockPriceKRW(canonicalId, y)) || 0;
      }

      if (price > 0) {
        rawMonthlyList.push({
          year: y,
          month: m,
          price,
          date: mData?.date || `${ym}-28`,
        });
      }
    }
  }

  // Fallback if rawMonthlyList is too short: build from annual prices
  if (rawMonthlyList.length < 2) {
    for (let y = Math.max(1980, stock.firstValidYear - 1); y <= upToYear; y++) {
      const p = (useLocal ? getStockPriceLocal(canonicalId, y) : getStockPriceKRW(canonicalId, y)) || 0;
      if (p > 0) {
        for (let m = 1; m <= 12; m++) {
          const mStr = m.toString().padStart(2, '0');
          rawMonthlyList.push({
            year: y,
            month: m,
            price: p,
            date: `${y}-${mStr}-28`,
          });
        }
      }
    }
  }

  // 3. Build Candles depending on candleType & period
  const rawCandles: {
    date: string;
    label: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[] = [];

  const baseVol = isUsStock ? 2500000 : 850000;

  if (period === '1D') {
    // Intraday 30-min simulation for the latest trading day
    const times = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'
    ];
    const latestClose = rawMonthlyList[rawMonthlyList.length - 1]?.price || 50000;
    const prevDayClose = rawMonthlyList[rawMonthlyList.length - 2]?.price || latestClose * 0.99;
    let runningPrice = prevDayClose * (1 + (pseudoRand(upToYear * 13) - 0.5) * 0.015);

    times.forEach((t, i) => {
      const stepRand = pseudoRand(upToYear * 97 + i * 31);
      const isTargetClose = i === times.length - 1;
      const open = runningPrice;
      const targetStep = isTargetClose ? latestClose : open + (latestClose - open) * (0.3 + stepRand * 0.4);
      const close = isTargetClose ? latestClose : targetStep;
      const high = Math.max(open, close) * (1 + stepRand * 0.008);
      const low = Math.min(open, close) * (1 - (1 - stepRand) * 0.008);
      const vol = Math.round(baseVol * 0.08 * (0.5 + stepRand * 1.2));
      runningPrice = close;

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
  } else if (candleType === 'DAY' || period === '1M' || period === '3M') {
    // Daily candle simulation for the selected period
    // Filter months in range
    let targetMonths = rawMonthlyList.filter(m => m.year >= startYear);
    if (period === '1M') targetMonths = targetMonths.slice(-1);
    if (period === '3M') targetMonths = targetMonths.slice(-3);
    targetMonths.forEach((mItem, mIdx) => {

      const prevMonthPrice = mIdx > 0 ? targetMonths[mIdx - 1].price : mItem.price;
      const monthClose = mItem.price;
      const tradingDays = 20;

      let currentDayPrice = prevMonthPrice;
      for (let d = 1; d <= tradingDays; d++) {
        const daySeed = mItem.year * 1000 + mItem.month * 50 + d;
        const progress = d / tradingDays;
        const targetInter = prevMonthPrice + (monthClose - prevMonthPrice) * progress;
        const noise = (pseudoRand(daySeed) - 0.49) * 0.025;

        const open = currentDayPrice;
        const close = d === tradingDays ? monthClose : targetInter * (1 + noise);
        const dayHigh = Math.max(open, close) * (1 + pseudoRand(daySeed + 1) * 0.018);
        const dayLow = Math.min(open, close) * (1 - pseudoRand(daySeed + 2) * 0.018);
        const vol = Math.round(baseVol * (0.6 + pseudoRand(daySeed + 3) * 0.9));

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
  } else if (candleType === 'WEEK') {
    // Weekly candles (~4 weeks per month)
    const targetMonths = rawMonthlyList.filter(m => m.year >= startYear);
    targetMonths.forEach((mItem, mIdx) => {
      const prevMonthPrice = mIdx > 0 ? targetMonths[mIdx - 1].price : mItem.price;
      const monthClose = mItem.price;
      const weeks = 4;

      let curWeekPrice = prevMonthPrice;
      for (let w = 1; w <= weeks; w++) {
        const weekSeed = mItem.year * 500 + mItem.month * 30 + w;
        const progress = w / weeks;
        const targetInter = prevMonthPrice + (monthClose - prevMonthPrice) * progress;
        const noise = (pseudoRand(weekSeed) - 0.48) * 0.035;

        const open = curWeekPrice;
        const close = w === weeks ? monthClose : targetInter * (1 + noise);
        const high = Math.max(open, close) * (1 + pseudoRand(weekSeed + 1) * 0.025);
        const low = Math.min(open, close) * (1 - pseudoRand(weekSeed + 2) * 0.025);
        const vol = Math.round(baseVol * 4 * (0.7 + pseudoRand(weekSeed + 3) * 0.8));

        curWeekPrice = close;
        rawCandles.push({
          date: `${mItem.year}-${mItem.month.toString().padStart(2, '0')} W${w}`,
          label: `${mItem.year.toString().slice(2)}.${mItem.month} W${w}`,
          open,
          high,
          low,
          close,
          volume: vol,
        });
      }
    });
  } else {
    // MONTHLY or LINE
    const targetMonths = rawMonthlyList.filter(m => m.year >= startYear);
    targetMonths.forEach((mItem, mIdx) => {
      const prevPrice = mIdx > 0 ? targetMonths[mIdx - 1].price : mItem.price * 0.97;
      const open = prevPrice;
      const close = mItem.price;
      const mSeed = mItem.year * 100 + mItem.month;
      const high = Math.max(open, close) * (1 + pseudoRand(mSeed + 1) * 0.04);
      const low = Math.min(open, close) * (1 - pseudoRand(mSeed + 2) * 0.04);
      const vol = Math.round(baseVol * 20 * (0.7 + pseudoRand(mSeed + 3) * 0.8));

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

  // 4. Calculate Moving Averages (5, 20, 60, 120) & Volume MA
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

  // If filtered period requested fewer candles, slice appropriately
  let finalCandles = fullCandles;
  if (period === '1Y' && candleType === 'DAY' && finalCandles.length > 250) {
    finalCandles = finalCandles.slice(-240);
  }

  if (finalCandles.length === 0) return null;

  const currentCandle = finalCandles[finalCandles.length - 1];
  const firstCandle = finalCandles[0];
  const prevClose = finalCandles.length > 1 ? finalCandles[finalCandles.length - 2].close : firstCandle.open;
  const currentPrice = currentCandle.close;
  const changeAmount = currentPrice - prevClose;
  const changePercent = prevClose > 0 ? changeAmount / prevClose : 0;

  const periodStartPrice = firstCandle ? firstCandle.open : currentPrice;
  const periodChangeAmount = currentPrice - periodStartPrice;
  const periodChangePercent = periodStartPrice > 0 ? periodChangeAmount / periodStartPrice : 0;

  const allHighs = finalCandles.map(c => c.high);
  const allLows = finalCandles.map(c => c.low);
  const allVols = finalCandles.map(c => c.volume);

  const highPrice = Math.max(...allHighs);
  const lowPrice = Math.min(...allLows);
  const maxVolume = Math.max(...allVols, 1000);
  const totalVolume = allVols.reduce((a, b) => a + b, 0);

  // 52-week High/Low (last 240 days or 12 months)
  const last52wCandles = finalCandles.slice(-Math.min(finalCandles.length, 240));
  const high52w = Math.max(...last52wCandles.map(c => c.high));
  const low52w = Math.min(...last52wCandles.map(c => c.low));

  const stats = getHistoricalStockStats(canonicalId, upToYear, true);

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
    candles: finalCandles,
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
  const stock = STOCKS_BY_ID[canonicalId];
  if (!stock) return null;

  const startYear = Math.max(1980, stock.firstValidYear - 1);
  const points: CompanyPricePoint[] = [];

  let runningPeakLocal = 0;
  let runningPeakKRW = 0;
  let allTimeLowLocal = Infinity;
  let allTimeLowKRW = Infinity;

  if (resolution === 'MONTHLY') {
    for (let y = startYear; y <= upToYear; y++) {
      for (let m = 1; m <= 12; m++) {
        const mStr = m.toString().padStart(2, '0');
        const ym = `${y}-${mStr}`;
        const monthlyData = MONTHLY_PRICES[canonicalId]?.[ym];

        let priceLocal = 0;
        let priceKRW = 0;

        if (monthlyData && monthlyData.priceLocal > 0) {
          priceLocal = monthlyData.priceLocal;
          if (stock.market === 'US') {
            const fxData = MONTHLY_PRICES['FX_USDKRW']?.[ym];
            const fxRate = fxData && fxData.priceLocal > 0 ? fxData.priceLocal : getFxRate(y);
            priceKRW = priceLocal * fxRate;
          } else {
            priceKRW = priceLocal;
          }
        } else if (m === 12) {
          const pLocal = getStockPriceLocal(canonicalId, y);
          const pKRW = getStockPriceKRW(canonicalId, y);
          if (pLocal && pLocal > 0) {
            priceLocal = pLocal;
            priceKRW = pKRW || pLocal;
          }
        }

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
            date: monthlyData?.date || `${ym}-28`,
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
    listingDate: stock.listingDate,
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

  let prevPriceLocal = pStartLocal;
  let prevPriceKRW = pStartKRW;

  for (let m = 1; m <= Math.min(12, currentMonth); m++) {
    const mStr = m.toString().padStart(2, '0');
    const ym = `${year}-${mStr}`;
    const monthlyData = MONTHLY_PRICES[canonicalId]?.[ym];

    let curPriceLocal = prevPriceLocal;
    let curPriceKRW = prevPriceKRW;

    if (monthlyData && monthlyData.priceLocal > 0) {
      curPriceLocal = monthlyData.priceLocal;
      if (stock.market === 'US') {
        const fxData = MONTHLY_PRICES['FX_USDKRW']?.[ym];
        const fxRate = fxData && fxData.priceLocal > 0 ? fxData.priceLocal : getFxRate(year);
        curPriceKRW = curPriceLocal * fxRate;
      } else {
        curPriceKRW = curPriceLocal;
      }
    } else if (m === 12) {
      curPriceLocal = getStockPriceLocal(canonicalId, year) || prevPriceLocal;
      curPriceKRW = getStockPriceKRW(canonicalId, year) || prevPriceKRW;
    }

    const monthlyRet = prevPriceKRW > 0 ? (curPriceKRW - prevPriceKRW) / prevPriceKRW : 0;
    const ytdRet = pStartKRW > 0 ? (curPriceKRW - pStartKRW) / pStartKRW : 0;

    prevPriceLocal = curPriceLocal;
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
