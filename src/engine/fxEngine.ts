import rawFx from '../data/normalized/fx_usdkrw.json';
import type { FxDataset } from '../types/stockGame';

export const FX_RATES: FxDataset = rawFx as unknown as FxDataset;

/**
 * Returns USD/KRW exchange rate at year-end of given year
 */
export function getFxRate(year: number): number {
  const yStr = year.toString();
  const ratesObj = (FX_RATES as { rates?: Record<string, number> }).rates || (FX_RATES as unknown as Record<string, number>);
  if (ratesObj && ratesObj[yStr] !== undefined) {
    return ratesObj[yStr];
  }
  if (year < 1980) return ratesObj['1980'] || ratesObj['1979'] || 580.0;
  return ratesObj['2025'] || 1445.0;
}

/**
 * Computes FX return from year t-1 to year t
 * Returns (FX_t / FX_{t-1}) - 1
 */
export function getFxReturn(year: number): number {
  const prevRate = getFxRate(year - 1);
  const currentRate = getFxRate(year);
  if (prevRate <= 0) return 0;
  return (currentRate - prevRate) / prevRate;
}

/**
 * Converts USD return into KRW return: (1 + R_usd) * (FX_t / FX_{t-1}) - 1
 */
export function convertUsdReturnToKrw(usdReturn: number, year: number): number {
  const prevFx = getFxRate(year - 1);
  const curFx = getFxRate(year);
  if (prevFx <= 0) return usdReturn;
  const fxRatio = curFx / prevFx;
  return (1 + usdReturn) * fxRatio - 1;
}

/**
 * Decomposes USD return in KRW
 */
export function decomposeUsdReturnInKrw(usdReturn: number, year: number) {
  const totalKrwReturn = convertUsdReturnToKrw(usdReturn, year);
  return {
    totalKrwReturn,
    fxContributionRate: totalKrwReturn - usdReturn,
  };
}

/**
 * Converts USD amount to KRW using year-end rate of given year
 */
export function usdToKrw(usdAmount: number, year: number, fxFeeRate = 0): number {
  const rate = getFxRate(year);
  return usdAmount * rate * (1 - fxFeeRate);
}

/**
 * Converts KRW amount to USD using year-end rate of given year
 */
export function krwToUsd(krwAmount: number, year: number, fxFeeRate = 0): number {
  const rate = getFxRate(year);
  if (rate <= 0) return 0;
  return (krwAmount * (1 - fxFeeRate)) / rate;
}

/**
 * Decomposes US Stock total KRW return into Local Return and FX Return contribution
 */
export function decomposeUsStockReturn(
  localUsdReturn: number,
  year: number
): {
  krwReturn: number;
  localReturn: number;
  fxReturn: number;
  fxContribution: number;
} {
  const fxRet = getFxReturn(year);
  const totalKrwReturn = (1 + localUsdReturn) * (1 + fxRet) - 1;
  const fxContrib = totalKrwReturn - localUsdReturn;

  return {
    krwReturn: totalKrwReturn,
    localReturn: localUsdReturn,
    fxReturn: fxRet,
    fxContribution: fxContrib,
  };
}
