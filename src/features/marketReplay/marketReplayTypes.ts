import type { RiskLevel, MonthlyReplayQuality, StockHolding } from '../../types/stockGame';
import type { HistoricalNewsItem } from '../../types/stockNews';

export type ReplayStatus =
  | 'IDLE'
  | 'PREPARING'
  | 'YEAR_INTRO'
  | 'PLAYING'
  | 'PAUSED'
  | 'NEWS_PAUSED'
  | 'CRISIS_PAUSED'
  | 'RESUMING'
  | 'YEAR_COMPLETE';

export type ReplaySpeed = 'CINEMATIC' | 'NORMAL' | 'FAST' | 'INSTANT';

export type MotionPreference = 'NORMAL' | 'REDUCED' | 'OFF';

export type AutoInvestReplayMode = 'ALL_YEARS' | 'CRISIS_ONLY' | 'SUMMARY_ONLY';

export interface ReplaySettings {
  speed: ReplaySpeed;
  showBenchmark: boolean;
  autoPauseOnCrisis: boolean;
  autoPauseOnMajorNews: boolean;
  motionPreference: MotionPreference;
  autoInvestMode: AutoInvestReplayMode;
}

export interface MonthlyPortfolioPoint {
  year: number;
  month: number; // 1 ~ 12
  date: string; // YYYY-MM-DD
  monthLabelKo: string; // e.g. "1월"

  // Wealth & Principal
  portfolioValueKRW: number;
  cashKRW: number;
  holdingsValueKRW: number;
  cumulativeContributionsKRW: number;
  investmentPnLKRW: number;
  investmentPnLPercent: number;

  // Performance & Drawdown
  monthlyReturn: number; // Return for this specific month (e.g. -0.042)
  ytdReturn: number; // Year-to-date return since start of year (e.g. -0.153)
  runningPeakKRW: number;
  drawdown: number; // e.g. -0.235 (-23.5%)
  lossFromPeakKRW: number;
  monthsUnderwater: number;
  isNewHigh: boolean;

  // Asset Allocations
  krWeight: number;
  usWeight: number;
  cashWeight: number;

  // Benchmark Race
  primaryBenchmarkValueKRW: number;
  primaryBenchmarkYtdReturn: number;
  kospiYtdReturn?: number;
  sp500YtdReturn?: number;

  // Risk & Events
  riskLevel: RiskLevel;
  newlyAvailableNews: HistoricalNewsItem[];
  isCrisisMonth: boolean;
  crisisEventId?: string;
  crisisTitleKo?: string;
}

export interface YearReplayData {
  year: number;
  quality: MonthlyReplayQuality;
  startTotalAssetsKRW: number;
  annualContributionKRW: number;
  cashBeforeReplayKRW: number;
  holdings?: Record<string, StockHolding>;
  points: MonthlyPortfolioPoint[];
  bestMonth: { month: number; returnRate: number };
  worstMonth: { month: number; returnRate: number };
  maxIntraYearDrawdown: number;
  maxMonthsUnderwater: number;
}
