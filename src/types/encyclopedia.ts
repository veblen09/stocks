/**
 * Company Encyclopedia (신규 상장 기업 도감) Types
 */

export interface CompanyEncyclopediaEntry {
  canonicalCompanyId: string;
  unlockedAt: string; // ISO timestamp
  unlockedYear: number;

  companyNameAtListing: string;
  tickerAtListing: string;
  currentName?: string;

  market: 'KR' | 'US';
  listingDate: string; // YYYY-MM-DD
  listingType: string;
  businessAtListing: string;

  listingNewsIds: string[];

  firstInvestmentYear?: number;
  longestHoldingYears?: number;
  newsReadCount: number;
  isInvested: boolean;
}
