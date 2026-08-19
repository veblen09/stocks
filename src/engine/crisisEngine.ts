import type {
  HistoricalCrisisEvent,
  CrisisDecisionAction,
  CrisisDecisionRecord,
  StockGameState,
  StockHolding,
  TradeLogItem,
} from '../types/stockGame';
import rawCrisisEvents from '../data/normalized/crisis_events.json';
import { executeSell, executeRebalanceToTargetWeights } from './tradeEngine';
import { getStockPriceKRW } from './returnEngine';

export const HISTORICAL_CRISIS_EVENTS: HistoricalCrisisEvent[] = rawCrisisEvents as HistoricalCrisisEvent[];

export function getCrisisEventForYear(year: number): HistoricalCrisisEvent | undefined {
  return HISTORICAL_CRISIS_EVENTS.find(e => e.year === year);
}

export function getCrisisEventById(id: string): HistoricalCrisisEvent | undefined {
  return HISTORICAL_CRISIS_EVENTS.find(e => e.id === id);
}

export interface ExecuteCrisisResult {
  updatedCash: number;
  updatedHoldings: Record<string, StockHolding>;
  tradeLogs: TradeLogItem[];
  feePaidKRW: number;
  decisionRecord: CrisisDecisionRecord;
}

/**
 * Executes a Crisis Decision during an active historical market crisis
 */
export function executeCrisisDecision(
  crisisEvent: HistoricalCrisisEvent,
  action: CrisisDecisionAction,
  state: StockGameState,
  options?: {
    targetCashWeight?: number; // e.g. 0.3 (30%)
    customTargetWeights?: { canonicalId: string; weight: number }[];
    rationale?: string;
  }
): ExecuteCrisisResult {
  const { currentYear, cashKRW, holdings, settings, history } = state;
  const priceYear = currentYear - 1;

  // Calculate current portfolio value and weights before trade
  let currentHoldingsValue = 0;
  let krHoldingVal = 0;
  let usHoldingVal = 0;

  for (const cid in holdings) {
    const h = holdings[cid];
    const p = getStockPriceKRW(cid, priceYear) || 0;
    const val = h.shares * p;
    currentHoldingsValue += val;
    if (cid.startsWith('KR_')) krHoldingVal += val;
    else usHoldingVal += val;
  }

  const totalValueBefore = cashKRW + currentHoldingsValue;
  const allocationBefore = {
    krWeight: totalValueBefore > 0 ? krHoldingVal / totalValueBefore : 0,
    usWeight: totalValueBefore > 0 ? usHoldingVal / totalValueBefore : 0,
    cashWeight: totalValueBefore > 0 ? cashKRW / totalValueBefore : 1,
  };

  // Compute current drawdown at crisis point
  const lastHistory = history.length > 0 ? history[history.length - 1] : null;
  const peakTwr = history.reduce((max, h) => Math.max(max, h.twrIndexLevel), 100.0);
  const currentTwr = lastHistory ? lastHistory.twrIndexLevel : 100.0;
  const drawdownAtCrisis = peakTwr > 0 ? (currentTwr - peakTwr) / peakTwr : 0;

  let newCash = cashKRW;
  let newHoldings = { ...holdings };
  const tradeLogs: TradeLogItem[] = [];
  let feePaidKRW = 0;

  if (action === 'HOLD') {
    // No trades, 0 fees
  } else if (action === 'REBALANCE') {
    // Rebalance back to existing draftTargetWeights or equal active weights
    const draftWeights = state.draftTargetWeights || {};
    const targets = Object.entries(draftWeights).map(([canonicalId, weight]) => ({
      canonicalId,
      weight,
    }));

    if (targets.length > 0) {
      const res = executeRebalanceToTargetWeights(
        targets,
        cashKRW,
        holdings,
        currentYear,
        settings
      );
      newCash = res.updatedCash;
      newHoldings = res.updatedHoldings;
      tradeLogs.push(...res.tradeLogs);
      feePaidKRW = res.totalFees;
    }
  } else if (action === 'RAISE_CASH') {
    const desiredCashWeight = options?.targetCashWeight !== undefined ? options.targetCashWeight : 0.3; // Default 30% cash
    const targetCashKRW = totalValueBefore * desiredCashWeight;
    const neededAdditionalCash = targetCashKRW - cashKRW;

    if (neededAdditionalCash > 1000 && currentHoldingsValue > 0) {
      // Pro-rata sell across all current holdings
      const sellFraction = Math.min(0.999, neededAdditionalCash / currentHoldingsValue);

      for (const cid in holdings) {
        const h = holdings[cid];
        if (h.shares > 0) {
          const sharesToSell = h.shares * sellFraction;
          if (sharesToSell > 1e-6) {
            const res = executeSell(cid, sharesToSell, newCash, newHoldings, currentYear, settings);
            newCash = res.updatedCash;
            newHoldings = res.updatedHoldings;
            tradeLogs.push(...res.tradeLogs);
            feePaidKRW += res.totalFees;
          }
        }
      }
    }
  } else if (action === 'CUSTOM' && options?.customTargetWeights) {
    const res = executeRebalanceToTargetWeights(
      options.customTargetWeights,
      cashKRW,
      holdings,
      currentYear,
      settings
    );
    newCash = res.updatedCash;
    newHoldings = res.updatedHoldings;
    tradeLogs.push(...res.tradeLogs);
    feePaidKRW = res.totalFees;
  }

  // Calculate allocation after trade
  let postKrVal = 0;
  let postUsVal = 0;
  let postHoldingsVal = 0;

  for (const cid in newHoldings) {
    const h = newHoldings[cid];
    const p = getStockPriceKRW(cid, priceYear) || 0;
    const val = h.shares * p;
    postHoldingsVal += val;
    if (cid.startsWith('KR_')) postKrVal += val;
    else postUsVal += val;
  }

  const postTotalValue = newCash + postHoldingsVal;
  const allocationAfter = {
    krWeight: postTotalValue > 0 ? postKrVal / postTotalValue : 0,
    usWeight: postTotalValue > 0 ? postUsVal / postTotalValue : 0,
    cashWeight: postTotalValue > 0 ? newCash / postTotalValue : 1,
  };

  const decisionRecord: CrisisDecisionRecord = {
    crisisId: crisisEvent.id,
    year: crisisEvent.year,
    month: crisisEvent.month,
    titleKo: crisisEvent.titleKo,
    chosenAction: action,
    targetCashWeight: options?.targetCashWeight,
    portfolioValueAtCrisisKRW: totalValueBefore,
    drawdownAtCrisis,
    tradingFeePaidKRW: feePaidKRW,
    allocationBefore,
    allocationAfter,
    rationale: options?.rationale,
    timestamp: Date.now(),
  };

  return {
    updatedCash: newCash,
    updatedHoldings: newHoldings,
    tradeLogs,
    feePaidKRW,
    decisionRecord,
  };
}
