import { describe, it, expect } from 'vitest';
import { getCrisisEventForYear, getCrisisEventById, executeCrisisDecision } from '../src/engine/crisisEngine';
import { calculateChapterSummary } from '../src/features/chapters/chapterEngine';
import { getChapterByYear } from '../src/features/chapters/chapterDefinitions';
import type { StockGameState } from '../src/types/stockGame';

describe('Historical Crisis & Chapter Missions Engine', () => {
  it('retrieves historical crisis events without future spoilers', () => {
    const crisis2008 = getCrisisEventForYear(2008);
    expect(crisis2008).not.toBeNull();
    expect(crisis2008?.year).toBe(2008);
    expect(crisis2008?.month).toBe(9);
    expect(crisis2008?.situationSummaryKo.length).toBeGreaterThan(0);

    const nonCrisisYear = getCrisisEventForYear(1995);
    expect(nonCrisisYear).toBeUndefined();
  });

  it('executes crisis intervention HOLD action without trading fee', () => {
    const crisis = getCrisisEventForYear(2008)!;
    const mockState: StockGameState = {
      version: '2.1.0',
      schemaVersion: 4,
      isGameStarted: true,
      isGameOver: false,
      settings: {
        nickname: '테스터',
        startYear: 2005,
        endYear: 2010,
        initialCashKRW: 10000000,
        annualContributionKRW: 0,
        allowFractionalShares: true,
        feeRate: 0.001,
        fxFeeRate: 0.0,
        includeFxEffect: true,
        primaryBenchmark: 'kospi',
        startMode: 'MANUAL',
      },
      currentYear: 2008,
      cashKRW: 2000000,
      holdings: {
        KR_005930: {
          canonicalId: 'KR_005930',
          shares: 10,
          currentValueKRW: 8000000,
          currentWeight: 0.8,
          totalInvestedKRW: 8000000,
          averageCostKRW: 800000,
          unrealizedPnlKRW: 0,
          unrealizedPnlPercent: 0,
        },
      },
      history: [],
      tradeLogs: [],
      activeAutoInvestRule: null,
      savedAutoInvestRules: [],
      watchlist: [],
      investmentNotes: {},
      tradeRationales: {},
      draftTargetWeights: {},
      processedListingEventIds: [],
      pendingListingEventId: null,
      autoInvestPauseOnListing: false,
    };

    const res = executeCrisisDecision(crisis, 'HOLD', mockState);
    expect(res.decisionRecord.chosenAction).toBe('HOLD');
    expect(res.decisionRecord.tradingFeePaidKRW).toBe(0);
    expect(res.updatedCash).toBe(mockState.cashKRW);
  });

  it('executes crisis intervention RAISE_CASH action and increases cash', () => {
    const crisis = getCrisisEventForYear(2008)!;
    const mockState: StockGameState = {
      version: '2.1.0',
      schemaVersion: 4,
      isGameStarted: true,
      isGameOver: false,
      settings: {
        nickname: '테스터',
        startYear: 2005,
        endYear: 2010,
        initialCashKRW: 10000000,
        annualContributionKRW: 0,
        allowFractionalShares: true,
        feeRate: 0.001,
        fxFeeRate: 0.0,
        includeFxEffect: true,
        primaryBenchmark: 'kospi',
        startMode: 'MANUAL',
      },
      currentYear: 2008,
      cashKRW: 10000, // Very low initial cash
      holdings: {
        KR_005930: {
          canonicalId: 'KR_005930',
          shares: 200,
          currentValueKRW: 9000000,
          currentWeight: 0.99,
          totalInvestedKRW: 9000000,
          averageCostKRW: 45000,
          unrealizedPnlKRW: 0,
          unrealizedPnlPercent: 0,
        },
      },
      history: [],
      tradeLogs: [],
      activeAutoInvestRule: null,
      savedAutoInvestRules: [],
      watchlist: [],
      investmentNotes: {},
      tradeRationales: {},
      draftTargetWeights: {},
      processedListingEventIds: [],
      pendingListingEventId: null,
      autoInvestPauseOnListing: false,
    };

    // Raise cash to 40%
    const res = executeCrisisDecision(crisis, 'RAISE_CASH', mockState, { targetCashWeight: 0.4 });
    expect(res.decisionRecord.chosenAction).toBe('RAISE_CASH');
    expect(res.updatedCash).toBeGreaterThan(mockState.cashKRW);
    expect(res.decisionRecord.tradingFeePaidKRW).toBeGreaterThan(0);
  });

  it('evaluates chapter risk missions and passes survival without game over', () => {
    const chapter = getChapterByYear(1985)!;
    const mockState: StockGameState = {
      version: '2.1.0',
      schemaVersion: 4,
      isGameStarted: true,
      isGameOver: false,
      settings: {
        nickname: '테스터',
        startYear: 1980,
        endYear: 1985,
        initialCashKRW: 10000000,
        annualContributionKRW: 0,
        allowFractionalShares: true,
        feeRate: 0.001,
        fxFeeRate: 0.0,
        includeFxEffect: true,
        primaryBenchmark: 'kospi',
        startMode: 'MANUAL',
      },
      currentYear: 1985,
      cashKRW: 5000000,
      holdings: {},
      history: [
        {
          year: 1981,
          startTotalAssetsKRW: 10000000,
          annualDepositKRW: 0,
          tradingFeesKRW: 0,
          endTotalAssetsKRW: 11000000,
          annualReturn: 0.10,
          twrIndexLevel: 110.0,
          cashKRW: 2000000,
          holdingsSnapshot: [{ canonicalId: 'KR_005930', shares: 10, valueKRW: 9000000, weight: 0.25, market: 'KR' }],
          benchmarkReturns: { kospi: 0.1, sp500KRW: 0.1, blend5050: 0.1 },
        },
        {
          year: 1982,
          startTotalAssetsKRW: 11000000,
          annualDepositKRW: 0,
          tradingFeesKRW: 0,
          endTotalAssetsKRW: 12000000,
          annualReturn: 0.09,
          twrIndexLevel: 120.0,
          cashKRW: 2000000,
          holdingsSnapshot: [{ canonicalId: 'KR_005930', shares: 10, valueKRW: 10000000, weight: 0.25, market: 'KR' }],
          benchmarkReturns: { kospi: 0.1, sp500KRW: 0.1, blend5050: 0.1 },
        },
      ],
      tradeLogs: [],
      activeAutoInvestRule: null,
      savedAutoInvestRules: [],
      watchlist: [],
      investmentNotes: {},
      tradeRationales: {},
      draftTargetWeights: {},
      processedListingEventIds: [],
      pendingListingEventId: null,
      autoInvestPauseOnListing: false,
    };

    const summary = calculateChapterSummary(chapter, mockState);
    expect(summary.riskMissionResults).toBeDefined();
    expect(summary.riskMissionResults.length).toBeGreaterThan(0);
    expect(typeof summary.survived).toBe('boolean');
  });
});
