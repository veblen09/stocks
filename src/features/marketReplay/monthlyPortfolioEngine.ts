import type {
  StockHolding,
  GameSettings,
  MonthlyReplayQuality,
  RiskLevel,
} from '../../types/stockGame';
import type { HistoricalNewsItem } from '../../types/stockNews';
import type { MonthlyPortfolioPoint, YearReplayData } from './marketReplayTypes';
import rawMonthlyPrices from '../../data/normalized/monthly_prices.json';
import { getStockPriceKRW, STOCKS_BY_ID } from '../../engine/returnEngine';
import { calculateRiskLevel } from '../../engine/metricsEngine';
import { getCrisisEventForYear } from '../../engine/crisisEngine';
import { HISTORICAL_NEWS } from '../../engine/newsEngine';

const MONTHLY_PRICES: Record<string, Record<string, { priceLocal: number; year: number; month: number; date: string }>> =
  rawMonthlyPrices as unknown as Record<string, Record<string, { priceLocal: number; year: number; month: number; date: string }>>;

/**
 * Assesses data quality for monthly replay in year Y
 */
export function getMonthlyReplayQuality(
  year: number,
  holdings: Record<string, StockHolding>
): MonthlyReplayQuality {
  const activeStockIds = Object.keys(holdings).filter(cid => holdings[cid].shares > 0);
  if (activeStockIds.length === 0) {
    const hasSp500 = Boolean(MONTHLY_PRICES['BENCH_SP500']?.[`${year}-01`]);
    return hasSp500 ? 'VERIFIED_MONTHLY' : 'ANNUAL_ONLY';
  }

  let withMonthly = 0;
  for (const cid of activeStockIds) {
    const ym = `${year}-06`;
    if (MONTHLY_PRICES[cid]?.[ym]) {
      withMonthly++;
    }
  }

  if (withMonthly === activeStockIds.length) {
    return 'VERIFIED_MONTHLY';
  } else if (withMonthly > 0) {
    return 'PARTIAL_MONTHLY';
  } else {
    return 'ANNUAL_ONLY';
  }
}

/**
 * Evaluates stock price in KRW for a specific month
 * If granular monthly data is available, uses it.
 * Otherwise, realistically interpolates between year-start price and year-end price
 * with market-aligned waves so all 45 years show smooth, thrilling live 12-month animations.
 */
export function getMonthlyStockPriceKRW(
  canonicalId: string,
  year: number,
  month: number
): number {
  const mStr = month.toString().padStart(2, '0');
  const ym = `${year}-${mStr}`;
  const monthlyData = MONTHLY_PRICES[canonicalId]?.[ym];

  if (monthlyData && monthlyData.priceLocal > 0) {
    const stock = STOCKS_BY_ID[canonicalId];
    if (stock && stock.market === 'US') {
      const fxData = MONTHLY_PRICES['FX_USDKRW']?.[ym];
      const fxRate = fxData && fxData.priceLocal > 0 ? fxData.priceLocal : 1150;
      return monthlyData.priceLocal * fxRate;
    }
    return monthlyData.priceLocal;
  }

  // Smooth realistic monthly trajectory from start-of-year price to end-of-year price
  const pStart = getStockPriceKRW(canonicalId, year - 1) || 1;
  const pEnd = getStockPriceKRW(canonicalId, year) || pStart;

  if (month === 12) {
    return pEnd;
  }

  // Linear progression fraction
  const t = month / 12;

  // Add realistic micro-market wave based on canonicalId & month seed
  const hash = (canonicalId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + month * 17) % 100;
  const wiggleFraction = Math.sin((month / 12) * Math.PI * 2 + hash) * 0.035; // +/- 3.5% seasonal fluctuation

  const interpolated = pStart + (pEnd - pStart) * t;
  const withWiggle = interpolated * (1 + wiggleFraction * (1 - t * 0.5));

  return Math.max(1, withWiggle);
}

/**
 * Evaluates primary benchmark monthly value
 */
function getBenchmarkMonthlyFactor(
  benchmarkId: string,
  year: number,
  month: number
): number {
  const mStr = month.toString().padStart(2, '0');
  const ym = `${year}-${mStr}`;

  const benchKey = benchmarkId === 'kospi' ? 'BENCH_KOSPI' : 'BENCH_SP500';
  const startYm = `${year - 1}-12`;

  const startData = MONTHLY_PRICES[benchKey]?.[startYm] || MONTHLY_PRICES[benchKey]?.[`${year}-01`];
  const curData = MONTHLY_PRICES[benchKey]?.[ym];

  if (startData && curData && startData.priceLocal > 0) {
    if (benchmarkId === 'sp500') {
      const fxStart = MONTHLY_PRICES['FX_USDKRW']?.[startYm]?.priceLocal || 1100;
      const fxCur = MONTHLY_PRICES['FX_USDKRW']?.[ym]?.priceLocal || 1100;
      const startKRW = startData.priceLocal * fxStart;
      const curKRW = curData.priceLocal * fxCur;
      return curKRW / startKRW;
    }
    return curData.priceLocal / startData.priceLocal;
  }

  // Smooth benchmark interpolation if monthly point is missing
  const annualRet = benchmarkId === 'blend5050' ? 0.08 : 0.07;
  const t = month / 12;
  const wave = Math.sin((month / 12) * Math.PI * 2) * 0.02;
  return 1.0 + (annualRet * t) + wave;
}

/**
 * Finds all newly available news released specifically in year Y, month M
 */
export function getNewlyAvailableNewsForMonth(
  year: number,
  month: number
): HistoricalNewsItem[] {
  const mStr = month.toString().padStart(2, '0');
  const targetYm = `${year}-${mStr}`;

  return HISTORICAL_NEWS.filter(news => {
    if (!news.availableFrom) return false;
    return news.availableFrom.startsWith(targetYm);
  });
}

/**
 * Generates verified 12-month portfolio trajectory for year Y
 */
export function generateYearReplayData(
  year: number,
  startCashKRW: number,
  holdings: Record<string, StockHolding>,
  startAssetsKRW: number,
  cumulativePrincipalKRW: number,
  runningPeakAssetsKRW: number,
  settings: GameSettings,
  historyYearsCount: number
): YearReplayData {
  const quality = getMonthlyReplayQuality(year, holdings);
  const crisisEvent = getCrisisEventForYear(year);

  // Month 0 (start of year reference)
  let prevMonthValue = startAssetsKRW;
  let runningPeak = Math.max(runningPeakAssetsKRW, startAssetsKRW);
  let monthsUnderwaterCount = 0;

  const points: MonthlyPortfolioPoint[] = [];
  let bestMonth = { month: 1, returnRate: -999 };
  let worstMonth = { month: 1, returnRate: 999 };
  let maxIntraYearDrawdown = 0;
  let maxUnderwater = 0;

  for (let m = 1; m <= 12; m++) {
    const mStr = m.toString().padStart(2, '0');
    const ym = `${year}-${mStr}`;
    const date = `${ym}-28`;

    let totalStockVal = 0;
    let krStockVal = 0;
    let usStockVal = 0;

    for (const cid in holdings) {
      const h = holdings[cid];
      if (h.shares <= 0) continue;

      const pKRW = getMonthlyStockPriceKRW(cid, year, m);
      const stockVal = h.shares * pKRW;
      totalStockVal += stockVal;

      if (cid.startsWith('KR_')) {
        krStockVal += stockVal;
      } else {
        usStockVal += stockVal;
      }
    }

    const curTotalAssets = startCashKRW + totalStockVal;
    const isNewHigh = curTotalAssets > runningPeak + 1000;
    if (curTotalAssets > runningPeak) {
      runningPeak = curTotalAssets;
    }

    const monthlyReturn = prevMonthValue > 0 ? (curTotalAssets - prevMonthValue) / prevMonthValue : 0;
    prevMonthValue = curTotalAssets;

    const ytdReturn = startAssetsKRW > 0 ? (curTotalAssets - startAssetsKRW) / startAssetsKRW : 0;
    const drawdown = runningPeak > 0 ? (curTotalAssets - runningPeak) / runningPeak : 0;
    const lossFromPeakKRW = Math.max(0, runningPeak - curTotalAssets);

    if (Math.abs(drawdown) > maxIntraYearDrawdown) {
      maxIntraYearDrawdown = Math.abs(drawdown);
    }

    if (drawdown < -0.005) {
      monthsUnderwaterCount++;
    } else {
      monthsUnderwaterCount = 0;
    }

    if (monthsUnderwaterCount > maxUnderwater) {
      maxUnderwater = monthsUnderwaterCount;
    }

    if (monthlyReturn > bestMonth.returnRate) {
      bestMonth = { month: m, returnRate: monthlyReturn };
    }
    if (monthlyReturn < worstMonth.returnRate) {
      worstMonth = { month: m, returnRate: monthlyReturn };
    }

    // Pure PnL
    const netInvested = cumulativePrincipalKRW;
    const investmentPnLKRW = curTotalAssets - netInvested;
    const investmentPnLPercent = netInvested > 0 ? investmentPnLKRW / netInvested : 0;

    // Weights
    const krWeight = curTotalAssets > 0 ? krStockVal / curTotalAssets : 0;
    const usWeight = curTotalAssets > 0 ? usStockVal / curTotalAssets : 0;
    const cashWeight = curTotalAssets > 0 ? startCashKRW / curTotalAssets : 1;

    // Benchmark
    const primaryBenchFactor = getBenchmarkMonthlyFactor(settings.primaryBenchmark || 'blend5050', year, m);
    const primaryBenchmarkValueKRW = startAssetsKRW * primaryBenchFactor;
    const primaryBenchmarkYtdReturn = primaryBenchFactor - 1.0;

    const kospiFactor = getBenchmarkMonthlyFactor('kospi', year, m);
    const sp500Factor = getBenchmarkMonthlyFactor('sp500', year, m);

    // News
    const newlyAvailableNews = getNewlyAvailableNewsForMonth(year, m);

    // Crisis
    const isCrisisMonth = Boolean(crisisEvent && crisisEvent.month === m);

    const riskLevel: RiskLevel = calculateRiskLevel(drawdown);

    points.push({
      year,
      month: m,
      date,
      monthLabelKo: `${m}월`,
      portfolioValueKRW: curTotalAssets,
      cashKRW: startCashKRW,
      holdingsValueKRW: totalStockVal,
      cumulativeContributionsKRW: netInvested,
      investmentPnLKRW,
      investmentPnLPercent,
      monthlyReturn,
      ytdReturn,
      runningPeakKRW: runningPeak,
      drawdown,
      lossFromPeakKRW,
      monthsUnderwater: monthsUnderwaterCount,
      isNewHigh,
      krWeight,
      usWeight,
      cashWeight,
      primaryBenchmarkValueKRW,
      primaryBenchmarkYtdReturn,
      kospiYtdReturn: kospiFactor - 1.0,
      sp500YtdReturn: sp500Factor - 1.0,
      riskLevel,
      newlyAvailableNews,
      isCrisisMonth,
      crisisEventId: isCrisisMonth ? crisisEvent?.id : undefined,
      crisisTitleKo: isCrisisMonth ? crisisEvent?.titleKo : undefined,
    });
  }

  return {
    year,
    quality,
    startTotalAssetsKRW: startAssetsKRW,
    annualContributionKRW: historyYearsCount === 0 ? 0 : settings.annualContributionKRW,
    cashBeforeReplayKRW: startCashKRW,
    holdings,
    points,
    bestMonth,
    worstMonth,
    maxIntraYearDrawdown,
    maxMonthsUnderwater: maxUnderwater,
  };
}

/**
 * Recalculates points from month (crisisMonth + 1) to 12 when a Crisis Decision modifies holdings/cash mid-year
 */
export function recalculateRemainingMonths(
  existingData: YearReplayData,
  crisisMonth: number,
  updatedCashKRW: number,
  updatedHoldings: Record<string, StockHolding>,
  settings: GameSettings
): YearReplayData {
  const points = [...existingData.points];
  let runningPeak = existingData.points[crisisMonth - 1]?.runningPeakKRW || existingData.startTotalAssetsKRW;
  let prevMonthVal = existingData.points[crisisMonth - 1]?.portfolioValueKRW || existingData.startTotalAssetsKRW;
  let monthsUnderwaterCount = existingData.points[crisisMonth - 1]?.monthsUnderwater || 0;

  for (let m = crisisMonth + 1; m <= 12; m++) {
    const idx = m - 1;

    let totalStockVal = 0;
    let krStockVal = 0;
    let usStockVal = 0;

    for (const cid in updatedHoldings) {
      const h = updatedHoldings[cid];
      if (h.shares <= 0) continue;

      const pKRW = getMonthlyStockPriceKRW(cid, existingData.year, m);
      const stockVal = h.shares * pKRW;
      totalStockVal += stockVal;

      if (cid.startsWith('KR_')) {
        krStockVal += stockVal;
      } else {
        usStockVal += stockVal;
      }
    }

    const curTotalAssets = updatedCashKRW + totalStockVal;
    const isNewHigh = curTotalAssets > runningPeak + 1000;
    if (curTotalAssets > runningPeak) {
      runningPeak = curTotalAssets;
    }

    const monthlyReturn = prevMonthVal > 0 ? (curTotalAssets - prevMonthVal) / prevMonthVal : 0;
    prevMonthVal = curTotalAssets;

    const ytdReturn = existingData.startTotalAssetsKRW > 0 ? (curTotalAssets - existingData.startTotalAssetsKRW) / existingData.startTotalAssetsKRW : 0;
    const drawdown = runningPeak > 0 ? (curTotalAssets - runningPeak) / runningPeak : 0;
    const lossFromPeakKRW = Math.max(0, runningPeak - curTotalAssets);

    if (drawdown < -0.005) {
      monthsUnderwaterCount++;
    } else {
      monthsUnderwaterCount = 0;
    }

    const netInvested = points[idx].cumulativeContributionsKRW;
    const investmentPnLKRW = curTotalAssets - netInvested;
    const investmentPnLPercent = netInvested > 0 ? investmentPnLKRW / netInvested : 0;

    const krWeight = curTotalAssets > 0 ? krStockVal / curTotalAssets : 0;
    const usWeight = curTotalAssets > 0 ? usStockVal / curTotalAssets : 0;
    const cashWeight = curTotalAssets > 0 ? updatedCashKRW / curTotalAssets : 1;

    const primaryBenchFactor = getBenchmarkMonthlyFactor(settings.primaryBenchmark || 'blend5050', existingData.year, m);
    const primaryBenchmarkValueKRW = existingData.startTotalAssetsKRW * primaryBenchFactor;

    points[idx] = {
      ...points[idx],
      portfolioValueKRW: curTotalAssets,
      cashKRW: updatedCashKRW,
      holdingsValueKRW: totalStockVal,
      investmentPnLKRW,
      investmentPnLPercent,
      monthlyReturn,
      ytdReturn,
      runningPeakKRW: runningPeak,
      drawdown,
      lossFromPeakKRW,
      monthsUnderwater: monthsUnderwaterCount,
      isNewHigh,
      krWeight,
      usWeight,
      cashWeight,
      primaryBenchmarkValueKRW,
      primaryBenchmarkYtdReturn: primaryBenchFactor - 1.0,
      riskLevel: calculateRiskLevel(drawdown),
    };
  }

  return {
    ...existingData,
    holdings: updatedHoldings,
    points,
  };
}
