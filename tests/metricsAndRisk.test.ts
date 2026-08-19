import { describe, it, expect } from 'vitest';
import {
  calculatePureInvestmentPnL,
  calculateDrawdownPoints,
  calculateRecoveryMetrics,
  calculateRiskLevel,
  calculateRealPurchasingPower,
  calculateMDD,
} from '../src/engine/metricsEngine';
import type { YearlyPerformanceRecord } from '../src/types/stockGame';

describe('Metrics & Risk Engine', () => {
  it('correctly separates invested principal from pure investment PnL', () => {
    const initialCash = 10000000;
    const totalDeposits = 9000000; // 3 years of 3M deposits
    const finalPortfolioValue = 25000000;

    const res = calculatePureInvestmentPnL(finalPortfolioValue, initialCash, totalDeposits);
    expect(res.netInvestedPrincipalKRW).toBe(19000000);
    expect(res.investmentPnLKRW).toBe(6000000);
    expect(res.investmentPnLPercent).toBeCloseTo(6000000 / 19000000, 4);
  });

  it('correctly classifies risk levels from drawdown values', () => {
    expect(calculateRiskLevel(-0.02)).toBe('NORMAL');
    expect(calculateRiskLevel(-0.12)).toBe('CAUTION');
    expect(calculateRiskLevel(-0.22)).toBe('WARNING');
    expect(calculateRiskLevel(-0.32)).toBe('CRISIS');
    expect(calculateRiskLevel(-0.45)).toBe('EXTREME');
  });

  it('calculates exact DrawdownPoints series and underwater durations', () => {
    const mockHistory: YearlyPerformanceRecord[] = [
      {
        year: 1981,
        startTotalAssetsKRW: 10000000,
        annualDepositKRW: 0,
        tradingFeesKRW: 0,
        endTotalAssetsKRW: 12000000,
        annualReturn: 0.20,
        twrIndexLevel: 120.0,
        cashKRW: 2000000,
        holdingsSnapshot: [],
        benchmarkReturns: { kospi: 0.1, sp500KRW: 0.1, blend5050: 0.1 },
      },
      {
        year: 1982,
        startTotalAssetsKRW: 12000000,
        annualDepositKRW: 3000000,
        tradingFeesKRW: 0,
        endTotalAssetsKRW: 10000000,
        annualReturn: -0.30,
        twrIndexLevel: 84.0,
        cashKRW: 1000000,
        holdingsSnapshot: [],
        benchmarkReturns: { kospi: -0.1, sp500KRW: -0.1, blend5050: -0.1 },
      },
      {
        year: 1983,
        startTotalAssetsKRW: 10000000,
        annualDepositKRW: 3000000,
        tradingFeesKRW: 0,
        endTotalAssetsKRW: 18000000,
        annualReturn: 0.50,
        twrIndexLevel: 126.0,
        cashKRW: 2000000,
        holdingsSnapshot: [],
        benchmarkReturns: { kospi: 0.2, sp500KRW: 0.2, blend5050: 0.2 },
      },
    ];

    const points = calculateDrawdownPoints(mockHistory, 1980);
    expect(points.length).toBe(3);

    // 1981: peak = 120, dd = 0, underwater = 0
    expect(points[0].peakYear).toBe(1981);
    expect(points[0].drawdown).toBe(0);
    expect(points[0].underwaterYears).toBe(0);

    // 1982: peak = 120, twr = 84, dd = (84-120)/120 = -0.30, underwater = 1
    expect(points[1].peakYear).toBe(1981);
    expect(points[1].drawdown).toBeCloseTo(-0.30, 4);
    expect(points[1].underwaterYears).toBe(1);

    // 1983: peak = 126 (new peak), dd = 0, underwater = 0
    expect(points[2].peakYear).toBe(1983);
    expect(points[2].drawdown).toBe(0);
    expect(points[2].underwaterYears).toBe(0);
  });

  it('calculates recovery metrics for high-water mark and trough', () => {
    const mockHistory: YearlyPerformanceRecord[] = [
      {
        year: 1997,
        startTotalAssetsKRW: 10000000,
        annualDepositKRW: 0,
        tradingFeesKRW: 0,
        endTotalAssetsKRW: 6000000,
        annualReturn: -0.40,
        twrIndexLevel: 60.0,
        cashKRW: 1000000,
        holdingsSnapshot: [],
        benchmarkReturns: { kospi: -0.4, sp500KRW: 0.2, blend5050: -0.1 },
      },
      {
        year: 1998,
        startTotalAssetsKRW: 6000000,
        annualDepositKRW: 0,
        tradingFeesKRW: 0,
        endTotalAssetsKRW: 11000000,
        annualReturn: 0.8333,
        twrIndexLevel: 110.0,
        cashKRW: 1000000,
        holdingsSnapshot: [],
        benchmarkReturns: { kospi: 0.5, sp500KRW: 0.2, blend5050: 0.35 },
      },
    ];

    const recovery = calculateRecoveryMetrics(mockHistory, 1996);
    expect(recovery.maxDrawdown).toBeCloseTo(0.40, 2);
    expect(recovery.troughYear).toBe(1997);
    expect(recovery.recoveryYear).toBe(1998);
  });

  it('adjusts nominal value to 2025 CPI real purchasing power', () => {
    const nominal = 10000000;
    const realPower = calculateRealPurchasingPower(nominal, 1980, 2025);
    // 1980 CPI is ~18.3, 2025 CPI is ~116 -> real purchasing power in 2025 terms is significantly higher
    expect(realPower).toBeGreaterThan(nominal * 3);
  });
});
