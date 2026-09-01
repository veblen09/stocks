import type {
  AutoInvestRule,
  CrisisDecisionRecord,
  GameSettings,
  StockHolding,
  TradeLogItem,
  YearlyPerformanceRecord,
} from '../types/stockGame';
import { executeBuy, executeSell, executeRebalanceToTargetWeights } from './tradeEngine';
import { advanceSimulationOneYear, calculatePortfolioValue } from './portfolioEngine';
import { STOCKS, isStockListed, getHistoricalStockStats, getStockPriceKRW } from './returnEngine';
import { getCrisisEventForYear } from './crisisEngine';
import { calculateMDD, calculateRecoveryMetrics, calculatePureInvestmentPnL } from './metricsEngine';

export interface AutoInvestStepState {
  currentYear: number;
  cashKRW: number;
  holdings: Record<string, StockHolding>;
  history: YearlyPerformanceRecord[];
  tradeLogs: TradeLogItem[];
  crisisDecisionHistory?: CrisisDecisionRecord[];
  isGameOver: boolean;
}

export interface AutoInvestSummary {
  yearsRun: number;
  finalPortfolioValue: number;
  totalInvestedPrincipal: number;
  pureInvestmentPnLKRW: number;
  pureInvestmentPnLPercent: number;
  twrCAGR: number;
  maxDrawdownMDD: number;
  worstYear: { year: number; returnRate: number };
  maxUnderwaterYears: number;
  crisisDecisionsExecuted: number;
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
  const isFirstSimYear = year === settings.startYear;
  const deposit = isFirstSimYear ? 0 : settings.annualContributionKRW;
  let cash = state.cashKRW + deposit;
  let holdings = { ...state.holdings };
  const logs: TradeLogItem[] = [];
  const crisisRecords: CrisisDecisionRecord[] = [...(state.crisisDecisionHistory || [])];
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

  // Check if historical crisis event occurs this year and crisisRule is configured
  const crisisEvent = getCrisisEventForYear(year);
  if (crisisEvent && rule.crisisRule) {
    const crisisAction = rule.crisisRule.action;
    const priorYear = year - 1;
    let krVal = 0;
    let usVal = 0;
    let currentHoldingVal = 0;

    for (const cid in holdings) {
      const h = holdings[cid];
      const p = getStockPriceKRW(cid, priorYear) || 0;
      const v = h.shares * p;
      currentHoldingVal += v;
      if (cid.startsWith('KR_')) krVal += v;
      else usVal += v;
    }

    const totalValBefore = cash + currentHoldingVal;
    let crisisFeePaid = 0;

    if ((crisisAction === 'REBALANCE' || crisisAction === 'REBALANCE_TO_TARGET') && targetAllocations.length > 0) {
      const rebRes = executeRebalanceToTargetWeights(targetAllocations, cash, holdings, year, settings);
      cash = rebRes.updatedCash;
      holdings = rebRes.updatedHoldings;
      logs.push(...rebRes.tradeLogs);
      feesPaidThisYear += rebRes.totalFees;
      crisisFeePaid = rebRes.totalFees;
    } else if (crisisAction === 'RAISE_CASH') {
      const targetCashWeight = rule.crisisRule.targetCashWeight || 0.3;
      const targetCashAmount = totalValBefore * targetCashWeight;
      const neededCash = targetCashAmount - cash;

      if (neededCash > 1000 && currentHoldingVal > 0) {
        const sellFraction = Math.min(0.999, neededCash / currentHoldingVal);
        for (const cid in holdings) {
          const h = holdings[cid];
          if (h.shares > 0) {
            const sharesToSell = h.shares * sellFraction;
            if (sharesToSell > 1e-6) {
              const sellRes = executeSell(cid, sharesToSell, cash, holdings, year, settings);
              cash = sellRes.updatedCash;
              holdings = sellRes.updatedHoldings;
              logs.push(...sellRes.tradeLogs);
              feesPaidThisYear += sellRes.totalFees;
              crisisFeePaid += sellRes.totalFees;
            }
          }
        }
      }
    }

    crisisRecords.push({
      crisisId: crisisEvent.id,
      year: crisisEvent.year,
      month: crisisEvent.month,
      titleKo: crisisEvent.titleKo,
      chosenAction: crisisAction === 'REBALANCE_TO_TARGET' ? 'REBALANCE' : crisisAction,
      targetCashWeight: rule.crisisRule.targetCashWeight,
      portfolioValueAtCrisisKRW: totalValBefore,
      drawdownAtCrisis: 0,
      tradingFeePaidKRW: crisisFeePaid,
      allocationBefore: {
        krWeight: totalValBefore > 0 ? krVal / totalValBefore : 0,
        usWeight: totalValBefore > 0 ? usVal / totalValBefore : 0,
        cashWeight: totalValBefore > 0 ? cash / totalValBefore : 1,
      },
      allocationAfter: {
        krWeight: totalValBefore > 0 ? krVal / totalValBefore : 0,
        usWeight: totalValBefore > 0 ? usVal / totalValBefore : 0,
        cashWeight: totalValBefore > 0 ? cash / totalValBefore : 1,
      },
      rationale: `자동투자 규칙에 따른 ${crisisAction === 'HOLD' ? '원칙 유지' : crisisAction === 'RAISE_CASH' ? '현금 비중 확대' : '목표비중 리밸런싱'} 자동 집행`,
      timestamp: Date.now(),
    });
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
    crisisDecisionHistory: crisisRecords,
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

/**
 * Summarizes the output of an automated investment execution
 */
export function summarizeAutoInvestResults(
  startState: AutoInvestStepState,
  endState: AutoInvestStepState,
  settings: GameSettings
): AutoInvestSummary {
  const yearsRun = endState.history.length - startState.history.length;
  const lastHistory = endState.history.length > 0 ? endState.history[endState.history.length - 1] : null;
  const finalValue = lastHistory ? lastHistory.endTotalAssetsKRW : endState.cashKRW;

  const totalDeposits = endState.history.reduce((sum, h, idx) => (idx === 0 ? sum : sum + h.annualDepositKRW), 0);
  const { netInvestedPrincipalKRW, investmentPnLKRW, investmentPnLPercent } = calculatePureInvestmentPnL(
    finalValue,
    settings.initialCashKRW,
    totalDeposits
  );

  const twrLevels = [100.0, ...endState.history.map(h => h.twrIndexLevel)];
  const maxDrawdownMDD = calculateMDD(twrLevels);
  const recoveryMetrics = calculateRecoveryMetrics(endState.history, settings.startYear);

  let worstYear = { year: settings.startYear, returnRate: 0 };
  endState.history.forEach(h => {
    if (h.annualReturn < worstYear.returnRate || h === endState.history[0]) {
      worstYear = { year: h.year, returnRate: h.annualReturn };
    }
  });

  const twrIndexEnd = lastHistory ? lastHistory.twrIndexLevel : 100.0;
  const twrCAGR = endState.history.length > 0 ? Math.pow(twrIndexEnd / 100.0, 1.0 / endState.history.length) - 1.0 : 0;

  return {
    yearsRun,
    finalPortfolioValue: finalValue,
    totalInvestedPrincipal: netInvestedPrincipalKRW,
    pureInvestmentPnLKRW: investmentPnLKRW,
    pureInvestmentPnLPercent: investmentPnLPercent,
    twrCAGR,
    maxDrawdownMDD,
    worstYear,
    maxUnderwaterYears: recoveryMetrics.underwaterDurationYears || 0,
    crisisDecisionsExecuted: endState.crisisDecisionHistory?.length || 0,
  };
}
