import { describe, it, expect } from 'vitest';
import { HISTORICAL_CHAPTERS, getChapterByYear, getChapterById } from '../src/features/chapters/chapterDefinitions';
import { isChapterStartYear, isChapterEndYear, calculateChapterSummary } from '../src/features/chapters/chapterEngine';
import { evaluateAnnualPrediction, calculateCumulativeCalibrationMetrics } from '../src/features/predictions/predictionEngine';
import { PROCESS_ACHIEVEMENTS } from '../src/features/achievements/achievementDefinitions';
import { evaluateAchievements } from '../src/features/achievements/achievementEngine';
import { createEncyclopediaEntryForListing, syncEncyclopediaWithState } from '../src/features/encyclopedia/encyclopediaEngine';
import { evaluateThreeAxes } from '../src/features/evaluation/threeAxisEvaluationEngine';
import type { StockGameState, GameSettings } from '../src/types/stockGame';

import type { AnnualPrediction } from '../src/types/prediction';
import { calculateFinalMetrics } from '../src/engine/metricsEngine';

const mockSettings: GameSettings = {
  nickname: '테스트투자자',
  startYear: 1980,
  endYear: 2025,
  initialCashKRW: 10000000,
  annualContributionKRW: 3000000,
  allowFractionalShares: true,
  feeRate: 0.001,
  fxFeeRate: 0.0,
  includeFxEffect: true,
  primaryBenchmark: 'blend5050',
  startMode: 'MANUAL',
};

const mockInitialState: StockGameState = {
  version: '2.0.0',
  schemaVersion: 3,
  isGameStarted: true,
  isGameOver: false,
  settings: mockSettings,
  currentYear: 1981,
  cashKRW: 10000000,
  holdings: {
    'KR_005930': {
      canonicalId: 'KR_005930',
      stockNameKo: '삼성전자',
      market: 'KR',
      shares: 100,
      averageCostLocal: 5000,
      averageCostKRW: 5000,
      totalCostKRW: 500000,
      currentPriceLocal: 6000,
      currentFxRate: 1,
      currentPriceKRW: 6000,
      currentValueKRW: 600000,
      unrealizedGainLossKRW: 100000,
      unrealizedReturnRate: 0.2,
      firstPurchaseYear: 1981,
    },
  },
  history: [
    {
      year: 1981,
      startTotalAssetsKRW: 10000000,
      annualDepositKRW: 3000000,
      endTotalAssetsKRW: 15000000,
      annualReturn: 0.15,
      twrIndexLevel: 115,
      benchmarkReturns: {
        kospi: 0.10,
        sp500KRW: 0.12,
        blend5050: 0.11,
      },
    },
  ],
  tradeLogs: [
    {
      year: 1981,
      canonicalId: 'KR_005930',
      stockNameKo: '삼성전자',
      action: 'BUY',
      shares: 100,
      priceLocal: 5000,
      fxRate: 1,
      priceKRW: 5000,
      totalAmountKRW: 500000,
      feeKRW: 500,
      timestamp: 100000,
      linkedNewsIds: ['NEWS_1981_MACRO_1'],
      thesis: '반도체 산업 초기 투자 가설',
    },
  ],
  activeAutoInvestRule: null,
  savedAutoInvestRules: [],
  hasLegacyState: false,
  watchlist: ['KR_005930', 'US_AAPL'],
  investmentNotes: {
    'KR_005930': '삼성전자 1981년 매크로 리스크 및 기술 경쟁력 분석',
  },
  tradeRationales: {},
  draftTargetWeights: {},
  processedListingEventIds: [],
  pendingListingEventId: null,
  autoInvestPauseOnListing: true,
  completedChapterIds: [],
  selectedChapterGoals: { chapter_1: 'goal_c1_filings' },
  annualPredictions: {},
  unlockedAchievementIds: [],
  companyEncyclopedia: {},
  yearbookEntries: [],
  selectedMosaicMode: 'ALL',
  mobileActiveTab: 'MARKET',
  soundCategorySettings: {
    interfaceClicks: true,
    listingNotifications: true,
    chapterCompletion: true,
    warnings: true,
    achievements: true,
    bgm: false,
    haptics: false,
  },
};

describe('Historical Chapters Engine', () => {
  it('should define exactly 9 historical chapters covering 1980-2025', () => {
    expect(HISTORICAL_CHAPTERS.length).toBe(9);
    expect(HISTORICAL_CHAPTERS[0].startYear).toBe(1980);
    expect(HISTORICAL_CHAPTERS[8].endYear).toBe(2025);
  });

  it('should find chapter by year correctly', () => {
    const ch1 = getChapterByYear(1983);
    expect(ch1?.id).toBe('chapter_1');
    expect(ch1?.titleKo).toBe('고물가와 긴축의 시대');

    const ch4 = getChapterByYear(1997);
    expect(ch4?.id).toBe('chapter_4');
    expect(ch4?.titleKo).toBe('외환위기와 닷컴 열풍');
  });

  it('should detect chapter start and end years accurately', () => {
    expect(isChapterStartYear(1980, 1980)).toBe(true);
    expect(isChapterStartYear(1986, 1980)).toBe(true);
    expect(isChapterStartYear(1987, 1980)).toBe(false);

    expect(isChapterEndYear(1985, 2025)).toBe(true);
    expect(isChapterEndYear(2025, 2025)).toBe(true);
    expect(isChapterEndYear(1984, 2025)).toBe(false);
  });

  it('should calculate chapter summary without lookahead', () => {
    const ch1 = getChapterById('chapter_1')!;
    const summary = calculateChapterSummary(ch1, mockInitialState);
    expect(summary.chapterReturn).toBeGreaterThan(0);
    expect(summary.bestEvidencedTradeCount).toBe(1);
  });
});

describe('Predictions and Confidence Calibration Engine', () => {
  it('should evaluate annual prediction against actual returns correctly', () => {
    const pred: AnnualPrediction = {
      year: 1981,
      kospiDirection: 'UP',
      sp500Direction: 'UP',
      usdKrwDirection: 'UNKNOWN',
      confidence: 80,
      rationale: '물가 안정세 기대',
      createdAtDecisionDate: '1980-12-31',
      locked: true,
    };

    const evalResult = evaluateAnnualPrediction(pred, 0.10, 0.12, 0.0);
    expect(evalResult.kospiCorrect).toBe(true);
    expect(evalResult.sp500Correct).toBe(true);
    expect(evalResult.accuracyRate).toBe(1.0);
    expect(evalResult.isOverconfident).toBe(false);
  });

  it('should flag overconfidence when confidence is high but guess is wrong', () => {
    const pred: AnnualPrediction = {
      year: 1981,
      kospiDirection: 'DOWN',
      sp500Direction: 'DOWN',
      usdKrwDirection: 'UNKNOWN',
      confidence: 90,
      rationale: '금리 충격 예상',
      createdAtDecisionDate: '1980-12-31',
      locked: true,
    };

    const evalResult = evaluateAnnualPrediction(pred, 0.15, 0.20, 0.0);
    expect(evalResult.kospiCorrect).toBe(false);
    expect(evalResult.sp500Correct).toBe(false);
    expect(evalResult.accuracyRate).toBe(0);
    expect(evalResult.isOverconfident).toBe(true);
  });

  it('should calculate cumulative calibration metrics', () => {
    const predictions: Record<number, AnnualPrediction> = {
      1981: {
        year: 1981,
        kospiDirection: 'UP',
        sp500Direction: 'UP',
        usdKrwDirection: 'UNKNOWN',
        confidence: 70,
        createdAtDecisionDate: '1980-12-31',
        locked: true,
      },
    };

    const calib = calculateCumulativeCalibrationMetrics(predictions, mockInitialState.history);
    expect(calib.totalPredictionsCount).toBe(1);
    expect(calib.directionAccuracyRate).toBe(100);
    expect(calib.calibrationScore).toBeGreaterThan(60);
  });
});

describe('Process-Oriented Achievements Engine', () => {
  it('should define 10 process achievements', () => {
    expect(PROCESS_ACHIEVEMENTS.length).toBe(10);
  });

  it('should unlock first_evidence_trade when trade has linkedNewsId or thesis', () => {
    const newlyUnlocked = evaluateAchievements(mockInitialState);
    expect(newlyUnlocked).toContain('first_evidence_trade');
  });

  it('should unlock benchmark_reviewer when user completed at least 1 year', () => {
    const newlyUnlocked = evaluateAchievements(mockInitialState);
    expect(newlyUnlocked).toContain('benchmark_reviewer');
  });
});

describe('Company Encyclopedia Engine', () => {
  it('should create encyclopedia entry for listed company without pre-IPO placeholders', () => {
    const entry = createEncyclopediaEntryForListing('KR_005930', 1981);
    expect(entry).not.toBeNull();
    expect(entry?.canonicalCompanyId).toBe('KR_005930');
    expect(entry?.market).toBe('KR');
    expect(entry?.unlockedYear).toBe(1981);
  });

  it('should sync investment history with encyclopedia entries', () => {
    const entry = createEncyclopediaEntryForListing('KR_005930', 1981)!;
    const stateWithEntry: StockGameState = {
      ...mockInitialState,
      companyEncyclopedia: { 'KR_005930': entry },
    };

    const synced = syncEncyclopediaWithState(stateWithEntry);
    expect(synced['KR_005930'].isInvested).toBe(true);
    expect(synced['KR_005930'].firstInvestmentYear).toBe(1981);
  });
});

describe('3-Axis Final Evaluation Engine', () => {
  it('should compute scores and persona profiles across Performance, Process, and Learning axes', () => {
    const metrics = calculateFinalMetrics(mockInitialState);
    const threeAxes = evaluateThreeAxes(mockInitialState, metrics);

    expect(threeAxes.performanceAxis.score).toBeGreaterThanOrEqual(10);
    expect(threeAxes.performanceAxis.score).toBeLessThanOrEqual(100);
    expect(threeAxes.processAxis.score).toBeGreaterThanOrEqual(10);
    expect(threeAxes.processAxis.score).toBeLessThanOrEqual(100);
    expect(threeAxes.learningAxis.score).toBeGreaterThanOrEqual(10);
    expect(threeAxes.learningAxis.score).toBeLessThanOrEqual(100);

    expect(threeAxes.performanceAxis.personaTitle).toBeTruthy();
    expect(threeAxes.processAxis.personaTitle).toBeTruthy();
    expect(threeAxes.learningAxis.personaTitle).toBeTruthy();
    expect(threeAxes.overallBadge).toBeTruthy();
  });
});
