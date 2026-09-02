import type {
  StockHolding,
  YearlyPerformanceRecord,
  GameSettings,
  HoldingsSnapshotItem,
  MarketEvent,
} from '../types/stockGame';
import { getStockPriceKRW, getStockAnnualReturn, STOCKS_BY_ID } from './returnEngine';
import { getBenchmarkAnnualReturn } from './benchmarkEngine';
import { getFxRate, getFxReturn } from './fxEngine';
import rawEvents from '../data/normalized/events.json';

const EVENTS_BY_YEAR: Record<string, MarketEvent> = rawEvents as unknown as Record<string, MarketEvent>;

export function getMarketBriefingForYear(year: number): MarketEvent {
  const yStr = year.toString();
  if (EVENTS_BY_YEAR[yStr]) {
    return EVENTS_BY_YEAR[yStr];
  }
  return {
    year,
    titleKo: `${year}년 한·미 금융시장 결산`,
    descriptionKo: `${year}년 국내외 경제 지표 및 기업 실적에 따른 연간 결산이 완료되었습니다.`,
  };
}

/**
 * Calculates current portfolio market value in KRW at given year
 */
export function calculatePortfolioValue(
  cashKRW: number,
  holdings: Record<string, StockHolding>,
  year: number
): number {
  let total = cashKRW;
  for (const cid in holdings) {
    const h = holdings[cid];
    if (h.shares > 0) {
      const p = getStockPriceKRW(cid, year) || 0;
      total += h.shares * p;
    }
  }
  return total;
}

/**
 * Advances simulation by exactly 1 year (from beginning of year Y to year-end Y)
 */
export function advanceSimulationOneYear(
  year: number,
  cashKRW: number,
  holdings: Record<string, StockHolding>,
  startAssetsKRW: number,
  annualDepositKRW: number,
  feesPaidDuringYear: number,
  historySoFar: YearlyPerformanceRecord[],
  settings: GameSettings
): {
  updatedCash: number;
  updatedHoldings: Record<string, StockHolding>;
  performanceRecord: YearlyPerformanceRecord;
  nextYear: number;
  isGameOver: boolean;
} {
  const updatedHoldings: Record<string, StockHolding> = {};
  let endHoldingsValue = 0;
  let totalFxPnl = 0;

  let bestPerformer: { canonicalId: string; nameKo: string; returnPercent: number } | null = null;
  let worstPerformer: { canonicalId: string; nameKo: string; returnPercent: number } | null = null;

  for (const cid in holdings) {
    const h = holdings[cid];
    if (h.shares <= 0) continue;

    const stock = STOCKS_BY_ID[cid];
    const pEndKRW = getStockPriceKRW(cid, year) || 1;
    const retVal = getStockAnnualReturn(cid, year, settings.includeFxEffect);
    const krwRet = retVal !== null ? retVal : 0;

    if (stock && stock.market === 'US' && settings.includeFxEffect) {
      const pStartKRW = getStockPriceKRW(cid, year - 1) || 1;
      const startVal = h.shares * pStartKRW;
      const fxRet = getFxReturn(year);
      totalFxPnl += startVal * fxRet;
    }

    const currentVal = h.shares * pEndKRW;
    endHoldingsValue += currentVal;

    const unPnl = currentVal - h.totalInvestedKRW;
    const unPnlPct = h.totalInvestedKRW > 0 ? unPnl / h.totalInvestedKRW : 0;

    updatedHoldings[cid] = {
      ...h,
      currentValueKRW: currentVal,
      unrealizedPnlKRW: unPnl,
      unrealizedPnlPercent: unPnlPct,
    };

    if (stock) {
      if (!bestPerformer || krwRet > bestPerformer.returnPercent) {
        bestPerformer = { canonicalId: cid, nameKo: stock.nameKo, returnPercent: krwRet };
      }
      if (!worstPerformer || krwRet < worstPerformer.returnPercent) {
        worstPerformer = { canonicalId: cid, nameKo: stock.nameKo, returnPercent: krwRet };
      }
    }
  }

  const endTotalAssets = cashKRW + endHoldingsValue;

  for (const cid in updatedHoldings) {
    const h = updatedHoldings[cid];
    h.currentWeight = endTotalAssets > 0 ? h.currentValueKRW / endTotalAssets : 0;
  }

  const effectiveStartAssets = startAssetsKRW;
  let subperiodReturn = 0;
  if (effectiveStartAssets > 0) {
    subperiodReturn = (endTotalAssets - effectiveStartAssets) / effectiveStartAssets;
  }

  const lastRecord = historySoFar.length > 0 ? historySoFar[historySoFar.length - 1] : null;
  const lastTwrIndex = lastRecord ? lastRecord.twrIndexLevel : 100.0;
  const currentTwrIndex = lastTwrIndex * (1 + subperiodReturn);

  const runningPeakTwr = Math.max(
    lastRecord?.runningPeakTwrIndex ?? 100.0,
    currentTwrIndex
  );
  const currentDrawdown = runningPeakTwr > 0 ? (currentTwrIndex - runningPeakTwr) / runningPeakTwr : 0;

  const kospiRet = getBenchmarkAnnualReturn('kospi', year);
  const sp500Ret = getBenchmarkAnnualReturn('sp500', year);
  const blendRet = getBenchmarkAnnualReturn('blend5050', year);

  const lastKospiTwr = lastRecord?.benchmarkTwrLevels?.kospiTwr ?? 100.0;
  const lastSp500Twr = lastRecord?.benchmarkTwrLevels?.sp500Twr ?? 100.0;
  const lastBlendTwr = lastRecord?.benchmarkTwrLevels?.blend5050Twr ?? 100.0;

  const currentKospiTwr = lastKospiTwr * (1 + kospiRet);
  const currentSp500Twr = lastSp500Twr * (1 + sp500Ret);
  const currentBlendTwr = lastBlendTwr * (1 + blendRet);

  const feeRate = settings.feeRate || 0.001;
  const isFirstYear = historySoFar.length === 0;
  const deposit = annualDepositKRW;
  const depositAfterFee = deposit * (1 - feeRate);

  const initialBaseVal = ((settings.initialCashKRW || 10000000) + (settings.annualContributionKRW || 0)) * (1 - feeRate);
  const lastKospiVal = lastRecord?.benchmarkLevels?.kospiValue ?? initialBaseVal;
  const lastSp500Val = lastRecord?.benchmarkLevels?.sp500Value ?? initialBaseVal;
  const lastBlendVal = lastRecord?.benchmarkLevels?.blend5050Value ?? initialBaseVal;

  const currentKospiVal = (lastKospiVal + (isFirstYear ? 0 : depositAfterFee)) * (1 + kospiRet);
  const currentSp500Val = (lastSp500Val + (isFirstYear ? 0 : depositAfterFee)) * (1 + sp500Ret);
  const currentBlendVal = (lastBlendVal + (isFirstYear ? 0 : depositAfterFee)) * (1 + blendRet);

  const briefing = getMarketBriefingForYear(year);
  const fxRate = getFxRate(year);

  const snapshot: HoldingsSnapshotItem[] = Object.values(updatedHoldings).map(h => {
    const s = STOCKS_BY_ID[h.canonicalId];
    return {
      canonicalId: h.canonicalId,
      nameKo: s ? s.nameKo : h.canonicalId,
      market: s ? s.market : 'KR',
      shares: h.shares,
      valueKRW: h.currentValueKRW,
      weight: h.currentWeight,
      annualReturn: getStockAnnualReturn(h.canonicalId, year, settings.includeFxEffect),
    };
  });

  const record: YearlyPerformanceRecord = {
    year,
    startTotalAssetsKRW: startAssetsKRW,
    annualDepositKRW,
    endTotalAssetsKRW: endTotalAssets,
    cashKRW,
    twrIndexLevel: currentTwrIndex,
    runningPeakTwrIndex: runningPeakTwr,
    currentDrawdown,
    benchmarkReturns: {
      kospi: kospiRet,
      sp500KRW: sp500Ret,
      blend5050: blendRet,
    },
    benchmarkLevels: {
      kospiValue: currentKospiVal,
      sp500Value: currentSp500Val,
      blend5050Value: currentBlendVal,
    },
    benchmarkTwrLevels: {
      kospiTwr: currentKospiTwr,
      sp500Twr: currentSp500Twr,
      blend5050Twr: currentBlendTwr,
    },
    annualReturn: subperiodReturn,
    fxRate,
    fxContributionPnlKRW: totalFxPnl,
    totalFeesPaidKRW: feesPaidDuringYear,
    bestPerformer,
    worstPerformer,
    marketBriefing: briefing,
    holdingsSnapshot: snapshot,
  };

  const isGameOver = year >= settings.endYear;
  const nextYear = isGameOver ? year : year + 1;

  return {
    updatedCash: cashKRW,
    updatedHoldings,
    performanceRecord: record,
    nextYear,
    isGameOver,
  };
}
