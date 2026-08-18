import rawBenchmarks from '../data/normalized/benchmarks.json';
import type { BenchmarksDataset, BenchmarkId } from '../types/stockGame';

export const BENCHMARKS: BenchmarksDataset = rawBenchmarks as unknown as BenchmarksDataset;

/**
 * Returns annual return for benchmark in year Y
 */
export function getBenchmarkAnnualReturn(benchmarkId: BenchmarkId, year: number): number {
  const yStr = year.toString();
  const data = (BENCHMARKS as Record<string, any>)[yStr];
  if (!data) return 0;
  if (benchmarkId === 'kospi') return data.kospiReturn || 0;
  if (benchmarkId === 'sp500') return data.sp500KRWReturn || 0;
  if (benchmarkId === 'blend5050') return data.blend5050Return || 0;
  return 0;
}

/**
 * Simulates benchmark performance returning history series
 */
export function simulateBenchmarkSeries(
  benchmarkId: BenchmarkId,
  startYear: number,
  endYear: number,
  initialCapitalKRW: number,
  annualContributionKRW: number,
  feeRate: number = 0.001
): {
  history: { year: number; returnRate: number; totalAssetsKRW: number }[];
  totalValueKRW: number;
  finalTwrIndex: number;
} {
  let portfolioValue = initialCapitalKRW * (1 - feeRate);
  let twrIndex = 100.0;
  const history: { year: number; returnRate: number; totalAssetsKRW: number }[] = [];

  for (let year = startYear + 1; year <= endYear; year++) {
    const isFirstYear = year === startYear + 1;
    const deposit = isFirstYear ? 0 : annualContributionKRW;
    const depositAfterFee = deposit * (1 - feeRate);

    const startAssets = portfolioValue + depositAfterFee;
    const r = getBenchmarkAnnualReturn(benchmarkId, year);
    const endAssets = startAssets * (1 + r);
    portfolioValue = endAssets;
    twrIndex *= (1 + r);

    history.push({
      year,
      returnRate: r,
      totalAssetsKRW: endAssets,
    });
  }

  return {
    history,
    totalValueKRW: portfolioValue,
    finalTwrIndex: twrIndex,
  };
}

/**
 * Simulates benchmark performance using identical cashflows as user
 */
export function simulateBenchmarkTrajectory(
  benchmarkId: BenchmarkId,
  startYear: number,
  endYear: number,
  initialCapitalKRW: number,
  annualContributionKRW: number,
  feeRate: number = 0.001
): {
  finalPortfolioValue: number;
  twrIndexLevels: number[];
  annualReturns: number[];
} {
  const series = simulateBenchmarkSeries(
    benchmarkId,
    startYear,
    endYear,
    initialCapitalKRW,
    annualContributionKRW,
    feeRate
  );

  let twrIndex = 100.0;
  const twrIndexLevels: number[] = [100.0];
  const annualReturns: number[] = [];

  for (const h of series.history) {
    annualReturns.push(h.returnRate);
    twrIndex *= (1 + h.returnRate);
    twrIndexLevels.push(twrIndex);
  }

  return {
    finalPortfolioValue: series.totalValueKRW,
    twrIndexLevels,
    annualReturns,
  };
}
