import type { TradeRationale } from './stockNews';
import type { AnnualPrediction } from './prediction';
import type { CompanyEncyclopediaEntry } from './encyclopedia';
import type { InvestmentYearbookEntry } from './yearbook';
import type { SoundCategorySettings } from './saveSlot';

export type MarketCode = 'KR' | 'US';

export type DataQualityType = 'TOTAL_RETURN' | 'ADJUSTED_PRICE' | 'PRICE_ONLY' | 'MISSING';
export type BenchmarkId = 'kospi' | 'sp500' | 'blend5050';

export type RiskLevel = 'NORMAL' | 'CAUTION' | 'WARNING' | 'CRISIS' | 'EXTREME';
export type PlayMode = 'PRACTICE' | 'REAL';
export type MonthlyReplaySpeed = 'NORMAL' | 'FAST' | 'INSTANT';
export type MonthlyReplayQuality = 'VERIFIED_MONTHLY' | 'PARTIAL_MONTHLY' | 'ANNUAL_ONLY';
export type PerceivedRisk = 'LOW' | 'NORMAL' | 'HIGH' | 'VERY_HIGH';

export interface Stock {
  canonicalId: string;
  market: MarketCode;
  ticker: string;
  sourceTicker: string;
  nameKo: string;
  nameEn: string;
  historicalNames: string[];
  sector: string;
  currency: 'KRW' | 'USD';
  listingDate: string;
  delistingDate?: string;
  firstValidYear: number;
  lastValidYear: number;
  dataQuality: DataQualityType;
  source: string;
  description: string;
}

export interface AnnualPricePoint {
  priceLocal: number | null;
  annualReturnLocal: number | null;
}

export type StockPrices = Record<string, AnnualPricePoint>;

export interface MonthlyPricePoint {
  year: number;
  month: number;
  priceLocal: number;
  date: string;
}

export type MonthlyStockPrices = Record<string, Record<string, MonthlyPricePoint>>;

export type FxDataset = Record<string, number>;

export interface BenchmarkDetail {
  id: BenchmarkId;
  nameKo: string;
  nameEn: string;
  currency: string;
  description: string;
  prices?: Record<string, number>;
  annualReturns: Record<string, number>;
  annualReturnsUSD?: Record<string, number>;
}

export type BenchmarksDataset = Record<string, BenchmarkDetail>;

export interface BenchmarkAnnualData {
  kospiReturn: number;
  sp500KRWReturn: number;
  blend5050Return: number;
  sp500USDReturn?: number;
}

export interface MarketEvent {
  year: number;
  titleKo: string;
  descriptionKo: string;
  kospiSummary?: string;
  usSummary?: string;
}

export interface StockHolding {
  canonicalId: string;
  shares: number;
  totalInvestedKRW: number;
  averageCostKRW: number;
  currentValueKRW: number;
  currentWeight: number; // 0 to 1
  unrealizedPnlKRW: number;
  unrealizedPnlPercent: number;
}

export interface TradeOrder {
  canonicalId: string;
  action: 'BUY' | 'SELL' | 'SET_TARGET_WEIGHT';
  targetWeight?: number; // 0 to 1
  amountKRW?: number;
  shares?: number;
}

export interface TradeLogItem {
  year: number;
  canonicalId: string;
  stockNameKo: string;
  action: 'BUY' | 'SELL' | 'REBALANCE';
  shares: number;
  priceLocal: number;
  fxRate: number;
  priceKRW: number;
  totalAmountKRW: number;
  feeKRW: number;
  timestamp: number;
  rationaleId?: string;
  linkedNewsIds?: string[];
  thesis?: string;
}

export interface AutoInvestTarget {
  canonicalId: string;
  weight: number; // 0 to 1
}

export interface CrisisRule {
  action: 'HOLD' | 'REBALANCE' | 'REBALANCE_TO_TARGET' | 'RAISE_CASH';
  targetCashWeight?: number; // e.g. 0.2, 0.3, 0.4
}

export interface AutoInvestRule {
  id: string;
  name: string;
  durationYears: 5 | 10 | 'ALL';
  targetAllocations: AutoInvestTarget[];
  annualContributionKRW: number;
  rebalanceMode: 'ANNUAL' | 'BUY_ONLY' | 'THRESHOLD_5PCT' | 'NONE';
  preIpoMode: 'HOLD_CASH' | 'PRO_RATA_ACTIVE';
  advancedFilter?: 'TOP_1YR_MOMENTUM' | 'TOP_3YR_CAGR' | 'LOW_VOLATILITY' | 'KR_ONLY' | 'US_ONLY' | 'EQUAL_WEIGHT' | 'NONE';
  maxSingleStockWeight?: number;
  crisisRule?: CrisisRule;
}

export interface HoldingsSnapshotItem {
  canonicalId: string;
  nameKo: string;
  market: MarketCode;
  shares: number;
  valueKRW: number;
  weight: number;
  annualReturn: number | null;
}

export interface DrawdownPoint {
  year: number;
  peakTwrIndex: number;
  currentTwrIndex: number;
  drawdown: number; // e.g. -0.347 (-34.7%)
  underwaterYears: number;
  peakYear: number;
}

export interface RecoveryMetrics {
  maxDrawdown: number;
  drawdownStartYear?: number;
  troughYear?: number;
  recoveryYear?: number;
  underwaterDurationYears?: number;
}

export interface HistoricalCrisisEvent {
  id: string;
  year: number;
  month: number;
  eventDate: string;
  availableFrom: string;
  titleKo: string;
  subtitleKo: string;
  affectedMarkets: ('KR' | 'US' | 'GLOBAL')[];
  triggerCondition: {
    type: 'DATE' | 'DRAWDOWN';
    month?: number;
    threshold?: number;
  };
  situationSummaryKo: string[];
  knownInformationNewsIds: string[];
  allowedActions: ('HOLD' | 'REBALANCE' | 'RAISE_CASH' | 'CUSTOM')[];
  dataQuality: 'HIGH' | 'MEDIUM' | 'LIMITED';
}

export type CrisisDecisionAction = 'HOLD' | 'REBALANCE' | 'RAISE_CASH' | 'CUSTOM';

export interface CrisisDecisionRecord {
  crisisId: string;
  year: number;
  month: number;
  titleKo: string;
  chosenAction: CrisisDecisionAction;
  targetCashWeight?: number;
  portfolioValueAtCrisisKRW: number;
  drawdownAtCrisis: number;
  tradingFeePaidKRW: number;
  allocationBefore: { krWeight: number; usWeight: number; cashWeight: number };
  allocationAfter: { krWeight: number; usWeight: number; cashWeight: number };
  rationale?: string;
  timestamp: number;
}

export interface ChapterRiskMission {
  id: string;
  titleKo: string;
  descriptionKo: string;
  missionType: 'MAX_DRAWDOWN' | 'MAX_STOCK_WEIGHT' | 'MIN_CASH_BUFFER' | 'MAX_FEES_RATIO' | 'MIN_SECTOR_COUNT' | 'RECORD_CRISIS_THESIS';
  targetValue: number;
}

export interface ChapterRiskMissionResult {
  chapterId: string;
  missionId: string;
  passed: boolean;
  actualValue: number;
  targetValue: number;
  label: string;
}

export interface YearlyPerformanceRecord {
  year: number;
  startTotalAssetsKRW: number;
  annualDepositKRW: number;
  endTotalAssetsKRW: number;
  annualReturn: number; // (endTotalAssets - startTotalAssets - deposit) / (startTotalAssets + deposit)
  twrGrowthFactor?: number; // 1 + annualReturn
  twrIndexLevel: number; // Compounded starting at 100
  runningPeakTwrIndex?: number;
  currentDrawdown?: number;
  benchmarkReturns: {
    kospi: number;
    sp500KRW: number;
    sp500USD?: number;
    blend5050: number;
  };
  benchmarkLevels?: {
    kospiValue: number;
    sp500Value: number;
    blend5050Value: number;
  };
  benchmarkTwrLevels?: {
    kospiTwr: number;
    sp500Twr: number;
    blend5050Twr: number;
  };
  holdingsSnapshot: HoldingsSnapshotItem[];
  cashKRW: number;
  fxRate: number;
  totalFeesPaidKRW: number;
  fxContributionPnlKRW: number;
  stockReturnContributionKRW?: number;
  bestPerformer?: { canonicalId: string; nameKo: string; returnPercent: number } | null;
  worstPerformer?: { canonicalId: string; nameKo: string; returnPercent: number } | null;
  marketBriefing: MarketEvent;
  retroNewsUnlocked?: boolean;
  perceivedRisk?: PerceivedRisk;
  crisisDecision?: CrisisDecisionRecord;
  monthlyReplayQuality?: MonthlyReplayQuality;
}

export interface GameSettings {
  nickname: string;
  startYear: number; // 1980..2024
  endYear: number; // 1985..2025 (minimum 5 years duration)
  initialCashKRW: number; // default 10,000,000
  annualContributionKRW: number; // default 3,000,000
  allowFractionalShares: boolean; // default true
  feeRate: number; // default 0.001 (0.1%)
  fxFeeRate: number; // default 0.0
  includeFxEffect: boolean; // default true
  primaryBenchmark: BenchmarkId;
  startMode: 'MANUAL' | 'AUTO_RULE';
  playMode?: PlayMode; // 'PRACTICE' | 'REAL'
  monthlyReplaySpeed?: MonthlyReplaySpeed; // 'NORMAL' | 'FAST' | 'INSTANT'
  showRealPurchasingPower?: boolean; // default true
  universeMode?: 'CLASSIC_50' | 'HISTORICAL_SURVIVOR'; // default 'CLASSIC_50'
  autoInvestCrisisRule?: CrisisRule;
}

export interface StockGameState {
  version: string;
  schemaVersion: number;
  isGameStarted: boolean;
  isGameOver: boolean;
  settings: GameSettings;
  currentYear: number; // Current simulation year (starts at startYear)
  cashKRW: number;
  holdings: Record<string, StockHolding>; // canonicalId -> StockHolding
  history: YearlyPerformanceRecord[];
  tradeLogs: TradeLogItem[];
  activeAutoInvestRule: AutoInvestRule | null;
  savedAutoInvestRules: AutoInvestRule[];
  hasLegacyState: boolean;
  watchlist: string[]; // List of canonicalCompanyIds
  investmentNotes: Record<string, string>; // canonicalId -> user note
  tradeRationales: Record<string, TradeRationale>; // tradeId -> rationale
  draftTargetWeights: Record<string, number>; // canonicalId -> targetWeight (0 to 1)
  processedListingEventIds: string[]; // Set of acknowledged listing events
  pendingListingEventId: string | null; // Currently triggered listing checkpoint
  autoInvestPauseOnListing: boolean; // default true

  // Enhanced Risk & Survival State
  playMode: PlayMode;
  monthlyReplaySpeed: MonthlyReplaySpeed;
  showRealPurchasingPower: boolean;
  universeMode: 'CLASSIC_50' | 'HISTORICAL_SURVIVOR';
  perceivedRiskByYear: Record<number, PerceivedRisk>;
  activeCrisisEvent: HistoricalCrisisEvent | null;
  crisisDecisionHistory: CrisisDecisionRecord[];
  selectedRiskMissions: Record<string, string[]>; // chapterId -> missionIds
  chapterRiskMissionResults: Record<string, ChapterRiskMissionResult[]>;
  retryCount: number; // For practice mode undo tracking

  // 9 Historical Chapters
  currentChapterId?: string;
  completedChapterIds: string[];
  selectedChapterGoals: Record<string, string>; // chapterId -> goalId

  // Predictions & Confidence Calibration
  annualPredictions: Record<number, AnnualPrediction>;

  // Process-Oriented Achievements
  unlockedAchievementIds: string[];

  // Company Encyclopedia (Unlocked on Listing)
  companyEncyclopedia: Record<string, CompanyEncyclopediaEntry>;

  // Investment Yearbook
  yearbookEntries: InvestmentYearbookEntry[];

  // Focus Modes
  selectedMosaicMode: 'ALL' | 'MY_DESK' | 'ALLOCATION_FOCUS';
  mobileActiveTab: 'MARKET' | 'PORTFOLIO' | 'NEWS' | 'RISK' | 'PROGRESS';

  // Granular Sound Settings
  soundCategorySettings: SoundCategorySettings;
  activeCampaignId?: string;
}

export interface NewsDecisionAnalysis {
  macroNewsConsulted: number;
  companyNewsConsulted: number;
  filingsConsulted: number;
  tradesWithRationale: number;
  tradesWithoutRationale: number;
  confirmationBiasRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  feedbackSummaryKo: string[];
}

export interface FinalMetrics {
  initialCapital?: number;
  totalDeposits?: number;
  totalInvestedPrincipal: number;
  finalPortfolioValue: number;
  totalNetProfitKRW: number;
  simpleProfitRate: number;
  twr: number; // Cumulative TWR %
  twrCAGR: number; // Annualized TWR %
  mwrIRR: number; // Money-weighted IRR %
  annualVolatility: number;
  maxDrawdownMDD: number; // From pure TWR curve
  drawdownPoints: DrawdownPoint[];
  recoveryMetrics: RecoveryMetrics;
  lossFromPeakKRW: number;
  allTimePeakPortfolioValueKRW: number;
  cpiAdjustedFinalValueKRW?: number;
  cpiAdjustedTotalProfitKRW?: number;
  bestYear: { year: number; returnRate: number };
  worstYear: { year: number; returnRate: number };
  winYearRatio: number; // 0 to 1
  finalAllocation: {
    krWeight: number;
    usWeight: number;
    cashWeight: number;
    sectorWeights?: Record<string, number>;
    maxStockWeight: { canonicalId?: string; nameKo: string; weight: number };
  };
  totalTradesCount: number;
  totalTradingFeesKRW: number;
  totalFxGainLossKRW: number;
  crisisDecisionHistory: CrisisDecisionRecord[];
  chapterSurvivalCount: {
    survived: number;
    total: number;
    safestEra: string;
    riskiestEra: string;
  };
  benchmarkComparison: {
    kospiFinalValue: number;
    kospiTwrCAGR: number;
    kospiMDD: number;
    kospiTotalReturn: number;
    kospiTwrIndexEnd: number;
    sp500FinalValue: number;
    sp500TwrCAGR: number;
    sp500MDD: number;
    sp500TotalReturn: number;
    sp500TwrIndexEnd: number;
    blendFinalValue: number;
    blendTwrCAGR: number;
    blendMDD: number;
    blendTotalReturn: number;
    blendTwrIndexEnd: number;
    alphaVsPrimaryCAGR?: number;
    valueDiffVsPrimaryKRW?: number;
    excessReturnVsPrimary?: number;
    excessValueVsPrimary?: number;
    kospiSimHistory?: { year: number; returnRate: number; totalAssetsKRW: number; twrIndexLevel: number }[];
    sp500SimHistory?: { year: number; returnRate: number; totalAssetsKRW: number; twrIndexLevel: number }[];
    blendSimHistory?: { year: number; returnRate: number; totalAssetsKRW: number; twrIndexLevel: number }[];
  };
  scoreAndPersona: {
    diversificationScore: number; // 0-100
    disciplineScore: number; // 0-100
    crisisResilienceScore: number; // 0-100
    costEfficiencyScore: number; // 0-100
    overallAlphaScore: number; // 0-100
    riskManagementScore: number; // 0-100
    personaType: string;
    personaDescription: string;
    personaBadge: string;
  };
  newsDecisionAnalysis?: NewsDecisionAnalysis;
}
