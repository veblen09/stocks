import rawNews from '../data/news/historical_news_all.json';
import rawAliases from '../data/news/entity-aliases.json';
import type {
  HistoricalNewsItem,
  CompanyAlias,
  CompanyOverviewAtYear,
  NewsScope,
  NewsMarket,
  NewsSourceType,
  EvidenceLevel,
} from '../types/stockNews';
import type { StockGameState, NewsDecisionAnalysis } from '../types/stockGame';
import { STOCKS_BY_ID, isStockListed } from './returnEngine';

export const HISTORICAL_NEWS: HistoricalNewsItem[] = rawNews as unknown as HistoricalNewsItem[];
export const ENTITY_ALIASES: CompanyAlias[] = rawAliases as unknown as CompanyAlias[];

export const NEWS_BY_ID: Record<string, HistoricalNewsItem> = {};
HISTORICAL_NEWS.forEach(n => {
  NEWS_BY_ID[n.id] = n;
});

/**
 * Returns the strict decision cutoff date for a given simulation year Y
 * Y investment decisions occur at beginning of year Y based on info up to (Y-1)-12-31
 */
export function getDecisionCutoffDate(year: number): string {
  const priorYear = year - 1;
  return `${priorYear}-12-31`;
}

export interface NewsFilterOptions {
  scope?: NewsScope | 'ALL';
  market?: NewsMarket | 'ALL';
  canonicalCompanyId?: string;
  companyIds?: string[];
  sector?: string;
  sourceType?: NewsSourceType | 'ALL';
  evidenceLevel?: EvidenceLevel | 'ALL';
  minImportanceScore?: number;
  category?: string;
  onlyContemporary?: boolean;
}

/**
 * Retrieves historical news available to the investor at the decision point of year Y
 * STRICT LOOKAHEAD PREVENTION: item.availableFrom <= decisionCutoffDate
 */
export function getAvailableNewsForYear(
  year: number,
  filters?: NewsFilterOptions
): HistoricalNewsItem[] {
  const cutoff = getDecisionCutoffDate(year);

  return HISTORICAL_NEWS.filter(item => {
    // 1. Strict time cutoff check
    if (item.availableFrom > cutoff) {
      return false;
    }

    if (!filters) return true;

    // 2. Scope filter
    if (filters.scope && filters.scope !== 'ALL' && item.scope !== filters.scope) {
      return false;
    }

    // 3. Market filter
    if (filters.market && filters.market !== 'ALL' && item.market !== filters.market) {
      return false;
    }

    // 4. Company filter
    if (filters.canonicalCompanyId) {
      if (!item.canonicalCompanyIds.includes(filters.canonicalCompanyId)) {
        return false;
      }
    }

    if (filters.companyIds && filters.companyIds.length > 0) {
      const match = filters.companyIds.some(cid => item.canonicalCompanyIds.includes(cid));
      if (!match) return false;
    }

    // 5. Sector filter
    if (filters.sector && filters.sector !== 'ALL') {
      if (!item.relatedSectors.includes(filters.sector)) {
        return false;
      }
    }

    // 6. Source Type
    if (filters.sourceType && filters.sourceType !== 'ALL' && item.sourceType !== filters.sourceType) {
      return false;
    }

    // 7. Evidence Level
    if (filters.evidenceLevel && filters.evidenceLevel !== 'ALL' && item.evidenceLevel !== filters.evidenceLevel) {
      return false;
    }

    // 8. Minimum Importance Score
    if (filters.minImportanceScore && item.importanceScore < filters.minImportanceScore) {
      return false;
    }

    // 9. Contemporary only
    if (filters.onlyContemporary && item.isRetrospective) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    // Sort descending by date, then importance
    if (b.publishedAt !== a.publishedAt) {
      return b.publishedAt.localeCompare(a.publishedAt);
    }
    return b.importanceScore - a.importanceScore;
  });
}

/**
 * Retrieves news that actually occurred during year Y (unlocked only after advancing year Y)
 */
export function getYearRetrospectiveNews(year: number): HistoricalNewsItem[] {
  const yStr = year.toString();
  return HISTORICAL_NEWS.filter(item => {
    return item.publishedAt.startsWith(yStr);
  }).sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
}

/**
 * Returns company aliases for tracking historical names/tickers
 */
export function getCompanyAliases(canonicalCompanyId: string): CompanyAlias[] {
  return ENTITY_ALIASES.filter(a => a.canonicalCompanyId === canonicalCompanyId);
}

/**
 * Resolves contemporary historical company overview at year Y
 */
export function getCompanyOverviewAtYear(
  canonicalCompanyId: string,
  year: number
): CompanyOverviewAtYear {
  const stock = STOCKS_BY_ID[canonicalCompanyId];
  const aliases = getCompanyAliases(canonicalCompanyId);
  // Find active alias at year Y
  const yDate = `${year}-01-01`;
  const activeAlias = aliases.find(a => {
    const from = a.validFrom;
    const to = a.validTo || '9999-12-31';
    return yDate >= from && yDate <= to;
  });

  const nameKo = activeAlias ? activeAlias.historicalName : stock ? stock.nameKo : canonicalCompanyId;
  const ticker = activeAlias?.ticker || stock?.ticker || '';
  const contemporaryBusiness = activeAlias?.contemporaryBusinessKo || stock?.description || '사업 내용';
  const isListed = isStockListed(canonicalCompanyId, year);

  // Check coverage count
  const availableNews = getAvailableNewsForYear(year, { canonicalCompanyId });
  let coverageStatus: CompanyOverviewAtYear['coverageStatus'] = 'NO_VERIFIED_DATA';
  if (availableNews.length >= 4) {
    coverageStatus = 'SUFFICIENT';
  } else if (availableNews.length >= 1) {
    coverageStatus = 'PARTIAL';
  } else if (isListed) {
    coverageStatus = 'OFFICIAL_ONLY';
  }

  return {
    canonicalCompanyId,
    currentYear: year,
    nameKo,
    ticker,
    market: stock?.market || 'KR',
    sector: stock?.sector || '기타',
    isListed,
    firstValidYear: stock?.firstValidYear || 1981,
    listingDate: stock?.listingDate || '',
    contemporaryBusiness,
    historicalAliases: aliases,
    dataQuality: stock?.dataQuality === 'MISSING' ? 'LOW' : 'HIGH',
    coverageStatus,
  };
}

/**
 * Searches historical news strictly constrained to information on or before decision cutoff date
 */
export function searchHistoricalNews(
  query: string,
  currentYear: number,
  filters?: NewsFilterOptions
): HistoricalNewsItem[] {
  const available = getAvailableNewsForYear(currentYear, filters);
  if (!query || query.trim() === '') {
    return available;
  }

  const q = query.trim().toLowerCase();
  return available.filter(item => {
    return (
      item.titleKo.toLowerCase().includes(q) ||
      item.summaryKo.toLowerCase().includes(q) ||
      item.sourceName.toLowerCase().includes(q) ||
      item.categories.some(c => c.toLowerCase().includes(q)) ||
      item.relatedSectors.some(s => s.toLowerCase().includes(q)) ||
      item.canonicalCompanyIds.some(cid => {
        const s = STOCKS_BY_ID[cid];
        return s && (s.nameKo.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q));
      })
    );
  });
}

/**
 * Analyzes player's news consultation and decision characteristics for educational feedback
 */
export function evaluateNewsDecisionCharacteristics(state: StockGameState): NewsDecisionAnalysis {
  const { tradeLogs, tradeRationales } = state;
  const rationales = Object.values(tradeRationales || {});
  const tradesWithRationale = rationales.length;
  const tradesWithoutRationale = Math.max(0, tradeLogs.length - tradesWithRationale);

  let macroConsulted = 0;
  let companyConsulted = 0;
  let filingsConsulted = 0;

  rationales.forEach(r => {
    r.linkedNewsIds.forEach(nid => {
      const n = NEWS_BY_ID[nid];
      if (n) {
        if (n.scope === 'GLOBAL_MACRO' || n.scope === 'KOREA_MACRO' || n.scope === 'US_MACRO') {
          macroConsulted++;
        }
        if (n.scope === 'COMPANY') {
          companyConsulted++;
        }
        if (n.sourceType === 'FILING') {
          filingsConsulted++;
        }
      }
    });
  });

  const feedback: string[] = [];
  let confirmationBiasRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

  if (tradesWithRationale >= 3 && filingsConsulted >= 2) {
    feedback.push('공식 공시자료와 감사보고서를 우선적으로 확인하여 객관적 사실에 기반한 투자를 실행했습니다.');
  } else if (tradesWithRationale === 0 && tradeLogs.length > 5) {
    feedback.push('구체적인 뉴스 근거 기록 없이 빠른 매매를 진행하여 시장 타이밍 위험에 노출되었습니다.');
    confirmationBiasRisk = 'MEDIUM';
  }

  if (macroConsulted >= 3 && companyConsulted >= 3) {
    feedback.push('거시경제 금리·환율 환경과 개별기업 실적을 균형 있게 교차 검증하여 분석적 깊이를 확보했습니다.');
  } else if (companyConsulted > 5 && macroConsulted === 0) {
    feedback.push('개별기업 호재성 뉴스에 집중하느라 거시경제 금리 긴축이나 경기침체 충격을 다소 간과했을 가능성이 있습니다.');
    confirmationBiasRisk = 'HIGH';
  } else {
    feedback.push('원칙 기반의 장기 분산투자를 유지하며 불필요한 뉴스 과민반응을 절제했습니다.');
  }

  return {
    macroNewsConsulted: macroConsulted,
    companyNewsConsulted: companyConsulted,
    filingsConsulted,
    tradesWithRationale,
    tradesWithoutRationale,
    confirmationBiasRisk,
    feedbackSummaryKo: feedback,
  };
}

/**
 * Returns macro and market news available at year Y decision point
 */
export function getMacroNewsForYear(
  year: number,
  market?: NewsMarket | 'ALL'
): HistoricalNewsItem[] {
  return getAvailableNewsForYear(year, {
    scope: 'ALL',
    market: market || 'ALL',
  }).filter(item => item.scope !== 'COMPANY');
}

/**
 * Returns sector-specific news available at year Y decision point
 */
export function getSectorNewsForYear(
  year: number,
  sector: string
): HistoricalNewsItem[] {
  return getAvailableNewsForYear(year, { sector });
}

/**
 * Formats standard cutoff notice strings according to Section 22.2
 */
export function getDecisionCutoffDisplayInfo(year: number) {
  const cutoffDate = getDecisionCutoffDate(year);
  const [cYear, cMonth, cDay] = cutoffDate.split('-');
  return {
    currentYear: year,
    cutoffDate,
    searchPeriod: `1980-01-01 ~ ${cutoffDate}`,
    topBannerNotice: `현재 표시되는 정보는 ${cYear}년 ${cMonth}월 ${cDay}일까지 당시 투자자가 확인할 수 있었던 자료입니다.`,
    isLockedFuture: true,
    lockMessage: `${year}년 중 발생 사건은 연말 결산 시 잠금 해제`,
  };
}

/**
 * Compiles side-by-side comparison data for up to 4 selected companies (Section 33)
 */
export function getCompanyComparisonData(
  canonicalIds: string[],
  year: number
): import('../types/stockNews').CompanyComparisonItem[] {
  return canonicalIds.map(cid => {
    const overview = getCompanyOverviewAtYear(cid, year);
    const availableNews = getAvailableNewsForYear(year, { canonicalCompanyId: cid });

    // Resolve risk factors from latest available news
    const riskFactors = Array.from(
      new Set(
        availableNews.flatMap(n =>
          n.affectedChannels.filter(ch => ['COST', 'INTEREST_RATE', 'REGULATION', 'SUPPLY_CHAIN', 'COMPETITION'].includes(ch))
        )
      )
    );

    return {
      canonicalCompanyId: cid,
      currentYear: year,
      nameKo: overview.nameKo,
      ticker: overview.ticker,
      market: overview.market,
      sector: overview.sector,
      isListed: overview.isListed,
      listingDate: overview.listingDate,
      contemporaryBusiness: overview.contemporaryBusiness,
      recentNewsCount: availableNews.length,
      recentNews: availableNews.slice(0, 3),
      last1YrReturn: null,
      past3YrCAGR: null,
      historicalMDD: null,
      dataQuality: overview.dataQuality === 'HIGH' ? '우수(공식감사)' : '제한적',
      coverageStatus: overview.coverageStatus,
      riskFactors,
    };
  });
}


