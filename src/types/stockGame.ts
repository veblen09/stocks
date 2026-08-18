/**
 * Types and interfaces for "머니트랙: 45년 한·미 주식투자 실험실"
 */
import type { TradeRationale } from './stockNews';

export type MarketCode = 'KR' | 'US';
export type DataQualityType = 'TOTAL_RETURN' | 'ADJUSTED_PRICE' | 'PRICE_ONLY' | 'MISSING';
export type BenchmarkId = 'kospi' | 'sp500' | 'blend5050';

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

export type FxDataset = Record<string, number>;

export interface BenchmarkAnnualData {
  kospiReturn: number;
  sp500KRWReturn: number;
  blend5050Return: number;
  sp500USDReturn?: number;
}

export type BenchmarksDataset = Record<string, BenchmarkAnnualData>;

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

export interface YearlyPerformanceRecord {
  year: number;
  startTotalAssetsKRW: number;
  annualDepositKRW: number;
  endTotalAssetsKRW: number;
  annualReturn: number; // (endTotalAssets - startTotalAssets - deposit) / (startTotalAssets + deposit)
  twrGrowthFactor?: number; // 1 + annualReturn
  twrIndexLevel: number; // Compounded starting at 100
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
}

export interface StockGameState {
  version: '2.0.0';
  isGameStarted: boolean;
  isGameOver: boolean;
  settings: GameSettings;
  currentYear: number;
  cashKRW: number;
  holdings: Record<string, StockHolding>;
  history: YearlyPerformanceRecord[];
  tradeLogs: TradeLogItem[];
  activeAutoInvestRule: AutoInvestRule | null;
  savedAutoInvestRules: AutoInvestRule[];
  hasLegacyState: boolean;
  watchlist: string[]; // List of canonicalCompanyIds
  investmentNotes: Record<string, string>; // canonicalId -> user note
  tradeRationales: Record<string, TradeRationale>; // tradeId -> rationale
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
  benchmarkComparison: {
    kospiFinalValue: number;
    kospiTwrCAGR: number;
    kospiMDD: number;
    sp500FinalValue: number;
    sp500TwrCAGR: number;
    sp500MDD: number;
    blendFinalValue: number;
    blendTwrCAGR: number;
    blendMDD: number;
    alphaVsPrimaryCAGR?: number;
    valueDiffVsPrimaryKRW?: number;
    excessReturnVsPrimary?: number;
    excessValueVsPrimary?: number;
  };
  scoreAndPersona: {
    diversificationScore: number; // 0-100
    disciplineScore: number; // 0-100
    crisisResilienceScore: number; // 0-100
    costEfficiencyScore: number; // 0-100
    overallAlphaScore: number; // 0-100
    personaType: string;
    personaDescription: string;
    personaBadge: string;
  };
  newsDecisionAnalysis?: NewsDecisionAnalysis;
}
