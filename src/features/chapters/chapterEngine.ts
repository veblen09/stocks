import type { HistoricalChapter, ChapterSummaryData } from '../../types/chapter';
import type { StockGameState, YearlyPerformanceRecord, ChapterRiskMissionResult } from '../../types/stockGame';
import { getChapterByYear } from './chapterDefinitions';

export function isChapterStartYear(year: number, gameStartYear: number): boolean {
  const chapter = getChapterByYear(year);
  if (!chapter) return false;
  return year === chapter.startYear || year === gameStartYear + 1;
}

export function isChapterEndYear(year: number, gameEndYear: number): boolean {
  const chapter = getChapterByYear(year);
  if (!chapter) return false;
  return year === chapter.endYear || year === gameEndYear;
}

export function calculateChapterSummary(
  chapter: HistoricalChapter,
  state: StockGameState
): ChapterSummaryData {
  const chapterRecords: YearlyPerformanceRecord[] = state.history.filter(
    h => h.year >= chapter.startYear && h.year <= chapter.endYear
  );

  const startRecord = chapterRecords[0];
  const endRecord = chapterRecords[chapterRecords.length - 1];

  const startValue = startRecord ? startRecord.startTotalAssetsKRW : state.settings.initialCashKRW;
  const endValue = endRecord ? endRecord.endTotalAssetsKRW : state.cashKRW;

  const totalDepositsInChapter = chapterRecords.reduce((sum, r) => sum + r.annualDepositKRW, 0);
  const chapterReturn = startValue + totalDepositsInChapter > 0
    ? (endValue - startValue - totalDepositsInChapter) / (startValue + totalDepositsInChapter)
    : 0;

  // Chapter TWR
  let twrFactor = 1.0;
  chapterRecords.forEach(r => {
    twrFactor *= (1 + r.annualReturn);
  });
  const chapterTWR = twrFactor - 1.0;

  // Chapter MDD from TWR level
  let peak = 100.0;
  let maxDD = 0.0;
  let curLevel = 100.0;
  chapterRecords.forEach(r => {
    curLevel *= (1 + r.annualReturn);
    if (curLevel > peak) peak = curLevel;
    const dd = peak > 0 ? (peak - curLevel) / peak : 0;
    if (dd > maxDD) maxDD = dd;
  });

  // Fees in chapter
  const chapterTrades = state.tradeLogs.filter(
    t => t.year >= chapter.startYear && t.year <= chapter.endYear
  );
  const totalFees = chapterTrades.reduce((sum, t) => sum + t.feeKRW, 0);

  // FX contribution
  const fxContributionRate = 0.0;

  // User goal check
  const goalId = state.selectedChapterGoals?.[chapter.id];
  const userGoal = chapter.suggestedGoals.find(g => g.id === goalId) || chapter.suggestedGoals[0];
  let goalCompleted = true;

  if (userGoal) {
    if (userGoal.targetType === 'FILINGS_COUNT') {
      const newsCount = Object.keys(state.investmentNotes || {}).length;
      goalCompleted = newsCount >= userGoal.targetValue;
    } else if (userGoal.targetType === 'MAX_WEIGHT_CAP') {
      const maxWeight = Math.max(...Object.values(state.draftTargetWeights || {}), 0);
      goalCompleted = (maxWeight * 100) <= userGoal.targetValue;
    }
  }

  // Chapter Risk Missions evaluation
  const selectedMissionIds = state.selectedRiskMissions?.[chapter.id] ||
    chapter.suggestedRiskMissions.map(m => m.id).slice(0, 3);

  const riskMissionResults: ChapterRiskMissionResult[] = [];
  let allMissionsPassed = true;

  for (const mId of selectedMissionIds) {
    const mission = chapter.suggestedRiskMissions.find(m => m.id === mId);
    if (!mission) continue;

    let passed = true;
    let actualValue = 0;

    switch (mission.missionType) {
      case 'MAX_DRAWDOWN':
        actualValue = maxDD;
        passed = maxDD <= mission.targetValue;
        break;
      case 'MAX_STOCK_WEIGHT': {
        let maxSingleWeight = 0;
        chapterRecords.forEach(r => {
          (r.holdingsSnapshot || []).forEach(h => {
            if (h.weight > maxSingleWeight) maxSingleWeight = h.weight;
          });
        });
        actualValue = maxSingleWeight;
        passed = maxSingleWeight <= mission.targetValue;
        break;
      }
      case 'MIN_CASH_BUFFER': {
        let maxCashRatio = 0;
        chapterRecords.forEach(r => {
          const ratio = r.endTotalAssetsKRW > 0 ? r.cashKRW / r.endTotalAssetsKRW : 0;
          if (ratio > maxCashRatio) maxCashRatio = ratio;
        });
        actualValue = maxCashRatio;
        passed = maxCashRatio >= mission.targetValue;
        break;
      }
      case 'MAX_FEES_RATIO': {
        const feeRatio = endValue > 0 ? totalFees / endValue : 0;
        actualValue = feeRatio;
        passed = feeRatio <= mission.targetValue;
        break;
      }
      case 'MIN_SECTOR_COUNT': {
        let maxSectors = 0;
        chapterRecords.forEach(r => {
          const sectors = new Set((r.holdingsSnapshot || []).map(h => h.market));
          if (sectors.size > maxSectors) maxSectors = sectors.size;
        });
        actualValue = maxSectors;
        passed = maxSectors >= mission.targetValue;
        break;
      }
      case 'RECORD_CRISIS_THESIS': {
        const thesisCount = chapterTrades.filter(t => !!t.thesis || (t.linkedNewsIds?.length || 0) > 0).length;
        actualValue = thesisCount;
        passed = thesisCount >= mission.targetValue;
        break;
      }
    }

    if (!passed) allMissionsPassed = false;

    riskMissionResults.push({
      chapterId: chapter.id,
      missionId: mission.id,
      passed,
      actualValue,
      targetValue: mission.targetValue,
      label: mission.titleKo,
    });
  }

  return {
    chapter,
    startYear: startRecord ? startRecord.year : chapter.startYear,
    endYear: endRecord ? endRecord.year : chapter.endYear,
    startPortfolioValueKRW: startValue,
    endPortfolioValueKRW: endValue,
    chapterReturn,
    chapterTWR,
    chapterMDD: maxDD,
    totalFeesPaidKRW: totalFees,
    fxContributionRate,
    bestEvidencedTradeCount: chapterTrades.filter(t => (t.linkedNewsIds?.length || 0) > 0 || !!t.thesis).length,
    unlockedCompanyCount: Object.values(state.companyEncyclopedia || {}).filter(c => c.unlockedYear >= chapter.startYear && c.unlockedYear <= chapter.endYear).length,
    earnedAchievementIds: state.unlockedAchievementIds || [],
    goalCompleted,
    userGoal,
    riskMissionResults,
    survived: allMissionsPassed,
  };
}
