import type { StockHolding, TradeLogItem, GameSettings } from '../types/stockGame';
import { getStockPriceKRW, getStockPriceLocal, isStockListed, STOCKS_BY_ID } from './returnEngine';
import { getFxRate } from './fxEngine';

export interface ExecuteTradeResult {
  updatedCash: number;
  updatedHoldings: Record<string, StockHolding>;
  tradeLogs: TradeLogItem[];
  totalFees: number;
}

/**
 * Validates a single BUY order
 */
export function validateBuyOrder(
  canonicalId: string,
  amountKRW: number,
  currentCash: number,
  year: number,
  feeRate: number
): { valid: boolean; error?: string } {
  if (!isStockListed(canonicalId, year)) {
    return { valid: false, error: '상장 이전 종목이거나 거래할 수 없는 연도입니다.' };
  }
  if (amountKRW <= 0) {
    return { valid: false, error: '매수 금액은 0원보다 커야 합니다.' };
  }
  const fee = amountKRW * feeRate;
  const tolerance = Math.max(1e-4, currentCash * 1e-7);
  if (amountKRW + fee > currentCash + tolerance) {
    return { valid: false, error: `현금 잔액이 부족합니다. (필요: ${(amountKRW + fee).toLocaleString()}원, 잔액: ${currentCash.toLocaleString()}원)` };
  }
  return { valid: true };
}

/**
 * Validates a single SELL order
 */
export function validateSellOrder(
  _canonicalId: string,
  sharesToSell: number,
  holding?: StockHolding
): { valid: boolean; error?: string } {
  if (!holding || holding.shares <= 0) {
    return { valid: false, error: '보유 수량이 없는 종목입니다.' };
  }
  if (sharesToSell <= 0) {
    return { valid: false, error: '매도 수량은 0보다 커야 합니다.' };
  }
  if (sharesToSell > holding.shares + 1e-6) {
    return { valid: false, error: `보유 수량을 초과하여 매도할 수 없습니다. (보유: ${holding.shares.toFixed(4)}주)` };
  }
  return { valid: true };
}

/**
 * Executes a single BUY trade
 */
export function executeBuy(
  canonicalId: string,
  amountKRW: number,
  cashKRW: number,
  holdings: Record<string, StockHolding>,
  year: number,
  settings: GameSettings
): ExecuteTradeResult {
  // Defensively clamp to max affordable amount so rounding or max selection never exceeds cash
  const maxAffordable = Math.max(0, Math.floor(cashKRW / (1 + settings.feeRate)));
  const effectiveAmount = amountKRW > maxAffordable ? maxAffordable : amountKRW;

  const validation = validateBuyOrder(canonicalId, effectiveAmount, cashKRW, year, settings.feeRate);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const stock = STOCKS_BY_ID[canonicalId];
  const priceYear = year - 1;
  const priceKRW = getStockPriceKRW(canonicalId, priceYear) || 1;
  const priceLocal = getStockPriceLocal(canonicalId, priceYear) || 1;
  const fxRate = getFxRate(priceYear);

  const fee = effectiveAmount * settings.feeRate;
  const newCash = Math.max(0, cashKRW - (effectiveAmount + fee));
  const boughtShares = priceKRW > 0 ? effectiveAmount / priceKRW : 0;


  const currentHolding = holdings[canonicalId] || {
    canonicalId,
    shares: 0,
    totalInvestedKRW: 0,
    averageCostKRW: 0,
    currentValueKRW: 0,
    currentWeight: 0,
    unrealizedPnlKRW: 0,
    unrealizedPnlPercent: 0,
  };

  const newShares = currentHolding.shares + boughtShares;
  const newInvested = currentHolding.totalInvestedKRW + effectiveAmount;
  const newAvgCost = newShares > 0 ? newInvested / newShares : 0;

  const updatedHolding: StockHolding = {
    ...currentHolding,
    shares: newShares,
    totalInvestedKRW: newInvested,
    averageCostKRW: newAvgCost,
    currentValueKRW: newShares * priceKRW,
    unrealizedPnlKRW: newShares * priceKRW - newInvested,
    unrealizedPnlPercent: newInvested > 0 ? (newShares * priceKRW - newInvested) / newInvested : 0,
  };

  const log: TradeLogItem = {
    year,
    canonicalId,
    stockNameKo: stock.nameKo,
    action: 'BUY',
    shares: boughtShares,
    priceLocal,
    fxRate,
    priceKRW,
    totalAmountKRW: effectiveAmount,
    feeKRW: fee,
    timestamp: Date.now(),
  };


  return {
    updatedCash: newCash,
    updatedHoldings: {
      ...holdings,
      [canonicalId]: updatedHolding,
    },
    tradeLogs: [log],
    totalFees: fee,
  };
}

/**
 * Executes a single SELL trade
 */
export function executeSell(
  canonicalId: string,
  sharesToSell: number,
  cashKRW: number,
  holdings: Record<string, StockHolding>,
  year: number,
  settings: GameSettings
): ExecuteTradeResult {
  const currentHolding = holdings[canonicalId];
  const validation = validateSellOrder(canonicalId, sharesToSell, currentHolding);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const stock = STOCKS_BY_ID[canonicalId];
  const priceYear = year - 1;
  const priceKRW = getStockPriceKRW(canonicalId, priceYear) || 1;
  const priceLocal = getStockPriceLocal(canonicalId, priceYear) || 1;
  const fxRate = getFxRate(priceYear);

  const actualSharesToSell = Math.min(sharesToSell, currentHolding.shares);
  const grossAmount = actualSharesToSell * priceKRW;
  const fee = grossAmount * settings.feeRate;
  const netAmount = grossAmount - fee;
  const newCash = cashKRW + netAmount;

  const remainingShares = Math.max(0, currentHolding.shares - actualSharesToSell);
  const costPerShare = currentHolding.shares > 0 ? currentHolding.totalInvestedKRW / currentHolding.shares : 0;
  const remainingInvested = remainingShares * costPerShare;

  let updatedHoldings = { ...holdings };

  if (remainingShares <= 1e-7) {
    delete updatedHoldings[canonicalId];
  } else {
    updatedHoldings[canonicalId] = {
      ...currentHolding,
      shares: remainingShares,
      totalInvestedKRW: remainingInvested,
      averageCostKRW: costPerShare,
      currentValueKRW: remainingShares * priceKRW,
      unrealizedPnlKRW: remainingShares * priceKRW - remainingInvested,
      unrealizedPnlPercent: remainingInvested > 0 ? (remainingShares * priceKRW - remainingInvested) / remainingInvested : 0,
    };
  }

  const log: TradeLogItem = {
    year,
    canonicalId,
    stockNameKo: stock.nameKo,
    action: 'SELL',
    shares: actualSharesToSell,
    priceLocal,
    fxRate,
    priceKRW,
    totalAmountKRW: grossAmount,
    feeKRW: fee,
    timestamp: Date.now(),
  };

  return {
    updatedCash: newCash,
    updatedHoldings,
    tradeLogs: [log],
    totalFees: fee,
  };
}

/**
 * Rebalances entire portfolio to target weights at the beginning of year Y
 */
export function executeRebalanceToTargetWeights(
  targetWeights: { canonicalId: string; weight: number }[],
  cashKRW: number,
  holdings: Record<string, StockHolding>,
  year: number,
  settings: GameSettings
): ExecuteTradeResult {
  const totalWeight = targetWeights.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight > 1.0001) {
    throw new Error(`목표 비중의 합계(${Math.round(totalWeight * 100)}%)가 100%를 초과할 수 없습니다.`);
  }

  const priceYear = year - 1;

  let currentHoldingsValue = 0;
  for (const cid in holdings) {
    const h = holdings[cid];
    const p = getStockPriceKRW(cid, priceYear) || 0;
    currentHoldingsValue += h.shares * p;
  }
  const totalPortfolioValue = cashKRW + currentHoldingsValue;

  let currentCash = cashKRW;
  let currentHoldings = { ...holdings };
  const tradeLogs: TradeLogItem[] = [];
  let totalFees = 0;

  const targetMap: Record<string, number> = {};
  targetWeights.forEach(item => {
    targetMap[item.canonicalId] = item.weight;
  });

  // Step 1: SELLs first
  for (const cid in holdings) {
    const h = holdings[cid];
    const targetW = targetMap[cid] || 0;
    const targetVal = totalPortfolioValue * targetW;
    const pKRW = getStockPriceKRW(cid, priceYear) || 1;
    const currentVal = h.shares * pKRW;

    if (currentVal > targetVal + 1e-4) {
      const valToSell = currentVal - targetVal;
      const sharesToSell = valToSell / pKRW;
      const res = executeSell(cid, sharesToSell, currentCash, currentHoldings, year, settings);
      currentCash = res.updatedCash;
      currentHoldings = res.updatedHoldings;
      tradeLogs.push(...res.tradeLogs);
      totalFees += res.totalFees;
    }
  }

  // Step 2: BUYs
  for (const item of targetWeights) {
    const cid = item.canonicalId;
    if (!isStockListed(cid, year)) {
      continue;
    }

    const targetVal = totalPortfolioValue * item.weight;
    const pKRW = getStockPriceKRW(cid, priceYear) || 1;
    const currentShares = currentHoldings[cid]?.shares || 0;
    const currentVal = currentShares * pKRW;

    if (targetVal > currentVal + 1e-4) {
      const neededVal = targetVal - currentVal;
      const maxAffordable = (currentCash * 0.9999999) / (1 + settings.feeRate);
      const valToBuy = Math.min(neededVal, maxAffordable);

      if (valToBuy > 100) {
        const res = executeBuy(cid, valToBuy, currentCash, currentHoldings, year, settings);
        currentCash = res.updatedCash;
        currentHoldings = res.updatedHoldings;
        tradeLogs.push(...res.tradeLogs);
        totalFees += res.totalFees;
      }
    }
  }

  return {
    updatedCash: currentCash,
    updatedHoldings: currentHoldings,
    tradeLogs,
    totalFees,
  };
}
