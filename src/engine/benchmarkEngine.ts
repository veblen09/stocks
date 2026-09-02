import rawBenchmarks from '../data/normalized/benchmarks.json';
import type { BenchmarksDataset, BenchmarkId, BenchmarkDetail } from '../types/stockGame';

export const BENCHMARKS: BenchmarksDataset = rawBenchmarks as unknown as BenchmarksDataset;

export const BENCHMARK_METADATA: Record<BenchmarkId, { nameKo: string; nameEn: string; badge: string; color: string; description: string }> = {
  kospi: {
    nameKo: '한국 코스피 200 지수 (KOSPI 200)',
    nameEn: 'KOSPI 200 Index',
    badge: '🇰🇷 코스피 200',
    color: '#64748b',
    description: '대한민국 유가증권시장 시가총액 상위 200대 우량 대형주 단순 보유(Buy & Hold) 수익률',
  },
  sp500: {
    nameKo: '미국 S&P 500 (원화 환산)',
    nameEn: 'S&P 500 Index (KRW Adjusted)',
    badge: '🇺🇸 S&P 500',
    color: '#7c3aed',
    description: '미국 대표 500대 우량 대형주 지수에 원화로 환산 투자한 수익률 (달러 환율 변동 포함)',
  },
  blend5050: {
    nameKo: '한·미 50:50 자산배분 (코스피 200 + S&P 500)',
    nameEn: '50/50 KOSPI 200 & S&P500 Rebalanced',
    badge: '⚖️ 50:50 혼합',
    color: '#059669',
    description: '한국 코스피 200 50% + 미국 S&P 500 50%를 연 1회 리밸런싱하며 분산 투자한 복리 성과',
  },
};

/**
 * Returns annual return for benchmark in year Y
 */
export function getBenchmarkAnnualReturn(
  benchmarkId: BenchmarkId,
  year: number,
  currency: 'KRW' | 'USD' = 'KRW'
): number {
  const yStr = year.toString();
  const benchObj: BenchmarkDetail | undefined = BENCHMARKS[benchmarkId];
  if (!benchObj) return 0;

  if (benchmarkId === 'sp500' && currency === 'USD' && benchObj.annualReturnsUSD) {
    return benchObj.annualReturnsUSD[yStr] ?? 0;
  }

  if (benchObj.annualReturns && benchObj.annualReturns[yStr] !== undefined) {
    return benchObj.annualReturns[yStr] ?? 0;
  }

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
  history: { year: number; returnRate: number; totalAssetsKRW: number; twrIndexLevel: number }[];
  totalValueKRW: number;
  finalTwrIndex: number;
} {
  let portfolioValue = (initialCapitalKRW + annualContributionKRW) * (1 - feeRate);
  let twrIndex = 100.0;
  const history: { year: number; returnRate: number; totalAssetsKRW: number; twrIndexLevel: number }[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const isFirstYear = year === startYear;
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
      twrIndexLevel: twrIndex,
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
  history: { year: number; returnRate: number; totalAssetsKRW: number; twrIndexLevel: number }[];
} {
  const series = simulateBenchmarkSeries(
    benchmarkId,
    startYear,
    endYear,
    initialCapitalKRW,
    annualContributionKRW,
    feeRate
  );

  const twrIndexLevels: number[] = [100.0];
  const annualReturns: number[] = [];

  for (const h of series.history) {
    annualReturns.push(h.returnRate);
    twrIndexLevels.push(h.twrIndexLevel);
  }

  return {
    finalPortfolioValue: series.totalValueKRW,
    twrIndexLevels,
    annualReturns,
    history: series.history,
  };
}
