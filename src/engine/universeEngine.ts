import type {
  ListingEvent,
  HistoricalStockDefinition,
  TradableStockItem,
} from '../types/stockUniverse';
import rawListingEvents from '../data/universe/listing-events.json';
import rawHistoricalStocks from '../data/universe/historical-stocks.json';
import { STOCKS_BY_ID } from './returnEngine';
import { getAvailableNewsForYear } from './newsEngine';

export const LISTING_EVENTS: ListingEvent[] = rawListingEvents as unknown as ListingEvent[];
export const LISTING_EVENTS_BY_ID: Record<string, ListingEvent> = {};
export const LISTING_EVENTS_BY_COMPANY: Record<string, ListingEvent> = {};

LISTING_EVENTS.forEach(ev => {
  LISTING_EVENTS_BY_ID[ev.id] = ev;
  LISTING_EVENTS_BY_COMPANY[ev.canonicalCompanyId] = ev;
});

export const HISTORICAL_STOCKS: HistoricalStockDefinition[] = rawHistoricalStocks as unknown as HistoricalStockDefinition[];
export const HISTORICAL_STOCKS_BY_ID: Record<string, HistoricalStockDefinition> = {};

HISTORICAL_STOCKS.forEach(s => {
  HISTORICAL_STOCKS_BY_ID[s.canonicalCompanyId] = s;
});

/**
 * Returns true if the company is actively listed and tradable as of the specified date or year.
 * Section 50: firstTradingDate <= asOfDate && (delistingDate == null || asOfDate < delistingDate)
 */
export function isStockTradableOnDate(canonicalCompanyId: string, asOfDateOrYear: string | number): boolean {
  const stock = HISTORICAL_STOCKS_BY_ID[canonicalCompanyId];
  if (!stock) return false;

  let targetDate = '';
  if (typeof asOfDateOrYear === 'number') {
    // If year number Y is passed, it represents the investment decision cutoff date: (Y-1)-12-31 or 1980-01-01 for 1980
    targetDate = asOfDateOrYear <= 1980 ? '1980-01-01' : `${asOfDateOrYear - 1}-12-31`;
  } else {
    targetDate = asOfDateOrYear;
  }

  const isAfterListing = stock.firstTradingDate <= targetDate;
  const isBeforeDelisting = !stock.delistingDate || targetDate < stock.delistingDate;

  return isAfterListing && isBeforeDelisting;
}

/**
 * Returns true if the stock was newly listed during the given year Y.
 */
export function isNewlyListedInYear(canonicalCompanyId: string, year: number): boolean {
  const ev = LISTING_EVENTS_BY_COMPANY[canonicalCompanyId];
  if (!ev) return false;
  const yStr = year.toString();
  return ev.firstTradingDate.startsWith(yStr) || (ev.listingDate ? ev.listingDate.startsWith(yStr) : false);
}

/**
 * Returns all listing events occurring during year Y.
 */
export function getListingEventsForYear(year: number): ListingEvent[] {
  const yStr = year.toString();
  return LISTING_EVENTS.filter(ev => {
    return ev.firstTradingDate.startsWith(yStr) || (ev.listingDate ? ev.listingDate.startsWith(yStr) : false);
  }).sort((a, b) => a.firstTradingDate.localeCompare(b.firstTradingDate));
}

/**
 * Returns all stock definitions newly listed during year Y
 */
export function getNewlyListedStocksForYear(year: number): HistoricalStockDefinition[] {
  const yStr = year.toString();
  return HISTORICAL_STOCKS.filter(stk => {
    return stk.firstTradingDate && stk.firstTradingDate.startsWith(yStr);
  });
}

/**
 * Returns all stock definitions delisted during year Y
 */
export function getDelistedStocksForYear(year: number): HistoricalStockDefinition[] {
  const yStr = year.toString();
  return HISTORICAL_STOCKS.filter(stk => {
    return stk.delistingDate && stk.delistingDate.startsWith(yStr);
  });
}

/**
 * Returns the listing event for a specific company.
 */
export function getListingEventByCompanyId(canonicalCompanyId: string): ListingEvent | undefined {
  return LISTING_EVENTS_BY_COMPANY[canonicalCompanyId];
}

export interface GetTradableStocksOptions {
  asOfDate?: string;
  currentYear?: number;
  marketFilter?: 'ALL' | 'KR' | 'US' | 'HOLDING' | 'WATCHLIST';
  sectorFilter?: string;
  searchQuery?: string;
  watchlist?: string[];
  holdings?: Record<string, any>;
}

/**
 * Retrieves the dynamic list of tradable stocks for the current simulation point.
 * Strictly excludes any pre-IPO or unlisted companies from the array.
 * (Section 50 & 75)
 */
export function getTradableStocks(options: GetTradableStocksOptions = {}): TradableStockItem[] {
  const {
    asOfDate,
    currentYear = 2025,
    marketFilter = 'ALL',
    sectorFilter = 'ALL',
    searchQuery = '',
    watchlist = [],
    holdings = {},
  } = options;

  // Resolve target date for comparison (decision cutoff: 1980-01-01 for 1980, or (currentYear-1)-12-31)
  const targetDate = asOfDate || (currentYear <= 1980 ? '1980-01-01' : `${currentYear - 1}-12-31`);

  const tradableList: TradableStockItem[] = [];

  for (const hStock of HISTORICAL_STOCKS) {
    const cid = hStock.canonicalCompanyId;
    // Strict date gate: firstTradingDate <= targetDate
    if (hStock.firstTradingDate > targetDate) {
      continue; // Pre-IPO: completely skip and do not create item!
    }
    if (hStock.delistingDate && targetDate >= hStock.delistingDate) {
      continue; // Delisted
    }

    const baseStock = STOCKS_BY_ID[cid];
    const listingEv = LISTING_EVENTS_BY_COMPANY[cid];
    const isNew = isNewlyListedInYear(cid, currentYear);

    // Resolve name and sector as of targetDate
    let nameKo = baseStock ? baseStock.nameKo : hStock.currentName;
    let ticker = baseStock ? baseStock.ticker : hStock.currentTicker;
    let sector = baseStock ? baseStock.sector : '기타';

    if (hStock.nameHistory && hStock.nameHistory.length > 0) {
      const activeName = hStock.nameHistory
        .filter(n => n.validFrom <= targetDate && (!n.validTo || targetDate <= n.validTo))
        .pop();
      if (activeName) {
        nameKo = activeName.name;
        if (activeName.ticker) ticker = activeName.ticker;
      }
    }

    if (hStock.sectorHistory && hStock.sectorHistory.length > 0) {
      const activeSec = hStock.sectorHistory
        .filter(s => s.validFrom <= targetDate && (!s.validTo || targetDate <= s.validTo))
        .pop();
      if (activeSec) {
        sector = activeSec.sector;
      }
    }

    const availableNews = getAvailableNewsForYear(currentYear, { canonicalCompanyId: cid });
    const filingsCount = availableNews.filter(n => n.sourceType === 'FILING').length;

    const item: TradableStockItem = {
      canonicalId: cid,
      ticker,
      nameKo,
      nameEn: baseStock ? baseStock.nameEn : hStock.currentName,
      market: hStock.market,
      sector,
      currency: hStock.currency,
      listingDate: hStock.listingDate,
      firstTradingDate: hStock.firstTradingDate,
      isNewlyListed: isNew,
      listingEvent: listingEv,
      newsCount: availableNews.length,
      filingsCount,
      dataQuality: hStock.dataQuality,
      hasPrice: true,
    };

    // Filter by market
    if (marketFilter === 'KR' && item.market !== 'KR') continue;
    if (marketFilter === 'US' && item.market !== 'US') continue;
    if (marketFilter === 'HOLDING' && (!holdings[cid] || holdings[cid].shares <= 0)) continue;
    if (marketFilter === 'WATCHLIST' && !watchlist.includes(cid)) continue;

    // Filter by sector
    if (sectorFilter !== 'ALL' && item.sector !== sectorFilter) continue;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        item.nameKo.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.ticker.toLowerCase().includes(q) ||
        item.sector.toLowerCase().includes(q);
      if (!match) continue;
    }

    tradableList.push(item);
  }

  return tradableList;
}

/**
 * Returns dynamic count statistics of currently tradable stocks.
 * (Never shows total future count like "전체 18 / 최종 50")
 */
export function getTradableStockStats(asOfDateOrYear: string | number) {
  const allTradable = getTradableStocks({
    asOfDate: typeof asOfDateOrYear === 'string' ? asOfDateOrYear : undefined,
    currentYear: typeof asOfDateOrYear === 'number' ? asOfDateOrYear : parseInt(asOfDateOrYear.slice(0, 4)),
  });

  const krCount = allTradable.filter(s => s.market === 'KR').length;
  const usCount = allTradable.filter(s => s.market === 'US').length;

  const sectors: Record<string, number> = {};
  allTradable.forEach(s => {
    sectors[s.sector] = (sectors[s.sector] || 0) + 1;
  });

  return {
    totalCount: allTradable.length,
    krCount,
    usCount,
    sectorCounts: sectors,
  };
}
