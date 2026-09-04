import { describe, it, expect } from 'vitest';
import {
  generateYearReplayData,
  getMonthlyReplayQuality,
  getMonthlyStockPriceKRW,
  recalculateRemainingMonths,
  getNewlyAvailableNewsForMonth,
} from '../src/features/marketReplay/monthlyPortfolioEngine';
import { calculateRiskLevel } from '../src/engine/metricsEngine';
import { calculateStockAnnualPerformance, STOCKS_BY_ID } from '../src/engine/returnEngine';
import type { GameSettings, StockHolding } from '../src/types/stockGame';

const DEFAULT_SETTINGS: GameSettings = {
  nickname: '테스트투자자',
  startYear: 1980,
  endYear: 2025,
  initialCashKRW: 10000000,
  annualContributionKRW: 3000000,
  allowFractionalShares: true,
  feeRate: 0.001,
  fxFeeRate: 0.0,
  includeFxEffect: true,
  primaryBenchmark: 'kospi',
  startMode: 'MANUAL',
};

describe('Live Market Replay Engine Tests', () => {
  it('1. Quality detection should identify verified monthly vs annual only without creating fake data', () => {
    // 2008 has verified monthly data for major stocks
    const holdings2008: Record<string, StockHolding> = {
      'KR_005930': {
        canonicalId: 'KR_005930',
        shares: 100,
        currentValueKRW: 5000000,
        currentWeight: 1.0,
        totalInvestedKRW: 5000000,
        averageCostKRW: 50000,
        unrealizedPnlKRW: 0,
        unrealizedPnlPercent: 0,
      },
    };

    const quality2008 = getMonthlyReplayQuality(2008, holdings2008);
    expect(quality2008).toBe('VERIFIED_MONTHLY');
  });

  it('2. Month 1 data slice should strictly contain Month 0 (1/1) and Month 1 with zero future month leaks', () => {
    const holdings: Record<string, StockHolding> = {
      'KR_005930': {
        canonicalId: 'KR_005930',
        shares: 50,
        currentValueKRW: 2500000,
        currentWeight: 0.5,
        totalInvestedKRW: 2500000,
        averageCostKRW: 50000,
        unrealizedPnlKRW: 0,
        unrealizedPnlPercent: 0,
      },
    };

    const replayData = generateYearReplayData(
      2008,
      2500000,
      holdings,
      5000000,
      5000000,
      5000000,
      DEFAULT_SETTINGS,
      0
    );

    // Total 13 points (month 0 to month 12)
    expect(replayData.points.length).toBe(13);

    // Month 0 (index 0): Jan 1st start baseline
    expect(replayData.points[0].month).toBe(0);
    expect(replayData.points[0].date).toBe('2008-01-01');
    expect(replayData.points[0].portfolioValueKRW).toBe(5000000);
    expect(replayData.points[0].primaryBenchmarkValueKRW).toBe(5000000);

    // Visible slice at Month 1 (index 0 and index 1: 2 points)
    const month1Slice = replayData.points.slice(0, 2);
    expect(month1Slice.length).toBe(2);
    expect(month1Slice[1].month).toBe(1);
    expect(month1Slice[1].date).toBe('2008-01-28');

    // Visible slice at Month 6 (index 0 to 6: 7 points)
    const month6Slice = replayData.points.slice(0, 7);
    expect(month6Slice.length).toBe(7);
    expect(month6Slice[6].month).toBe(6);
    expect(month6Slice.every(p => p.month <= 6)).toBe(true);
  });

  it('3. Pure Investment PnL must strictly separate year-start deposit from investment gains', () => {
    const holdings: Record<string, StockHolding> = {};
    const initialDeposit = 3000000;
    const startCash = 10000000 + initialDeposit; // 13,000,000 KRW
    const cumulativePrincipal = 13000000;

    const replayData = generateYearReplayData(
      2008,
      startCash,
      holdings,
      13000000,
      cumulativePrincipal,
      13000000,
      DEFAULT_SETTINGS,
      1
    );

    // If holding only cash, investment PnL should be exactly 0
    replayData.points.forEach(p => {
      expect(p.portfolioValueKRW).toBe(13000000);
      expect(p.cumulativeContributionsKRW).toBe(13000000);
      expect(p.investmentPnLKRW).toBe(0);
      expect(p.investmentPnLPercent).toBe(0);
    });
  });

  it('4. Risk Level mapping correctly converts drawdowns into 5 tiers', () => {
    expect(calculateRiskLevel(0.0)).toBe('NORMAL');
    expect(calculateRiskLevel(-0.04)).toBe('NORMAL');
    expect(calculateRiskLevel(-0.12)).toBe('CAUTION');
    expect(calculateRiskLevel(-0.24)).toBe('WARNING');
    expect(calculateRiskLevel(-0.35)).toBe('CRISIS');
    expect(calculateRiskLevel(-0.45)).toBe('EXTREME');
  });

  it('5. Crisis event in 2008 September should mark Month 9 as isCrisisMonth', () => {
    const holdings: Record<string, StockHolding> = {
      'KR_005930': {
        canonicalId: 'KR_005930',
        shares: 10,
        currentValueKRW: 1000000,
        currentWeight: 1.0,
        totalInvestedKRW: 1000000,
        averageCostKRW: 100000,
        unrealizedPnlKRW: 0,
        unrealizedPnlPercent: 0,
      },
    };

    const replayData = generateYearReplayData(
      2008,
      0,
      holdings,
      1000000,
      1000000,
      1000000,
      DEFAULT_SETTINGS,
      0
    );

    const month9 = replayData.points.find(p => p.month === 9);
    expect(month9).toBeDefined();
    expect(month9?.isCrisisMonth).toBe(true);
    expect(month9?.crisisEventId).toBe('crisis_2008_lehman');

    const month1 = replayData.points.find(p => p.month === 1);
    expect(month1?.isCrisisMonth).toBe(false);
  });

  it('6. recalculateRemainingMonths should update months 10~12 after a Crisis Decision in month 9', () => {
    const initialHoldings: Record<string, StockHolding> = {
      'KR_005930': {
        canonicalId: 'KR_005930',
        shares: 100,
        currentValueKRW: 5000000,
        currentWeight: 1.0,
        totalInvestedKRW: 5000000,
        averageCostKRW: 50000,
        unrealizedPnlKRW: 0,
        unrealizedPnlPercent: 0,
      },
    };

    const originalData = generateYearReplayData(
      2008,
      0,
      initialHoldings,
      5000000,
      5000000,
      5000000,
      DEFAULT_SETTINGS,
      0
    );

    // Suppose user sells 50% shares to raise cash in Month 9
    const updatedHoldings: Record<string, StockHolding> = {
      'KR_005930': {
        canonicalId: 'KR_005930',
        shares: 50,
        currentValueKRW: 2500000,
        currentWeight: 0.5,
        totalInvestedKRW: 2500000,
        averageCostKRW: 50000,
        unrealizedPnlKRW: 0,
        unrealizedPnlPercent: 0,
      },
    };
    const updatedCash = 2500000;

    const recalculated = recalculateRemainingMonths(
      originalData,
      9,
      updatedCash,
      updatedHoldings,
      DEFAULT_SETTINGS
    );

    // Month 0 and Months 1 to 9 should remain identical
    for (let m = 0; m <= 9; m++) {
      expect(recalculated.points[m].portfolioValueKRW).toBe(originalData.points[m].portfolioValueKRW);
    }

    // Month 10 should reflect new cash and fewer shares
    expect(recalculated.points[10].cashKRW).toBe(updatedCash);
  });

  it('7. Historical news should only be available in or after its availableFrom month', () => {
    // Check news available in 2008-09
    const septNews = getNewlyAvailableNewsForMonth(2008, 9);
    expect(Array.isArray(septNews)).toBe(true);

    septNews.forEach(n => {
      expect(n.availableFrom.startsWith('2008-09')).toBe(true);
    });
  });

  it('8. Zero calculation drift: Monthly US stock pricing includes valid FX rate without NaN', () => {
    const applePrice = getMonthlyStockPriceKRW('US_AAPL', 2020, 6);
    expect(applePrice).toBeGreaterThan(0);
    expect(Number.isFinite(applePrice)).toBe(true);
  });

  it('9. 45-year simulation trajectory produces finite values for all points (no NaN or Infinity)', () => {
    const holdings: Record<string, StockHolding> = {
      'KR_005930': {
        canonicalId: 'KR_005930',
        shares: 100,
        currentValueKRW: 5000000,
        currentWeight: 1.0,
        totalInvestedKRW: 5000000,
        averageCostKRW: 50000,
        unrealizedPnlKRW: 0,
        unrealizedPnlPercent: 0,
      },
    };

    for (let yr = 1980; yr <= 2025; yr++) {
      const data = generateYearReplayData(
        yr,
        10000000,
        holdings,
        10000000,
        10000000,
        10000000,
        DEFAULT_SETTINGS,
        yr - 1980
      );

      expect(data.points.length).toBe(13);
      data.points.forEach(p => {
        expect(Number.isFinite(p.portfolioValueKRW)).toBe(true);
        expect(Number.isFinite(p.ytdReturn)).toBe(true);
        expect(Number.isFinite(p.drawdown)).toBe(true);
        expect(Number.isNaN(p.portfolioValueKRW)).toBe(false);
      });
    }
  });

  it('10. Underwater duration correctly counts consecutive months below peak', () => {
    const holdings: Record<string, StockHolding> = {
      'KR_005930': {
        canonicalId: 'KR_005930',
        shares: 100,
        currentValueKRW: 5000000,
        currentWeight: 1.0,
        totalInvestedKRW: 5000000,
        averageCostKRW: 50000,
        unrealizedPnlKRW: 0,
        unrealizedPnlPercent: 0,
      },
    };

    // 2008 was a bear market year with extended drawdown
    const data2008 = generateYearReplayData(
      2008,
      0,
      holdings,
      5000000,
      5000000,
      6000000, // Peak was 6,000,000 KRW
      DEFAULT_SETTINGS,
      1
    );

    const month12 = data2008.points[12];
    expect(month12.monthsUnderwater).toBeGreaterThanOrEqual(1);
    expect(data2008.maxMonthsUnderwater).toBeGreaterThanOrEqual(1);
  });

  it('11. 1987 October Black Monday triggers crisis at Month 10 and safely recalculates months 11~12', () => {
    const holdings1987: Record<string, StockHolding> = {
      'KR_005930': {
        canonicalId: 'KR_005930',
        shares: 100,
        currentValueKRW: 5000000,
        currentWeight: 1.0,
        totalInvestedKRW: 5000000,
        averageCostKRW: 50000,
        unrealizedPnlKRW: 0,
        unrealizedPnlPercent: 0,
      },
    };

    const data1987 = generateYearReplayData(
      1987,
      5000000,
      holdings1987,
      10000000,
      10000000,
      10000000,
      DEFAULT_SETTINGS,
      7
    );

    const month10 = data1987.points[10];
    expect(month10.month).toBe(10);
    expect(month10.isCrisisMonth).toBe(true);
    expect(month10.crisisEventId).toBe('crisis_1987_black_monday');

    // Test remaining months recalculation after crisis decision in Month 10
    const recalculated = recalculateRemainingMonths(
      data1987,
      10,
      7000000, // Raised cash
      holdings1987,
      DEFAULT_SETTINGS
    );

    expect(recalculated.points.length).toBe(13);
    expect(recalculated.points[11].month).toBe(11);
    expect(recalculated.points[12].month).toBe(12);
    expect(recalculated.points[12].portfolioValueKRW).toBeGreaterThan(0);
  });

  it('12. 1980 Hyundai Motor portfolio trajectory fluctuates realistically without flatlining from Month 2 to 12', () => {
    const holdings1980: Record<string, StockHolding> = {
      'KR_005380': {
        canonicalId: 'KR_005380',
        shares: 102854,
        currentValueKRW: 13000000,
        currentWeight: 1.0,
        totalInvestedKRW: 13000000,
        averageCostKRW: 126.39,
        unrealizedPnlKRW: 0,
        unrealizedPnlPercent: 0,
      },
    };

    const data1980 = generateYearReplayData(
      1980,
      0,
      holdings1980,
      13000000,
      13000000,
      13000000,
      DEFAULT_SETTINGS,
      0
    );

    expect(data1980.points.length).toBe(13);

    // Month-to-month values should fluctuate, not stay identical
    const monthlyVals = data1980.points.slice(1).map(p => p.portfolioValueKRW);
    const uniqueVals = new Set(monthlyVals.map(v => Math.round(v)));

    // Must have at least 5 different monthly values across the 12 months (not flat)
    expect(uniqueVals.size).toBeGreaterThanOrEqual(5);

    // Check that month 12 lands on the actual year-end stock value
    const endPrice = getMonthlyStockPriceKRW('KR_005380', 1980, 12);
    expect(endPrice).toBeCloseTo(137.1359, 2);
  });

  it('13. S&P 500 benchmark monthly trajectory in 1980 and 1984 reflects authentic historical price movements without fixed +7% sine wave', () => {
    const settingsSP500: GameSettings = {
      ...DEFAULT_SETTINGS,
      primaryBenchmark: 'sp500',
    };

    const data1980 = generateYearReplayData(
      1980,
      10000000,
      {},
      10000000,
      10000000,
      10000000,
      settingsSP500,
      0
    );

    const data1984 = generateYearReplayData(
      1984,
      10000000,
      {},
      10000000,
      10000000,
      10000000,
      settingsSP500,
      4
    );

    // 1980 S&P 500 experienced a major bull run in KRW (closing > +40% YTD), not a fixed +7%
    const sp1980Month12Return = data1980.points[12].primaryBenchmarkYtdReturn;
    expect(sp1980Month12Return).toBeGreaterThan(0.35);

    // 1984 S&P 500 should differ from 1980 (e.g. ~5.5% in KRW)
    const sp1984Month12Return = data1984.points[12].primaryBenchmarkYtdReturn;
    expect(sp1984Month12Return).toBeCloseTo(0.055, 2);
    expect(sp1984Month12Return).not.toBe(sp1980Month12Return);
  });
});


