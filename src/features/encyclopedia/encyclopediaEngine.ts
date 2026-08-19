import type { CompanyEncyclopediaEntry } from '../../types/encyclopedia';
import type { StockGameState } from '../../types/stockGame';
import { STOCKS_BY_ID } from '../../engine/returnEngine';
import { getListingEventByCompanyId } from '../../engine/universeEngine';

export function createEncyclopediaEntryForListing(
  canonicalCompanyId: string,
  unlockedYear: number
): CompanyEncyclopediaEntry | null {
  const stock = STOCKS_BY_ID[canonicalCompanyId];
  if (!stock) return null;

  const listingEvent = getListingEventByCompanyId(canonicalCompanyId);

  return {
    canonicalCompanyId,
    unlockedAt: new Date().toISOString(),
    unlockedYear,
    companyNameAtListing: listingEvent?.companyNameAsOfDate || stock.historicalNames[0] || stock.nameKo,
    tickerAtListing: listingEvent?.tickerAsOfDate || stock.ticker,
    currentName: stock.nameKo,
    market: stock.market,
    listingDate: stock.listingDate || `${unlockedYear}-01-01`,
    listingType: listingEvent?.eventType || '신규 상장(IPO)',
    businessAtListing: listingEvent?.businessSummaryAsOfDate || `${stock.nameKo}의 정규 주식시장 거래 개시`,
    listingNewsIds: listingEvent?.relatedNewsIds || [],
    firstInvestmentYear: undefined,
    longestHoldingYears: undefined,
    newsReadCount: 0,
    isInvested: false
  };
}

export function syncEncyclopediaWithState(state: StockGameState): Record<string, CompanyEncyclopediaEntry> {
  const encyclopedia = { ...(state.companyEncyclopedia || {}) };

  // For every holding or past holding, update isInvested / firstInvestmentYear
  state.tradeLogs.forEach(trade => {
    const entry = encyclopedia[trade.canonicalId];
    if (entry) {
      entry.isInvested = true;
      if (!entry.firstInvestmentYear || trade.year < entry.firstInvestmentYear) {
        entry.firstInvestmentYear = trade.year;
      }
    }
  });

  return encyclopedia;
}
