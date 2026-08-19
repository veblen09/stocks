import type { InvestmentYearbookEntry, YearbookHighlights } from '../../types/yearbook';
import type { StockGameState } from '../../types/stockGame';
import { getChapterByYear } from '../chapters/chapterDefinitions';

export function buildYearbookEntries(state: StockGameState): InvestmentYearbookEntry[] {
  const entries: InvestmentYearbookEntry[] = [];

  state.history.forEach(hist => {
    const year = hist.year;
    const chapter = getChapterByYear(year);

    const yearTrades = state.tradeLogs.filter(t => t.year === year);
    const yearNotes = Object.entries(state.investmentNotes || {})
      .filter(([_, note]) => note && note.length > 0);

    const mainThesis = yearNotes.length > 0 ? yearNotes[0][1] : undefined;
    const prediction = state.annualPredictions?.[year];

    let majorDecisionSummary = '';
    if (yearTrades.length === 0) {
      majorDecisionSummary = `${year}년: 기존 포트폴리오 자산배분 원칙을 유지하며 보유 지속`;
    } else {
      const buyCount = yearTrades.filter(t => t.action === 'BUY').length;
      const sellCount = yearTrades.filter(t => t.action === 'SELL').length;
      majorDecisionSummary = `${year}년: ${buyCount}건 매수, ${sellCount}건 매도 실행하여 포트폴리오 리밸런싱`;
    }

    let predictionResultSummary = '';
    if (prediction) {
      const kospiRet = hist.benchmarkReturns?.kospi || 0;
      predictionResultSummary = `예측(확신도 ${prediction.confidence}%): 코스피 ${prediction.kospiDirection} / 실제 결과: 코스피 ${(kospiRet * 100).toFixed(1)}%`;
    }

    entries.push({
      year,
      chapterId: chapter?.id || 'chapter_1',
      chapterTitleKo: chapter?.titleKo || '역사 챕터',
      majorDecisionSummary,
      linkedNewsIds: yearTrades.flatMap(t => t.linkedNewsIds || []),
      thesis: mainThesis,
      prediction,
      predictionResultSummary,
      portfolioReturn: hist.annualReturn,
      benchmarkReturn: hist.benchmarkReturns?.blend5050 || 0,
      portfolioValueKRW: hist.endTotalAssetsKRW,
      mainLearning: hist.annualReturn > 0.15
        ? '시장의 강한 반등 국면에서 자산배분의 가치를 경험함'
        : hist.annualReturn < -0.10
        ? '시장 하락기에도 원칙을 유지하며 손실을 방어함'
        : '안정적인 분산투자로 시장 수익률을 추종함'
    });
  });

  return entries;
}

export function selectYearbookHighlights(
  entries: InvestmentYearbookEntry[],
  _state?: StockGameState
): YearbookHighlights {

  if (entries.length === 0) return {};

  let bestYear = entries[0].year;
  let maxRet = entries[0].portfolioReturn;
  let worstYear = entries[0].year;
  let minRet = entries[0].portfolioReturn;

  entries.forEach(e => {
    if (e.portfolioReturn > maxRet) {
      maxRet = e.portfolioReturn;
      bestYear = e.year;
    }
    if (e.portfolioReturn < minRet) {
      minRet = e.portfolioReturn;
      worstYear = e.year;
    }
  });

  return {
    bestEvidencedTradeYear: entries.find(e => !!e.thesis)?.year || entries[0].year,
    mostOverconfidentYear: entries.find(e => (e.prediction?.confidence || 0) >= 80)?.year,
    mostFilingsConsultedYear: entries[0].year,
    highestCostYear: entries[0].year,
    bestDiversifiedYear: entries[0].year,
    longestPrincipleMaintained: '5년 연속 자산배분 및 리밸런싱 유지',
    biggestCrisisSurvivingYear: worstYear,
    largestAlphaYear: bestYear
  };
}
