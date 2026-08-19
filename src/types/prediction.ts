/**
 * Annual Prediction and Calibration Types
 */

export type DirectionGuess = 'UP' | 'FLAT' | 'DOWN' | 'UNKNOWN';

export interface AnnualPrediction {
  year: number;
  kospiDirection: DirectionGuess;
  sp500Direction: DirectionGuess;
  usdKrwDirection: DirectionGuess;
  selectedSector?: string;
  confidence: number; // 20 to 100
  rationale?: string;
  createdAtDecisionDate: string;
  locked: boolean;
}

export interface PredictionEvaluation {
  prediction: AnnualPrediction;
  actualKospiReturn: number;
  actualSp500Return: number;
  actualUsdKrwChange: number;
  kospiCorrect: boolean | null; // null if UNKNOWN
  sp500Correct: boolean | null;
  usdKrwCorrect: boolean | null;
  accuracyRate: number; // 0.0 to 1.0
  isOverconfident: boolean; // High confidence (>70%) but wrong
  isWellCalibrated: boolean;
  feedbackKo: string;
}

export interface CumulativeCalibrationMetrics {
  totalPredictionsCount: number;
  directionAccuracyRate: number; // 0 to 100%
  avgConfidence: number; // 0 to 100%
  avgConfidenceWhenCorrect: number;
  avgConfidenceWhenWrong: number;
  overconfidenceIndex: number; // Higher means overestimating accuracy
  underconfidenceIndex: number;
  calibrationScore: number; // 0 to 100, optimal when confidence tracks accuracy
}
