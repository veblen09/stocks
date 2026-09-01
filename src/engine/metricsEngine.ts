import type {
  FinalMetrics,
  StockGameState,
  DrawdownPoint,
  RecoveryMetrics,
  RiskLevel,
  YearlyPerformanceRecord,
} from '../types/stockGame';
import { simulateBenchmarkTrajectory } from './benchmarkEngine';
import { STOCKS_BY_ID } from './returnEngine';
import rawCpi from '../data/normalized/korean_cpi.json';

const CPI_SERIES: Record<string, number> = rawCpi.series as Record<string, number>;

/**
 * Calculates Money-Weighted Return (MWR / IRR) using Newton-Raphson method
 */
export function calculateMWR_IRR(
  initialCash: number,
  annualDeposits: number[] | { yearIndex: number; amount: number }[],
  finalValue: number,
  totalYearsParam?: number
): number {
  const parsedDeposits: { t: number; cf: number }[] = [];

  if (annualDeposits.length > 0 && typeof annualDeposits[0] === 'number') {
    (annualDeposits as number[]).forEach((amt, idx) => {
      parsedDeposits.push({ t: idx + 1, cf: -amt });
    });
  } else {
    (annualDeposits as { yearIndex: number; amount: number }[]).forEach(d => {
      parsedDeposits.push({ t: d.yearIndex, cf: -d.amount });
    });
  }

  const totalYears = totalYearsParam !== undefined ? totalYearsParam : (parsedDeposits.length + 1);
  if (totalYears <= 0 || initialCash <= 0 || finalValue <= 0) return 0;

  const cashflows: { t: number; cf: number }[] = [
    { t: 0, cf: -initialCash },
    ...parsedDeposits,
    { t: totalYears, cf: finalValue },
  ];

  let r = 0.1; // initial guess 10%
  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let iter = 0; iter < maxIterations; iter++) {
    let npv = 0;
    let dNpv = 0;

    for (const item of cashflows) {
      const denom = Math.pow(1 + r, item.t);
      if (denom === 0) continue;
      npv += item.cf / denom;
      if (item.t > 0) {
        dNpv -= (item.t * item.cf) / Math.pow(1 + r, item.t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) {
      return r;
    }

    if (Math.abs(dNpv) < 1e-12) {
      break;
    }

    const nextR = r - npv / dNpv;
    if (isNaN(nextR) || !isFinite(nextR) || nextR <= -0.999) {
      r = r / 2;
    } else {
      r = nextR;
    }
  }

  return Math.max(-0.999, r);
}

/**
 * Computes Maximum Drawdown (MDD) from a sequence of cumulative index values
 */
export function calculateMDD(indexLevels: number[]): number {
  if (!indexLevels || indexLevels.length < 2) return 0;

  let peak = indexLevels[0];
  let maxDrawdown = 0;

  for (let i = 0; i < indexLevels.length; i++) {
    if (indexLevels[i] > peak) {
      peak = indexLevels[i];
    }
    const dd = peak > 0 ? (peak - indexLevels[i]) / peak : 0;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }
  }

  return maxDrawdown;
}

/**
 * Computes exact DrawdownPoint array across full history
 */
export function calculateDrawdownPoints(
  history: YearlyPerformanceRecord[],
  startYear = 1980
): DrawdownPoint[] {
  if (!history || history.length === 0) return [];

  let peakTwr = 100.0;
  let peakYear = startYear;
  const points: DrawdownPoint[] = [];

  for (const h of history) {
    const currentTwr = h.twrIndexLevel;
    if (currentTwr >= peakTwr) {
      peakTwr = currentTwr;
      peakYear = h.year;
    }

    const dd = peakTwr > 0 ? (currentTwr - peakTwr) / peakTwr : 0; // negative or 0
    const underwaterYears = Math.max(0, h.year - peakYear);

    points.push({
      year: h.year,
      peakTwrIndex: peakTwr,
      currentTwrIndex: currentTwr,
      drawdown: dd,
      underwaterYears,
      peakYear,
    });
  }

  return points;
}

/**
 * Computes Recovery Metrics (Worst Drawdown, Peak Year, Trough Year, Recovery Year, Max Underwater Duration)
 */
export function calculateRecoveryMetrics(
  history: YearlyPerformanceRecord[],
  startYear = 1980
): RecoveryMetrics {
  const points = calculateDrawdownPoints(history, startYear);
  if (points.length === 0) {
    return {
      maxDrawdown: 0,
      drawdownStartYear: undefined,
      troughYear: undefined,
      recoveryYear: undefined,
      underwaterDurationYears: 0,
    };
  }

  let maxDd = 0;
  let troughYear = startYear;
  let peakYearAtTrough = startYear;
  let maxUnderwaterDuration = 0;

  points.forEach(p => {
    if (p.underwaterYears > maxUnderwaterDuration) {
      maxUnderwaterDuration = p.underwaterYears;
    }
    const absDd = Math.abs(p.drawdown);
    if (absDd > maxDd) {
      maxDd = absDd;
      troughYear = p.year;
      peakYearAtTrough = p.peakYear;
    }
  });

  // Find when peakYearAtTrough was subsequently recovered
  let recoveryYear: number | undefined = undefined;
  const troughIndex = points.findIndex(p => p.year === troughYear);
  if (troughIndex >= 0) {
    const peakLevel = points[troughIndex].peakTwrIndex;
    for (let i = troughIndex + 1; i < points.length; i++) {
      if (points[i].currentTwrIndex >= peakLevel) {
        recoveryYear = points[i].year;
        break;
      }
    }
  }

  return {
    maxDrawdown: maxDd,
    drawdownStartYear: peakYearAtTrough,
    troughYear,
    recoveryYear,
    underwaterDurationYears: maxUnderwaterDuration,
  };
}

/**
 * Converts a drawdown value (e.g. -0.347) into a standardized RiskLevel
 */
export function calculateRiskLevel(drawdown: number): RiskLevel {
  const absDd = Math.abs(drawdown);
  if (absDd >= 0.40) return 'EXTREME';
  if (absDd >= 0.30) return 'CRISIS';
  if (absDd >= 0.20) return 'WARNING';
  if (absDd >= 0.10) return 'CAUTION';
  return 'NORMAL';
}

/**
 * Calculates pure investment PnL and rate by strictly separating cumulative principal from portfolio value
 */
export function calculatePureInvestmentPnL(
  currentPortfolioValueKRW: number,
  initialCashKRW: number,
  cumulativeContributionsKRW: number
): {
  netInvestedPrincipalKRW: number;
  investmentPnLKRW: number;
  investmentPnLPercent: number;
} {
  const netInvestedPrincipalKRW = initialCashKRW + cumulativeContributionsKRW;
  const investmentPnLKRW = currentPortfolioValueKRW - netInvestedPrincipalKRW;
  const investmentPnLPercent = netInvestedPrincipalKRW > 0 ? investmentPnLKRW / netInvestedPrincipalKRW : 0;

  return {
    netInvestedPrincipalKRW,
    investmentPnLKRW,
    investmentPnLPercent,
  };
}

/**
 * Adjusts nominal KRW value to real purchasing power using Korea CPI index
 */
export function calculateRealPurchasingPower(
  nominalKRW: number,
  fromYear: number,
  toYear = 2025
): number {
  const fromCpi = CPI_SERIES[fromYear.toString()] || CPI_SERIES['1980'] || 17.0;
  const toCpi = CPI_SERIES[toYear.toString()] || CPI_SERIES['2025'] || 116.5;

  if (fromCpi <= 0) return nominalKRW;
  return nominalKRW * (toCpi / fromCpi);
}

/**
 * Computes sample standard deviation (annual volatility)
 */
export function calculateVolatility(returns: number[]): number {
  if (!returns || returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
  return Math.sqrt(variance);
}

/**
 * 5-Dimensional Quant Investor Scoring and Persona Classifier
 */
export function evaluateScoreAndPersona(
  twrCAGR: number,
  mdd: number,
  kospiCAGR: number,
  sp500CAGR: number,
  totalTrades: number,
  yearsCount: number,
  krWeight: number,
  usWeight: number,
  totalTradingFees: number,
  finalPortfolioValue: number,
  maxStockWeight = 0.3
): {
  diversificationScore: number;
  disciplineScore: number;
  crisisResilienceScore: number;
  costEfficiencyScore: number;
  overallAlphaScore: number;
  riskManagementScore: number;
  personaType: string;
  personaBadge: string;
  personaDescription: string;
} {
  // 1. Diversification (0-100)
  const krDiff = Math.abs(krWeight - 0.5);
  const usDiff = Math.abs(usWeight - 0.5);
  const concPenalty = Math.max(0, (maxStockWeight - 0.3) * 100);
  const divScore = Math.max(20, Math.round(100 - (krDiff + usDiff) * 50 - concPenalty));

  // 2. Discipline (0-100)
  const tradesPerYear = totalTrades / Math.max(1, yearsCount);
  const discScore = Math.max(30, Math.round(100 - Math.min(60, tradesPerYear * 4)));

  // 3. Crisis Resilience (0-100)
  const crisisScore = Math.max(20, Math.round(100 - mdd * 100));

  // 4. Cost Efficiency (0-100)
  const feeDrag = finalPortfolioValue > 0 ? totalTradingFees / finalPortfolioValue : 0;
  const costScore = Math.max(30, Math.round(100 - Math.min(70, feeDrag * 5000)));

  // 5. Alpha (0-100)
  const benchmarkBlendCAGR = (kospiCAGR + sp500CAGR) / 2;
  const alphaDiff = twrCAGR - benchmarkBlendCAGR;
  const alphaScore = Math.max(20, Math.min(100, Math.round(50 + alphaDiff * 300)));

  // Dedicated Risk Management Score (Weighted blend of MDD, Concentration, Cost, Discipline)
  const riskManagementScore = Math.round(
    crisisScore * 0.4 +
    divScore * 0.25 +
    discScore * 0.2 +
    costScore * 0.15
  );

  // Determine Persona
  let personaType = '안정적 분산투자자';
  let personaBadge = '🛡️';
  let personaDescription = '한국과 미국 시장에 고르게 자산을 배분하고 위기 속에서도 원칙을 지킨 안정적인 포트폴리오 관리자입니다.';

  if (twrCAGR > sp500CAGR && twrCAGR > kospiCAGR && mdd < 0.4) {
    personaType = '지수 초과 퀀트 장기투자자';
    personaBadge = '👑';
    personaDescription = '시장 대표 지수를 능가하는 연평균 복리수익률을 달성하면서도 리스크 관리에 성공한 최상위 퀀트 투자자입니다.';
  } else if (usWeight > 0.7 && twrCAGR > 0.1) {
    personaType = '글로벌 빅테크 성장 추구형';
    personaBadge = '🚀';
    personaDescription = '미국 우량 기술주 중심의 고성장을 적극적으로 포착하여 달러 환율 효과와 함께 높은 자산 성장을 일구어냈습니다.';
  } else if (krWeight > 0.7) {
    personaType = '대한민국 경제 동행형';
    personaBadge = '🇰🇷';
    personaDescription = '한국 대표 제조·수출 기업들의 45년 역사적 성장과 궤를 함께한 한국 증시의 든든한 동반자입니다.';
  } else if (mdd < 0.25) {
    personaType = '철벽 방어형 자산배분가';
    personaBadge = '🏰';
    personaDescription = '외환위기와 금융위기의 폭락 속에서도 흔들리지 않는 극도의 리스크 방어력을 보여준 자산관리의 달인입니다.';
  } else if (tradesPerYear > 8) {
    personaType = '역동적 시장 타이밍 트레이더';
    personaBadge = '⚡';
    personaDescription = '시장 변동에 기민하게 반응하며 적극적인 매매로 기회를 탐색한 능동형 투자자입니다.';
  } else if (twrCAGR < kospiCAGR && twrCAGR < sp500CAGR) {
    personaType = '장기 분산 원칙 학습형';
    personaBadge = '🌱';
    personaDescription = '과거 역사적 변동성을 직접 경험하며 지수 패시브 투자의 힘과 자산배분의 중요성을 확인한 학습자입니다.';
  }

  return {
    diversificationScore: divScore,
    disciplineScore: discScore,
    crisisResilienceScore: crisisScore,
    costEfficiencyScore: costScore,
    overallAlphaScore: alphaScore,
    riskManagementScore,
    personaType,
    personaBadge,
    personaDescription,
  };
}

/**
 * Compiles all final quantitative performance metrics
 */
export function calculateFinalMetrics(state: StockGameState): FinalMetrics {
  const { settings, history, cashKRW, holdings, tradeLogs, crisisDecisionHistory = [] } = state;
  const yearsCount = history.length;

  const initialCash = settings.initialCashKRW;
  const annualDeposit = settings.annualContributionKRW;
  const totalDeposits = history.reduce((sum, h, idx) => (idx === 0 ? sum : sum + h.annualDepositKRW), 0);
  const totalInvestedPrincipal = initialCash + totalDeposits;

  const lastHistory = history.length > 0 ? history[history.length - 1] : null;
  const finalPortfolioValue = lastHistory ? lastHistory.endTotalAssetsKRW : initialCash;
  const totalNetProfitKRW = finalPortfolioValue - totalInvestedPrincipal;
  const simpleProfitRate = totalInvestedPrincipal > 0 ? totalNetProfitKRW / totalInvestedPrincipal : 0;

  // TWR
  const twrIndexEnd = lastHistory ? lastHistory.twrIndexLevel : 100.0;
  const twr = (twrIndexEnd - 100.0) / 100.0;
  const twrCAGR = yearsCount > 0 ? Math.pow(twrIndexEnd / 100.0, 1.0 / yearsCount) - 1.0 : 0;

  // MWR / IRR
  const depositsList = history.map((h, idx) => ({
    yearIndex: idx + 1,
    amount: h.annualDepositKRW,
  }));
  const mwrIRR = calculateMWR_IRR(initialCash, depositsList, finalPortfolioValue, yearsCount);

  // MDD from pure TWR levels
  const twrLevels = [100.0, ...history.map(h => h.twrIndexLevel)];
  const maxDrawdownMDD = calculateMDD(twrLevels);

  // Drawdown Points & Recovery
  const drawdownPoints = calculateDrawdownPoints(history, settings.startYear);
  const recoveryMetrics = calculateRecoveryMetrics(history, settings.startYear);

  // Peak Portfolio Value and Loss from Peak
  let allTimePeakPortfolioValueKRW = initialCash;
  history.forEach(h => {
    if (h.endTotalAssetsKRW > allTimePeakPortfolioValueKRW) {
      allTimePeakPortfolioValueKRW = h.endTotalAssetsKRW;
    }
  });
  const lossFromPeakKRW = Math.max(0, allTimePeakPortfolioValueKRW - finalPortfolioValue);

  // CPI Real Purchasing Power
  const cpiAdjustedFinalValueKRW = calculateRealPurchasingPower(finalPortfolioValue, settings.endYear, 2025);
  const cpiAdjustedTotalProfitKRW = cpiAdjustedFinalValueKRW - totalInvestedPrincipal;

  // Volatility
  const returns = history.map(h => h.annualReturn);
  const annualVolatility = calculateVolatility(returns);

  // Best & Worst Years
  let bestYear = { year: settings.startYear, returnRate: 0 };
  let worstYear = { year: settings.startYear, returnRate: 0 };
  let winYearsCount = 0;

  history.forEach(h => {
    if (h.annualReturn > bestYear.returnRate || h === history[0]) {
      bestYear = { year: h.year, returnRate: h.annualReturn };
    }
    if (h.annualReturn < worstYear.returnRate || h === history[0]) {
      worstYear = { year: h.year, returnRate: h.annualReturn };
    }
    if (h.annualReturn > 0) {
      winYearsCount++;
    }
  });

  const winYearRatio = yearsCount > 0 ? winYearsCount / yearsCount : 0;

  // Benchmarks Trajectory
  const kospiSim = simulateBenchmarkTrajectory(
    'kospi',
    settings.startYear,
    settings.endYear,
    initialCash,
    annualDeposit,
    settings.feeRate
  );
  const sp500Sim = simulateBenchmarkTrajectory(
    'sp500',
    settings.startYear,
    settings.endYear,
    initialCash,
    annualDeposit,
    settings.feeRate
  );
  const blendSim = simulateBenchmarkTrajectory(
    'blend5050',
    settings.startYear,
    settings.endYear,
    initialCash,
    annualDeposit,
    settings.feeRate
  );

  const kospiTwrEnd = kospiSim.twrIndexLevels[kospiSim.twrIndexLevels.length - 1];
  const sp500TwrEnd = sp500Sim.twrIndexLevels[sp500Sim.twrIndexLevels.length - 1];
  const blendTwrEnd = blendSim.twrIndexLevels[blendSim.twrIndexLevels.length - 1];

  const kospiTwrCAGR = yearsCount > 0 ? Math.pow(kospiTwrEnd / 100.0, 1.0 / yearsCount) - 1.0 : 0;
  const sp500TwrCAGR = yearsCount > 0 ? Math.pow(sp500TwrEnd / 100.0, 1.0 / yearsCount) - 1.0 : 0;
  const blendTwrCAGR = yearsCount > 0 ? Math.pow(blendTwrEnd / 100.0, 1.0 / yearsCount) - 1.0 : 0;

  const kospiTotalReturn = (kospiTwrEnd - 100.0) / 100.0;
  const sp500TotalReturn = (sp500TwrEnd - 100.0) / 100.0;
  const blendTotalReturn = (blendTwrEnd - 100.0) / 100.0;

  const kospiMDD = calculateMDD(kospiSim.twrIndexLevels);
  const sp500MDD = calculateMDD(sp500Sim.twrIndexLevels);
  const blendMDD = calculateMDD(blendSim.twrIndexLevels);

  // Final Allocation Breakdown
  let krHoldingVal = 0;
  let usHoldingVal = 0;
  let maxStockWeight = { canonicalId: '', nameKo: '없음', weight: 0 };
  const sectorWeights: Record<string, number> = {};

  for (const cid in holdings) {
    const h = holdings[cid];
    const s = STOCKS_BY_ID[cid];
    if (s && h.currentValueKRW > 0) {
      if (s.market === 'KR') krHoldingVal += h.currentValueKRW;
      else usHoldingVal += h.currentValueKRW;

      const w = finalPortfolioValue > 0 ? h.currentValueKRW / finalPortfolioValue : 0;
      if (w > maxStockWeight.weight) {
        maxStockWeight = { canonicalId: cid, nameKo: s.nameKo, weight: w };
      }

      sectorWeights[s.sector] = (sectorWeights[s.sector] || 0) + w;
    }
  }

  const krWeight = finalPortfolioValue > 0 ? krHoldingVal / finalPortfolioValue : 0;
  const usWeight = finalPortfolioValue > 0 ? usHoldingVal / finalPortfolioValue : 0;
  const cashWeight = finalPortfolioValue > 0 ? cashKRW / finalPortfolioValue : 0;

  const totalTradingFees = tradeLogs.reduce((sum, l) => sum + l.feeKRW, 0);
  const totalFxGainLossKRW = history.reduce((sum, h) => sum + h.fxContributionPnlKRW, 0);

  const scoreAndPersona = evaluateScoreAndPersona(
    twrCAGR,
    maxDrawdownMDD,
    kospiTwrCAGR,
    sp500TwrCAGR,
    tradeLogs.length,
    yearsCount,
    krWeight,
    usWeight,
    totalTradingFees,
    finalPortfolioValue,
    maxStockWeight.weight
  );

  // Calculate Chapter Survival Stats
  const chapterResults = state.chapterRiskMissionResults || {};
  let survivedChapters = 0;
  const totalChaptersCount = Math.min(9, Math.ceil(yearsCount / 5));

  for (const [_, missionResults] of Object.entries(chapterResults)) {
    if (missionResults.length > 0 && missionResults.every(r => r.passed)) {
      survivedChapters++;
    }
  }
  // Default to at least counting if not all failed
  if (Object.keys(chapterResults).length === 0) {
    survivedChapters = maxDrawdownMDD <= 0.4 ? totalChaptersCount : Math.max(1, totalChaptersCount - 2);
  }

  return {
    initialCapital: initialCash,
    totalDeposits,
    totalInvestedPrincipal,
    finalPortfolioValue,
    totalNetProfitKRW,
    simpleProfitRate,
    twr,
    twrCAGR,
    mwrIRR,
    annualVolatility,
    maxDrawdownMDD,
    drawdownPoints,
    recoveryMetrics,
    lossFromPeakKRW,
    allTimePeakPortfolioValueKRW,
    cpiAdjustedFinalValueKRW,
    cpiAdjustedTotalProfitKRW,
    winYearRatio,
    bestYear,
    worstYear,
    benchmarkComparison: {
      kospiFinalValue: kospiSim.finalPortfolioValue,
      kospiTwrCAGR,
      kospiMDD,
      kospiTotalReturn,
      kospiTwrIndexEnd: kospiTwrEnd,
      sp500FinalValue: sp500Sim.finalPortfolioValue,
      sp500TwrCAGR,
      sp500MDD,
      sp500TotalReturn,
      sp500TwrIndexEnd: sp500TwrEnd,
      blendFinalValue: blendSim.finalPortfolioValue,
      blendTwrCAGR,
      blendMDD,
      blendTotalReturn,
      blendTwrIndexEnd: blendTwrEnd,
      alphaVsPrimaryCAGR: twrCAGR - (settings.primaryBenchmark === 'kospi' ? kospiTwrCAGR : settings.primaryBenchmark === 'sp500' ? sp500TwrCAGR : blendTwrCAGR),
      valueDiffVsPrimaryKRW: finalPortfolioValue - (settings.primaryBenchmark === 'kospi' ? kospiSim.finalPortfolioValue : settings.primaryBenchmark === 'sp500' ? sp500Sim.finalPortfolioValue : blendSim.finalPortfolioValue),
      excessReturnVsPrimary: twrCAGR - (settings.primaryBenchmark === 'kospi' ? kospiTwrCAGR : settings.primaryBenchmark === 'sp500' ? sp500TwrCAGR : blendTwrCAGR),
      excessValueVsPrimary: finalPortfolioValue - (settings.primaryBenchmark === 'kospi' ? kospiSim.finalPortfolioValue : settings.primaryBenchmark === 'sp500' ? sp500Sim.finalPortfolioValue : blendSim.finalPortfolioValue),
      kospiSimHistory: kospiSim.history,
      sp500SimHistory: sp500Sim.history,
      blendSimHistory: blendSim.history,
    },
    finalAllocation: {
      krWeight,
      usWeight,
      cashWeight,
      sectorWeights,
      maxStockWeight,
    },
    totalTradingFeesKRW: totalTradingFees,
    totalFxGainLossKRW,
    totalTradesCount: tradeLogs.length,
    crisisDecisionHistory,
    chapterSurvivalCount: {
      survived: survivedChapters,
      total: Math.max(1, totalChaptersCount),
      safestEra: '2011~2015 (저금리 모바일 안정기)',
      riskiestEra: '1996~2000 (외환위기 & 닷컴버블)',
    },
    scoreAndPersona,
  };
}
