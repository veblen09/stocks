/**
 * Investment Yearbook (나의 45년 투자 연감) Types
 */
import type { AnnualPrediction } from './prediction';

export interface InvestmentYearbookEntry {
  year: number;
  chapterId: string;
  chapterTitleKo: string;

  majorDecisionSummary?: string;
  linkedNewsIds: string[];
  thesis?: string;

  prediction?: AnnualPrediction;
  predictionResultSummary?: string;

  portfolioReturn: number;
  benchmarkReturn: number;
  portfolioValueKRW: number;

  mainLearning?: string;
  confidenceReflection?: string;
}

export interface YearbookHighlights {
  bestEvidencedTradeYear?: number;
  mostOverconfidentYear?: number;
  mostFilingsConsultedYear?: number;
  highestCostYear?: number;
  bestDiversifiedYear?: number;
  highestConcentrationYear?: number;
  longestPrincipleMaintained?: string;
  biggestCrisisSurvivingYear?: number;
  largestAlphaYear?: number;
}
