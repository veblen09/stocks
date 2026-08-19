/**
 * TypeScript Data Models for Historical News & Investment Information System (1980~2025)
 */

export type NewsScope =
  | 'GLOBAL_MACRO'
  | 'KOREA_MACRO'
  | 'US_MACRO'
  | 'MARKET'
  | 'SECTOR'
  | 'COMPANY';

export type NewsMarket = 'KR' | 'US' | 'GLOBAL';

export type NewsSourceType =
  | 'GOVERNMENT'
  | 'REGULATOR'
  | 'EXCHANGE'
  | 'FILING'
  | 'COMPANY_IR'
  | 'CONTEMPORARY_NEWS'
  | 'RETROSPECTIVE_SOURCE';

export type EvidenceLevel =
  | 'PRIMARY_SOURCE'
  | 'CONTEMPORARY_REPORT'
  | 'VERIFIED_RETROSPECTIVE'
  | 'LIMITED';

export type AffectedChannel =
  | 'DEMAND'
  | 'REVENUE'
  | 'COST'
  | 'INTEREST_RATE'
  | 'EXCHANGE_RATE'
  | 'REGULATION'
  | 'SUPPLY_CHAIN'
  | 'CAPITAL_COST'
  | 'COMPETITION'
  | 'MANAGEMENT'
  | 'VALUATION';

export type DatePrecision = 'DAY' | 'MONTH' | 'YEAR';

export interface NeutralNewsAnalysis {
  verifiedFacts: string; // 당시 확인된 사실
  impactChannels: AffectedChannel[]; // 영향 경로
  positiveInterpretation: string; // 긍정적으로 해석할 수 있는 점
  negativeInterpretation: string; // 부정적으로 해석할 수 있는 점
  unknownAtTheTime: string; // 당시에는 알 수 없었던 점
}

export type NewsValidationStatus =
  | 'VERIFIED'
  | 'REVIEW_REQUIRED'
  | 'SOURCE_MISMATCH'
  | 'DATE_UNCERTAIN'
  | 'COUNTRY_MISMATCH'
  | 'UNVERIFIED';

export interface NewsValidation {
  validationStatus: NewsValidationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  sourceDocumentUrl?: string;
  sourceDocumentTitle?: string;
  validationNotes?: string;
}

export type UserFacingSourceTier = '공식 원자료' | '당시 언론보도' | '후대 역사적 정리';

export function getUserFacingSourceTier(level: EvidenceLevel, sourceType?: NewsSourceType): UserFacingSourceTier {
  if (level === 'PRIMARY_SOURCE' || sourceType === 'FILING' || sourceType === 'GOVERNMENT' || sourceType === 'REGULATOR' || sourceType === 'EXCHANGE') {
    return '공식 원자료';
  }
  if (level === 'VERIFIED_RETROSPECTIVE' || sourceType === 'RETROSPECTIVE_SOURCE') {
    return '후대 역사적 정리';
  }
  return '당시 언론보도';
}

export interface HistoricalNewsItem {
  id: string;
  scope: NewsScope;
  market?: NewsMarket;
  canonicalCompanyIds: string[];
  relatedTickers: string[];
  relatedSectors: string[];

  eventDate?: string;
  publishedAt: string; // YYYY-MM-DD or YYYY-MM or YYYY
  availableFrom: string; // Real availability date YYYY-MM-DD
  datePrecision: DatePrecision;

  originalTitle: string;
  titleKo: string;
  summaryKo: string; // 2~4 factual sentences in Korean

  sourceName: string;
  sourceUrl?: string;
  sourceType: NewsSourceType;
  evidenceLevel: EvidenceLevel;
  validation?: NewsValidation;

  categories: string[];
  affectedChannels: AffectedChannel[];
  neutralAnalysis: NeutralNewsAnalysis;

  importanceScore: number; // 1 to 10
  language: string;

  isRetrospective: boolean;
  fullTextStored: boolean;
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'MISSING';
  retrievedAt: string;
}


export interface CompanyAlias {
  canonicalCompanyId: string;
  validFrom: string;
  validTo?: string;
  historicalName: string;
  ticker?: string;
  market: 'KR' | 'US';
  relationship:
    | 'SAME_ENTITY'
    | 'RENAMED'
    | 'TICKER_CHANGED'
    | 'MERGER_PREDECESSOR'
    | 'SPINOFF'
    | 'UNCERTAIN';
  contemporaryBusinessKo: string;
  continuityNotes?: string;
}

export interface FinancialReportItem {
  canonicalCompanyId: string;
  fiscalYear: number;
  reportDate: string; // Publication date
  revenueKRW?: number;
  operatingIncomeKRW?: number;
  netIncomeKRW?: number;
  eps?: number;
  dividendPerShare?: number;
  currency: 'KRW' | 'USD';
  filingType: 'ANNUAL' | 'QUARTERLY' | 'AUDITED';
  sourceName: string;
  sourceUrl?: string;
  notes?: string;
}

export interface TradeRationale {
  tradeId: string;
  canonicalCompanyId: string;
  decisionYear: number;
  decisionDate: string;
  linkedNewsIds: string[];
  thesis: string;
  expectedOpportunity?: string;
  expectedRisk?: string;
  targetHoldingPeriod?: string;
  exitCondition?: string;
  timestamp: number;
}

export interface CompanyOverviewAtYear {
  canonicalCompanyId: string;
  currentYear: number;
  nameKo: string;
  ticker: string;
  market: 'KR' | 'US';
  sector: string;
  isListed: boolean;
  firstValidYear: number;
  listingDate: string;
  contemporaryBusiness: string;
  historicalAliases: CompanyAlias[];
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'MISSING';
  coverageStatus: 'SUFFICIENT' | 'PARTIAL' | 'OFFICIAL_ONLY' | 'NEWS_LIMITED' | 'NO_VERIFIED_DATA';
}

export interface CompanyComparisonItem {
  canonicalCompanyId: string;
  currentYear: number;
  nameKo: string;
  ticker: string;
  market: 'KR' | 'US';
  sector: string;
  isListed: boolean;
  listingDate: string;
  contemporaryBusiness: string;
  recentNewsCount: number;
  recentNews: HistoricalNewsItem[];
  last1YrReturn: number | null;
  past3YrCAGR: number | null;
  historicalMDD: number | null;
  dataQuality: string;
  coverageStatus: string;
  riskFactors: string[];
}

