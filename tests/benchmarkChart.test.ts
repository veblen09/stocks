import { describe, it, expect } from 'vitest';
import { getCompany1YrSparkline, getCompanyNaverChartData } from '../src/engine/companyChartEngine';
import rawBenchmarks from '../src/data/normalized/benchmarks.json';
import type { BenchmarksDataset } from '../src/types/stockGame';

const BENCHMARKS = rawBenchmarks as unknown as BenchmarksDataset;

describe('Benchmark Chart & Sparkline Consistency', () => {
  it('KOSPI 200 1980 sparkline and naver chart match benchmarks.json levels', () => {
    const spark = getCompany1YrSparkline('BENCH_KOSPI', 1980);
    expect(spark).not.toBeNull();
    expect(spark!.startPrice).toBeCloseTo(10.96, 2);
    expect(spark!.endPrice).toBeCloseTo(11.71, 2);
    expect(spark!.return1Yr).toBeCloseTo(0.0684, 3);
    expect(spark!.isPositive).toBe(true);
    // Ensure sparkline does not have a giant jump (e.g. min should be around 10.96 ~ 11.38, not 10.96 vs 105)
    expect(spark!.minPrice).toBeGreaterThan(10.0);
    expect(spark!.maxPrice).toBeLessThan(15.0);

    const naver = getCompanyNaverChartData('BENCH_KOSPI', 1980, 'LINE', '1Y', 'KRW');
    expect(naver).not.toBeNull();
    expect(naver!.currentPrice).toBeCloseTo(11.71, 1);
    expect(naver!.periodStartPrice).toBeCloseTo(10.96, 1);
    expect(naver!.periodChangePercent).toBeCloseTo(0.0684, 2);
    expect(naver!.highPrice).toBeLessThan(15.0);
    expect(naver!.lowPrice).toBeGreaterThan(10.0);
  });

  it('S&P 500 1980 sparkline and naver chart match benchmarks.json levels', () => {
    const spark = getCompany1YrSparkline('BENCH_SP500', 1980);
    expect(spark).not.toBeNull();
    expect(spark!.startPrice).toBeCloseTo(107.94, 2);
    expect(spark!.endPrice).toBeCloseTo(135.76, 2);
    expect(spark!.return1Yr).toBeCloseTo(0.2577, 3);
    expect(spark!.isPositive).toBe(true);

    const naverUSD = getCompanyNaverChartData('BENCH_SP500', 1980, 'LINE', '1Y', 'LOCAL');
    expect(naverUSD).not.toBeNull();
    expect(naverUSD!.currentPrice).toBeCloseTo(135.76, 1);
    expect(naverUSD!.periodStartPrice).toBeCloseTo(107.94, 1);
  });
});
