/**
 * Types for Dynamic Tradable Universe, Listing Events & Mosaic View
 * (Sections 49-81 Requirements)
 */

export type ListingEventType =
  | 'IPO'
  | 'DIRECT_LISTING'
  | 'SPINOFF_LISTING'
  | 'RELISTING'
  | 'MERGER_LISTING'
  | 'EXCHANGE_TRANSFER';

export type TradabilityStatus =
  | 'HIDDEN_PRE_LISTING'
  | 'NEWLY_LISTED'
  | 'TRADABLE'
  | 'SUSPENDED'
  | 'SELL_ONLY'
  | 'DELISTED'
  | 'MERGED'
  | 'SPUN_OFF';

export type MosaicViewMode =
  | 'EXPLORE'               // 59.1 종목 탐색 모드 (동일 크기 타일)
  | 'TARGET_ALLOCATION'     // 59.2 목표배분 모드 (설정된 목표비중 시각화)
  | 'HOLDINGS_WEIGHT'       // 59.3 실제 보유비중 모드 (현재 보유비중 시각화)
  | 'YEAR_END_PERFORMANCE'; // 59.4 연말 성과 모드 (연말 결산 이후 상승/하락)

export interface ListingEvent {
  id: string;
  canonicalCompanyId: string;
  eventType: ListingEventType;
  listingDate?: string;
  firstTradingDate: string;
  datePrecision: 'DAY' | 'MONTH' | 'YEAR';
  companyNameAsOfDate: string;
  tickerAsOfDate: string;
  exchangeAsOfDate: string;
  sectorAsOfDate: string;
  businessSummaryAsOfDate: string;
  officialAnnouncementTitle?: string;
  officialAnnouncementUrl?: string;
  relatedNewsIds: string[];
  firstValidPriceDate?: string;
  firstValidPrice?: number;
  ipoOfferingPrice?: number; // 참고용 공모가
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  isTradableImmediately: boolean;
}

export interface HistoricalStockDefinition {
  canonicalCompanyId: string;
  currentTicker: string;
  currentName: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
  listingDate?: string;
  firstTradingDate: string;
  firstValidPriceDate?: string;
  delistingDate?: string;
  nameHistory: Array<{
    validFrom: string;
    validTo?: string;
    name: string;
    ticker?: string;
  }>;
  sectorHistory: Array<{
    validFrom: string;
    validTo?: string;
    sector: string;
  }>;
  listingEventId?: string;
  listingNewsIds: string[];
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  description: string;
}

export interface UniverseState {
  currentSimulationDate: string;
  unlockedCompanyIds: string[];
  processedListingEventIds: string[];
  pendingListingEventIds: string[];
  acknowledgedListingEventIds: string[];
}

export interface DraftAllocationState {
  targetWeights: Record<string, number>; // canonicalCompanyId -> weight (0.00 ~ 1.00)
  cashWeight: number; // 1.00 - sum(targetWeights)
  lastEditedCompanyId?: string;
  updatedAt: string;
}

export interface TradableStockItem {
  canonicalId: string;
  ticker: string;
  nameKo: string;
  nameEn: string;
  market: 'KR' | 'US';
  sector: string;
  currency: 'KRW' | 'USD';
  listingDate?: string;
  firstTradingDate: string;
  isNewlyListed: boolean;
  listingEvent?: ListingEvent;
  newsCount: number;
  filingsCount: number;
  dataQuality: string;
  hasPrice: boolean;
}
