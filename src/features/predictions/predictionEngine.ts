import type {
  AnnualPrediction,
  PredictionEvaluation,
  CumulativeCalibrationMetrics,
  DirectionGuess
} from '../../types/prediction';
import type { YearlyPerformanceRecord } from '../../types/stockGame';

function evaluateDirection(guess: DirectionGuess, actualReturn: number): boolean | null {
  if (guess === 'UNKNOWN') return null;
  if (guess === 'UP') return actualReturn > 0.02;
  if (guess === 'DOWN') return actualReturn < -0.02;
  if (guess === 'FLAT') return Math.abs(actualReturn) <= 0.02;
  return null;
}

export function evaluateAnnualPrediction(
  prediction: AnnualPrediction,
  actualKospiReturn: number,
  actualSp500Return: number,
  actualUsdKrwChange: number
): PredictionEvaluation {
  const kospiCorrect = evaluateDirection(prediction.kospiDirection, actualKospiReturn);
  const sp500Correct = evaluateDirection(prediction.sp500Direction, actualSp500Return);
  const usdKrwCorrect = evaluateDirection(prediction.usdKrwDirection, actualUsdKrwChange);

  const evaluatedGuesses = [kospiCorrect, sp500Correct, usdKrwCorrect].filter(v => v !== null) as boolean[];
  const correctCount = evaluatedGuesses.filter(v => v === true).length;
  const accuracyRate = evaluatedGuesses.length > 0 ? correctCount / evaluatedGuesses.length : 0.5;

  const isOverconfident = prediction.confidence >= 75 && accuracyRate < 0.35;
  const isWellCalibrated =
    (prediction.confidence >= 70 && accuracyRate >= 0.7) ||
    (prediction.confidence <= 40 && accuracyRate <= 0.4);

  let feedbackKo = '';
  if (isOverconfident) {
    feedbackKo = '높은 확신도(75% 이상)에 비해 실제 시장 방향이 크게 빗나갔습니다. 시장의 불확실성을 더 열어두는 태도가 필요합니다.';
  } else if (accuracyRate >= 0.7) {
    feedbackKo = '당대 거시경제 및 시장 흐름을 높은 적중률로 파악했습니다.';
  } else if (prediction.kospiDirection === 'UNKNOWN' || prediction.sp500Direction === 'UNKNOWN') {
    feedbackKo = '불확실한 상황에서 무리한 예측 대신 신중한 판단 유보를 선택한 것은 훌륭한 위험관리입니다.';
  } else {
    feedbackKo = '예측과 실제 결과의 차이를 복기하며 투자 가설을 점검해 보세요.';
  }

  return {
    prediction,
    actualKospiReturn,
    actualSp500Return,
    actualUsdKrwChange,
    kospiCorrect,
    sp500Correct,
    usdKrwCorrect,
    accuracyRate,
    isOverconfident,
    isWellCalibrated,
    feedbackKo
  };
}

export function calculateCumulativeCalibrationMetrics(
  predictions: Record<number, AnnualPrediction>,
  history: YearlyPerformanceRecord[]
): CumulativeCalibrationMetrics {
  const predictionList = Object.values(predictions);
  if (predictionList.length === 0) {
    return {
      totalPredictionsCount: 0,
      directionAccuracyRate: 50,
      avgConfidence: 50,
      avgConfidenceWhenCorrect: 50,
      avgConfidenceWhenWrong: 50,
      overconfidenceIndex: 0,
      underconfidenceIndex: 0,
      calibrationScore: 70
    };
  }

  const evaluations: PredictionEvaluation[] = [];
  let totalConfidence = 0;
  let correctConfidenceSum = 0;
  let correctCount = 0;
  let wrongConfidenceSum = 0;
  let wrongCount = 0;
  let totalGuesses = 0;
  let totalCorrectGuesses = 0;

  predictionList.forEach(p => {
    const hist = history.find(h => h.year === p.year);
    if (hist) {
      const kospiRet = hist.benchmarkReturns?.kospi || 0;
      const sp500Ret = hist.benchmarkReturns?.sp500KRW || 0;
      const evalRes = evaluateAnnualPrediction(p, kospiRet, sp500Ret, 0);
      evaluations.push(evalRes);

      totalConfidence += p.confidence;
      [evalRes.kospiCorrect, evalRes.sp500Correct, evalRes.usdKrwCorrect].forEach(res => {
        if (res !== null) {
          totalGuesses++;
          if (res === true) {
            totalCorrectGuesses++;
            correctConfidenceSum += p.confidence;
            correctCount++;
          } else {
            wrongConfidenceSum += p.confidence;
            wrongCount++;
          }
        }
      });
    }
  });

  const accuracyRate = totalGuesses > 0 ? (totalCorrectGuesses / totalGuesses) * 100 : 50;
  const avgConfidence = predictionList.length > 0 ? totalConfidence / predictionList.length : 50;
  const avgConfidenceWhenCorrect = correctCount > 0 ? correctConfidenceSum / correctCount : avgConfidence;
  const avgConfidenceWhenWrong = wrongCount > 0 ? wrongConfidenceSum / wrongCount : avgConfidence;

  // Overconfidence index: how much confidence exceeds accuracy when wrong
  const overconfidenceIndex = Math.max(0, Math.round(avgConfidenceWhenWrong - accuracyRate));
  const underconfidenceIndex = Math.max(0, Math.round(accuracyRate - avgConfidenceWhenCorrect));

  // Calibration score: optimal 100 when confidence tracks accuracy closely
  const calibrationGap = Math.abs(avgConfidence - accuracyRate);
  const calibrationScore = Math.max(20, Math.min(100, Math.round(100 - calibrationGap * 0.8)));

  return {
    totalPredictionsCount: evaluations.length,
    directionAccuracyRate: Math.round(accuracyRate),
    avgConfidence: Math.round(avgConfidence),
    avgConfidenceWhenCorrect: Math.round(avgConfidenceWhenCorrect),
    avgConfidenceWhenWrong: Math.round(avgConfidenceWhenWrong),
    overconfidenceIndex,
    underconfidenceIndex,
    calibrationScore
  };
}
