import type { StockGameState, FinalMetrics } from '../../types/stockGame';
import type { CumulativeCalibrationMetrics } from '../../types/prediction';
import { calculateCumulativeCalibrationMetrics } from '../predictions/predictionEngine';

export interface ThreeAxisEvaluation {
  performanceAxis: {
    score: number; // 0 to 100
    personaTitle: string;
    twrCAGR: number;
    alphaVsBlend: number;
    mdd: number;
    volatility: number;
    summaryKo: string;
  };
  processAxis: {
    score: number; // 0 to 100
    personaTitle: string;
    evidenceLinkedTradeRatio: number; // 0 to 100%
    filingsConsultedCount: number;
    feeRatioToAssets: number;
    diversificationScore: number;
    riskManagementScore: number;
    summaryKo: string;
  };
  learningAxis: {
    score: number; // 0 to 100
    personaTitle: string;
    calibrationMetrics: CumulativeCalibrationMetrics;
    yearbookThesesCount: number;
    unlockedAchievementsCount: number;
    summaryKo: string;
  };
  overallBadge: string;
  overallNarrativeKo: string;
}

export function evaluateThreeAxes(state: StockGameState, metrics: FinalMetrics): ThreeAxisEvaluation {
  // 1. Performance Axis
  const cagr = metrics.twrCAGR || 0;
  const alpha = (metrics.twrCAGR || 0) - (metrics.benchmarkComparison?.blendTwrCAGR || 0);
  const mdd = metrics.maxDrawdownMDD || 0;

  let perfScore = 50;
  perfScore += Math.min(30, Math.max(-30, alpha * 400));
  if (mdd < 0.25) perfScore += 15;
  else if (mdd > 0.50) perfScore -= 15;
  perfScore = Math.max(10, Math.min(100, Math.round(perfScore)));

  let perfPersona = '시장 추종 안정형';
  if (perfScore >= 80) perfPersona = '글로벌 초과성장형';
  else if (perfScore <= 35) perfPersona = '시장 평균 미달형';

  // 2. Process Axis (Evidence, Discipline, Cost, Diversification)
  const totalTrades = state.tradeLogs.length;
  const evidencedTrades = state.tradeLogs.filter(t => (t.linkedNewsIds && t.linkedNewsIds.length > 0) || !!t.thesis).length;
  const evidenceRatio = totalTrades > 0 ? (evidencedTrades / totalTrades) * 100 : 0;
  const filingsCount = Object.keys(state.investmentNotes || {}).length;
  const feeRatio = metrics.totalInvestedPrincipal > 0 ? (metrics.totalTradingFeesKRW / metrics.totalInvestedPrincipal) * 100 : 0;

  let processScore = 40;
  processScore += Math.min(25, (evidenceRatio / 100) * 25);
  processScore += Math.min(15, filingsCount * 2);
  if (feeRatio <= 0.5) processScore += 10;
  processScore += Math.min(10, (Object.keys(state.holdings || {}).length >= 4 ? 10 : 5));
  processScore = Math.max(10, Math.min(100, Math.round(processScore)));

  let processPersona = '원칙 중심 분석가';
  if (processScore >= 80) processPersona = '철저한 팩트 기반 합리주의자';
  else if (processScore <= 40) processPersona = '직관·감각 의존 매매형';

  // 3. Learning Axis (Calibration, Hypotheses, Achievements)
  const calib = calculateCumulativeCalibrationMetrics(state.annualPredictions || {}, state.history);
  const thesesCount = Object.values(state.investmentNotes || {}).filter(n => n.length > 10).length;
  const achCount = (state.unlockedAchievementIds || []).length;

  let learningScore = 50;
  learningScore += Math.min(20, (calib.calibrationScore - 50) * 0.4);
  learningScore += Math.min(15, thesesCount * 3);
  learningScore += Math.min(15, achCount * 2);
  learningScore = Math.max(10, Math.min(100, Math.round(learningScore)));

  let learningPersona = '체계적 복기 성장형';
  if (learningScore >= 80) learningPersona = '금융경제학적 통찰가';
  else if (learningScore <= 40) learningPersona = '과정 성찰 보완 필요형';

  let overallBadge = '균형 잡힌 자산배분가';
  if (processScore >= 75 && learningScore >= 75) overallBadge = '역사 기반 현명한 투자자';
  else if (perfScore >= 80 && processScore < 50) overallBadge = '공격적 성장 성공형';

  return {
    performanceAxis: {
      score: perfScore,
      personaTitle: perfPersona,
      twrCAGR: cagr,
      alphaVsBlend: alpha,
      mdd,
      volatility: metrics.annualVolatility || 0,
      summaryKo: alpha >= 0
        ? `한·미 혼합 벤치마크 대비 연 +${(alpha * 100).toFixed(1)}%p 초과 성과를 달성했습니다.`
        : `벤치마크 대비 연 ${(alpha * 100).toFixed(1)}%p 차이를 보였습니다.`,
    },
    processAxis: {
      score: processScore,
      personaTitle: processPersona,
      evidenceLinkedTradeRatio: Math.round(evidenceRatio),
      filingsConsultedCount: filingsCount,
      feeRatioToAssets: feeRatio,
      diversificationScore: metrics.scoreAndPersona?.diversificationScore || 70,
      riskManagementScore: metrics.scoreAndPersona?.crisisResilienceScore || 70,
      summaryKo: `총 ${totalTrades}건의 거래 중 ${Math.round(evidenceRatio)}%에 당대 뉴스·공시 근거를 수립했습니다.`,
    },
    learningAxis: {
      score: learningScore,
      personaTitle: learningPersona,
      calibrationMetrics: calib,
      yearbookThesesCount: thesesCount,
      unlockedAchievementsCount: achCount,
      summaryKo: `연초 예측 보정 점수 ${calib.calibrationScore}점 및 ${achCount}개 과정 중심 업적을 획득했습니다.`,
    },
    overallBadge,
    overallNarrativeKo: `45년간 당대 공개 정보만을 바탕으로 투자 판단을 내리고, 역사적 위기와 기회를 통과하며 나만의 투자 가설을 성공적으로 검증했습니다.`,
  };
}
