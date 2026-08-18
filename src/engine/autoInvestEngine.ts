import type {
  AutoInvestRule,
  GameSettings,
  StockHolding,
  TradeLogItem,
  YearlyPerformanceRecord,
} from '../types/stockGame';
import { executeBuy, executeRebalanceToTargetWeights } from './tradeEngine';
import { advanceSimulationOneYear, calculatePortfolioValue } from './portfolioEngine';
import { STOCKS, isStockListed, getHistoricalStockStats } from './returnEngine';

export interface AutoInvestStepState {
  currentYear: number;
  cashKRW: number;
  holdings: Record<string, StockHolding>;
  history: YearlyPerformanceRecord[];
  tradeLogs: TradeLogItem[];
  isGameOver: boolean;
}

/**
 * Resolves target allocations for a given year based on rule and filters
 */
export function resolveTargetAllocationsForYear(
  rule: AutoInvestRule,
  year: number,
  settings: GameSettings
): { canonicalId: string; weight: number }[] {
  const priorYear = year - 1;

  if (rule.advancedFilter && rule.advancedFilter !== 'NONE') {
    let eligible = STOCKS.filter(s => isStockListed(s.canonicalId, year));

    if (rule.advancedFilter === 'KR_ONLY') {
      eligible = eligible.filter(s => s.market === 'KR');
    } else if (rule.advancedFilter === 'US_ONLY') {
      eligible = eligible.filter(s => s.market === 'US');
    } else if (rule.advancedFilter === 'TOP_1YR_MOMENTUM') {
      eligible = eligible
        .map(s => ({
          stock: s,
          ret: getHistoricalStockStats(s.canonicalId, priorYear, settings.includeFxEffect).last1YrReturn || -999,
        }))
        .sort((a, b) => b.ret - a.ret)
        .slice(0, 5)
        .map(item => item.stock);
    } else if (rule.advancedFilter === 'TOP_3YR_CAGR') {
      eligible = eligible
        .map(s => ({
          stock: s,
          cagr: getHistoricalStockStats(s.canonicalId, priorYear, settings.includeFxEffect).past3YrCAGR || -999,
        }))
        .sort((a, b) => b.cagr - a.cagr)
        .slice(0, 5)
        .map(item => item.stock);
    } else if (rule.advancedFilter === 'LOW_VOLATILITY') {
      eligible = eligible
        .map(s => ({
          stock: s,
          vol: getHistoricalStockStats(s.canonicalId, priorYear, settings.includeFxEffect).historicalVolatility || 999,
        }))
        .sort((a, b) => a.vol - b.vol)
        .slice(0, 5)
        .map(item => item.stock);
    }

    if (eligible.length === 0) return [];
    const eqWeight = Math.floor((1.0 / eligible.length) * 1000) / 1000;
    return eligible.map(s => ({ canonicalId: s.canonicalId, weight: eqWeight }));
  }

  // Handle standard target allocations
  const activeAllocations: { canonicalId: string; weight: number }[] = [];
  let unallocatedWeight = 0;

  for (const item of rule.targetAllocations) {
    if (isStockListed(item.canonicalId, year)) {
      activeAllocations.push({ ...item });
    } else {
      unallocatedWeight += item.weight;
    }
  }

  if (rule.preIpoMode === 'PRO_RATA_ACTIVE' && activeAllocations.length > 0 && unallocatedWeight > 0) {
    const totalActiveWeight = activeAllocations.reduce((sum, item) => sum + item.weight, 0);
    if (totalActiveWeight > 0) {
      activeAllocations.forEach(item => {
        item.weight += (item.weight / totalActiveWeight) * unallocatedWeight;
      });
    }
  }

  return activeAllocations;
}

/**
 * Checks if threshold rebalance is needed (> 5% drift from target)
 */
function isRebalanceThresholdExceeded(
  holdings: Record<string, StockHolding>,
  targetAllocations: { canonicalId: string; weight: number }[],
  totalPortfolioValue: number
): boolean {
  if (totalPortfolioValue <= 0) return false;
  const targetMap: Record<string, number> = {};
  targetAllocations.forEach(a => {
    targetMap[a.canonicalId] = a.weight;
  });

  for (const cid in holdings) {
    const h = holdings[cid];
    const targetW = targetMap[cid] || 0;
    const currentW = h.currentValueKRW / totalPortfolioValue;
    if (Math.abs(currentW - targetW) >= 0.05) {
      return true;
    }
  }

  for (const a of targetAllocations) {
    const currentW = (holdings[a.canonicalId]?.currentValueKRW || 0) / totalPortfolioValue;
    if (Math.abs(currentW - a.weight) >= 0.05) {
      return true;
    }
  }

  return false;
}

/**
 * Executes a single year of automated investment
 */
export function executeAutoInvestSingleYear(
  state: AutoInvestStepState,
  rule: AutoInvestRule,
  settings: GameSettings
): AutoInvestStepState {
  if (state.isGameOver || state.currentYear > settings.endYear) {
    return state;
  }

  const year = state.currentYear;
  const isFirstSimYear = year === settings.startYear + 1;
  const deposit = isFirstSimYear ? 0 : settings.annualContributionKRW;
  let cash = state.cashKRW + deposit;
  let holdings = { ...state.holdings };
  const logs: TradeLogItem[] = [];
  let feesPaidThisYear = 0;

  const targetAllocations = resolveTargetAllocationsForYear(rule, year, settings);

  if (rule.rebalanceMode === 'ANNUAL' || (isFirstSimYear && Object.keys(holdings).length === 0)) {
    if (targetAllocations.length > 0) {
      const rebalanceRes = executeRebalanceToTargetWeights(
        targetAllocations,
        cash,
        holdings,
        year,
        settings
      );
      cash = rebalanceRes.updatedCash;
      holdings = rebalanceRes.updatedHoldings;
      logs.push(...rebalanceRes.tradeLogs);
      feesPaidThisYear += rebalanceRes.totalFees;
    }
  } else if (rule.rebalanceMode === 'THRESHOLD_5PCT') {
    const priorYear = year - 1;
    const totalVal = calculatePortfolioValue(cash, holdings, priorYear);
    if (isRebalanceThresholdExceeded(holdings, targetAllocations, totalVal)) {
      const rebalanceRes = executeRebalanceToTargetWeights(
        targetAllocations,
        cash,
        holdings,
        year,
        settings
      );
      cash = rebalanceRes.updatedCash;
      holdings = rebalanceRes.updatedHoldings;
      logs.push(...rebalanceRes.tradeLogs);
      feesPaidThisYear += rebalanceRes.totalFees;
    }
  } else if (rule.rebalanceMode === 'BUY_ONLY' && deposit > 0) {
    for (const item of targetAllocations) {
      const allocDeposit = deposit * item.weight;
      const maxAffordable = (allocDeposit * 0.9999999) / (1 + settings.feeRate);
      if (maxAffordable > 100 && cash >= maxAffordable) {
        const buyRes = executeBuy(item.canonicalId, maxAffordable, cash, holdings, year, settings);
        cash = buyRes.updatedCash;
        holdings = buyRes.updatedHoldings;
        logs.push(...buyRes.tradeLogs);
        feesPaidThisYear += buyRes.totalFees;
      }
    }
  }

  const startAssets = calculatePortfolioValue(cash, holdings, year - 1);

  const stepRes = advanceSimulationOneYear(
    year,
    cash,
    holdings,
    startAssets,
    deposit,
    feesPaidThisYear,
    state.history,
    settings
  );

  return {
    currentYear: stepRes.nextYear,
    cashKRW: stepRes.updatedCash,
    holdings: stepRes.updatedHoldings,
    history: [...state.history, stepRes.performanceRecord],
    tradeLogs: [...state.tradeLogs, ...logs],
    isGameOver: stepRes.isGameOver,
  };
}

/**
 * Executes multi-year automated investment simulation loop
 */
export function runAutoInvestSimulation(
  initialState: AutoInvestStepState,
  rule: AutoInvestRule,
  settings: GameSettings,
  yearsToRun: number
): AutoInvestStepState {
  let state = { ...initialState };

  for (let i = 0; i < yearsToRun; i++) {
    if (state.isGameOver || state.currentYear > settings.endYear) {
      break;
    }
    state = executeAutoInvestSingleYear(state, rule, settings);
  }

  return state;
}
