import rawStocks from '../data/normalized/stocks.json';
import rawAnnualPrices from '../data/normalized/annual_prices.json';
import type { Stock } from '../types/stockGame';
import { getFxRate, getFxReturn } from './fxEngine';

export const STOCKS: Stock[] = rawStocks as unknown as Stock[];
export const STOCKS_BY_ID: Record<string, Stock> = {};
STOCKS.forEach(s => {
  STOCKS_BY_ID[s.canonicalId] = s;
});

interface RawStockPriceItem {
  canonicalId: string;
  ticker: string;
  currency: 'KRW' | 'USD';
  firstValidYear: number;
  lastValidYear: number;
  prices: Record<string, number | null>;
  annualReturns: Record<string, number | null>;
}

export const ANNUAL_PRICES: Record<string, RawStockPriceItem> = rawAnnualPrices as unknown as Record<string, RawStockPriceItem>;

/**
 * Returns true if the stock is active/listed in year Y
 */
export function isStockListed(canonicalId: string, year: number): boolean {
  const stock = STOCKS_BY_ID[canonicalId];
  if (!stock) return false;
  return year >= stock.firstValidYear;
}

/**
 * Returns year-end local currency price of stock in given year
 */
export function getStockPriceLocal(canonicalId: string, year: number): number | null {
  const stockData = ANNUAL_PRICES[canonicalId];
  if (!stockData || !stockData.prices) return null;
  const yStr = year.toString();
  const price = stockData.prices[yStr];
  if (price === null || price === undefined) return null;
  return price;
}

/**
 * Returns year-end price in KRW of stock in given year
 */
export function getStockPriceKRW(canonicalId: string, year: number): number | null {
  const stock = STOCKS_BY_ID[canonicalId];
  if (!stock) return null;

  const localPrice = getStockPriceLocal(canonicalId, year);
  if (localPrice === null) return null;

  if (stock.market === 'KR') {
    return localPrice;
  } else {
    const fxRate = getFxRate(year);
    return localPrice * fxRate;
  }
}

/**
 * Returns annual return for stock in year Y (holding from year-end Y-1 to year-end Y)
 * Returns number | null directly (null if pre-IPO)
 */
export function getStockAnnualReturn(
  canonicalId: string,
  year: number,
  includeFxEffect = true
): number | null {
  const stock = STOCKS_BY_ID[canonicalId];
  if (!stock || !isStockListed(canonicalId, year)) {
    return null;
  }

  const stockData = ANNUAL_PRICES[canonicalId];
  const yStr = year.toString();
  if (stockData && stockData.annualReturns && stockData.annualReturns[yStr] !== undefined) {
    const localRet = stockData.annualReturns[yStr];
    if (localRet === null) return null;

    if (stock.market === 'KR' || !includeFxEffect) {
      return localRet;
    } else {
      const fxRet = getFxReturn(year);
      return (1 + localRet) * (1 + fxRet) - 1;
    }
  }

  const priceY = getStockPriceLocal(canonicalId, year);
  const pricePrior = getStockPriceLocal(canonicalId, year - 1);

  if (priceY === null || pricePrior === null || pricePrior <= 0) {
    return null;
  }

  const localRet = (priceY - pricePrior) / pricePrior;

  if (stock.market === 'KR' || !includeFxEffect) {
    return localRet;
  } else {
    const fxRet = getFxReturn(year);
    return (1 + localRet) * (1 + fxRet) - 1;
  }
}

/**
 * Returns historical annualized return and volatility statistics up to priorYear
 */
export interface HistoricalStockStats {
  yearsOfData: number;
  last1YrReturn: number | null;
  prior1YReturn?: number | null;
  past3YrCAGR: number | null;
  cagr3Y?: number | null;
  past5YrCAGR: number | null;
  cagr5Y?: number | null;
  historicalVolatility: number | null;
  volatility3Y?: number | null;
  historicalMDD: number | null;
  mddHistorical?: number | null;
}

export function getHistoricalStockStats(
  canonicalId: string,
  priorYear: number,
  includeFxEffect = true
): HistoricalStockStats {
  const stock = STOCKS_BY_ID[canonicalId];
  if (!stock) {
    return {
      yearsOfData: 0,
      last1YrReturn: null,
      prior1YReturn: null,
      past3YrCAGR: null,
      cagr3Y: null,
      past5YrCAGR: null,
      cagr5Y: null,
      historicalVolatility: null,
      volatility3Y: null,
      historicalMDD: null,
      mddHistorical: null,
    };
  }

  const startValid = stock.firstValidYear;
  const yearsOfData = priorYear >= startValid ? priorYear - startValid + 1 : 0;

  // 1-Yr Return
  let last1YrReturn: number | null = null;
  if (priorYear >= startValid) {
    last1YrReturn = getStockAnnualReturn(canonicalId, priorYear, includeFxEffect);
  }

  // Past 3-Yr CAGR
  let past3YrCAGR: number | null = null;
  if (priorYear - 3 >= startValid - 1) {
    const pEnd = getStockPriceKRW(canonicalId, priorYear);
    const pStart = getStockPriceKRW(canonicalId, priorYear - 3);
    if (pEnd !== null && pStart !== null && pStart > 0) {
      past3YrCAGR = Math.pow(pEnd / pStart, 1 / 3) - 1;
    }
  }

  // Past 5-Yr CAGR
  let past5YrCAGR: number | null = null;
  if (priorYear - 5 >= startValid - 1) {
    const pEnd = getStockPriceKRW(canonicalId, priorYear);
    const pStart = getStockPriceKRW(canonicalId, priorYear - 5);
    if (pEnd !== null && pStart !== null && pStart > 0) {
      past5YrCAGR = Math.pow(pEnd / pStart, 1 / 5) - 1;
    }
  }

  // Historical Volatility & MDD up to priorYear
  const returns: number[] = [];
  const prices: number[] = [];

  for (let y = startValid - 1; y <= priorYear; y++) {
    const p = getStockPriceKRW(canonicalId, y);
    if (p !== null) {
      prices.push(p);
    }
  }

  for (let y = startValid; y <= priorYear; y++) {
    const r = getStockAnnualReturn(canonicalId, y, includeFxEffect);
    if (r !== null) {
      returns.push(r);
    }
  }

  let historicalVolatility: number | null = null;
  if (returns.length >= 2) {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    historicalVolatility = Math.sqrt(variance);
  }

  let historicalMDD: number | null = null;
  if (prices.length >= 2) {
    let peak = prices[0];
    let maxDd = 0;
    for (let i = 0; i < prices.length; i++) {
      if (prices[i] > peak) {
        peak = prices[i];
      }
      const dd = peak > 0 ? (peak - prices[i]) / peak : 0;
      if (dd > maxDd) {
        maxDd = dd;
      }
    }
    historicalMDD = maxDd;
  }

  return {
    yearsOfData,
    last1YrReturn,
    prior1YReturn: last1YrReturn,
    past3YrCAGR,
    cagr3Y: past3YrCAGR,
    past5YrCAGR,
    cagr5Y: past5YrCAGR,
    historicalVolatility,
    volatility3Y: historicalVolatility,
    historicalMDD,
    mddHistorical: historicalMDD,
  };
}

