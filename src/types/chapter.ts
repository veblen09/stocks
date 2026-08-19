/**
 * Historical Chapter Types (9 Chapters across 45 years)
 */
import type { ChapterRiskMission, ChapterRiskMissionResult } from './stockGame';

export interface ChapterGoal {
  id: string;
  titleKo: string;
  descriptionKo: string;
  targetType: 'ASSET_ALLOCATION' | 'MAX_WEIGHT_CAP' | 'COST_SAVING' | 'FILINGS_COUNT' | 'THESIS_COUNT' | 'REBALANCE_DISCIPLINE';
  targetValue: number;
}

export interface ChapterStartContext {
  knownAsOf: string;
  descriptionKo: string;
  keyObservationVariables: {
    name: string;
    description: string;
  }[];
}

export interface ChapterRetrospective {
  revealedAfterCompletion: true;
  descriptionKo: string;
  majorEvents: {
    year: number;
    titleKo: string;
    summaryKo: string;
  }[];
}

export interface HistoricalChapter {
  id: string;
  chapterNumber: number;
  startYear: number;
  endYear: number;
  titleKo: string;
  eraNameKo: string;
  
  // Cleanly separated context without future spoilers
  startContext: ChapterStartContext;
  retrospective: ChapterRetrospective;

  // Compatibility aliases
  descriptionKo: string;
  historicalContext: string;
  keyObservationVariables: {
    name: string;
    description: string;
  }[];

  suggestedGoals: ChapterGoal[];
  suggestedRiskMissions: ChapterRiskMission[];
}

export interface ChapterSummaryData {
  chapter: HistoricalChapter;
  startYear: number;
  endYear: number;
  startPortfolioValueKRW: number;
  endPortfolioValueKRW: number;
  chapterReturn: number;
  chapterTWR: number;
  chapterMDD: number;
  totalFeesPaidKRW: number;
  fxContributionRate: number;
  bestPerformingStock?: { canonicalId: string; nameKo: string; returnRate: number };
  worstPerformingStock?: { canonicalId: string; nameKo: string; returnRate: number };
  bestEvidencedTradeCount: number;
  unlockedCompanyCount: number;
  earnedAchievementIds: string[];
  goalCompleted: boolean;
  userGoal?: ChapterGoal;
  riskMissionResults: ChapterRiskMissionResult[];
  survived: boolean;
}
