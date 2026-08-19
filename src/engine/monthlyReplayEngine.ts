import type {
  StockHolding,
  MonthlyReplayQuality,
  RiskLevel,
} from '../types/stockGame';
import rawMonthlyPrices from '../data/normalized/monthly_prices.json';
import { getStockPriceKRW, STOCKS_BY_ID } from './returnEngine';
import { calculateRiskLevel } from './metricsEngine';

const MONTHLY_PRICES: Record<string, Record<string, { priceLocal: number; year: number; month: number; date: string }>> =
  rawMonthlyPrices as unknown as Record<string, Record<string, { priceLocal: number; year: number; month: number; date: string }>>;

export interface MonthlySnapshot {
  year: number;
  month: number;
  ymString: string;
  portfolioValueKRW: number;
  ytdReturn: number;
  drawdownFromPeak: number;
  riskLevel: RiskLevel;
  isCrisisMonth?: boolean;
}

/**
 * Assesses data quality for monthly replay in a given simulation year
 */
export function getMonthlyReplayQuality(
  year: number,
  holdings: Record<string, StockHolding>
): MonthlyReplayQuality {
  const activeStockIds = Object.keys(holdings).filter(cid => holdings[cid].shares > 0);
  if (activeStockIds.length === 0) {
    // If holding only cash, check if benchmarks have monthly data
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
 * Generates verified 12-month trajectory for year Y
 */
export function generateMonthlyTrajectory(
  year: number,
  cashKRW: number,
  holdings: Record<string, StockHolding>,
  startAssetsKRW: number,
  runningPeakAssetsKRW: number,
  crisisMonth?: number
): {
  quality: MonthlyReplayQuality;
  snapshots: MonthlySnapshot[];
} {
  const quality = getMonthlyReplayQuality(year, holdings);
  const snapshots: MonthlySnapshot[] = [];

  if (quality === 'ANNUAL_ONLY') {
    // No fake data interpolation - return empty snapshots, step directly to year-end
    return {
      quality: 'ANNUAL_ONLY',
      snapshots: [],
    };
  }

  let peakAssets = Math.max(runningPeakAssetsKRW, startAssetsKRW);

  for (let m = 1; m <= 12; m++) {
    const mStr = m.toString().padStart(2, '0');
    const ym = `${year}-${mStr}`;

    let monthHoldingsVal = 0;

    for (const cid in holdings) {
      const h = holdings[cid];
      if (h.shares <= 0) continue;

      const monthlyData = MONTHLY_PRICES[cid]?.[ym];
      let pKRW = 0;

      if (monthlyData && monthlyData.priceLocal > 0) {
        const stock = STOCKS_BY_ID[cid];
        if (stock && stock.market === 'US') {
          const fxData = MONTHLY_PRICES['FX_USDKRW']?.[ym];
          const fxRate = fxData ? fxData.priceLocal : 1100;
          pKRW = monthlyData.priceLocal * fxRate;
        } else {
          pKRW = monthlyData.priceLocal;
        }
      } else {
        // Fallback to start-of-year price if specific month is missing
        pKRW = getStockPriceKRW(cid, year - 1) || 1;
      }

      monthHoldingsVal += h.shares * pKRW;
    }

    const currentMonthTotalAssets = cashKRW + monthHoldingsVal;
    if (currentMonthTotalAssets > peakAssets) {
      peakAssets = currentMonthTotalAssets;
    }

    const ytdReturn = startAssetsKRW > 0 ? (currentMonthTotalAssets - startAssetsKRW) / startAssetsKRW : 0;
    const drawdownFromPeak = peakAssets > 0 ? (currentMonthTotalAssets - peakAssets) / peakAssets : 0;
    const riskLevel = calculateRiskLevel(drawdownFromPeak);

    snapshots.push({
      year,
      month: m,
      ymString: `${year}년 ${m}월`,
      portfolioValueKRW: currentMonthTotalAssets,
      ytdReturn,
      drawdownFromPeak,
      riskLevel,
      isCrisisMonth: m === crisisMonth,
    });
  }

  return {
    quality,
    snapshots,
  };
}
