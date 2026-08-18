import type { GameState } from '../types/finance';

/**
 * 나이대별 반기 저축액 계산 헬퍼 함수
 */
export function getSavingsForAge(age: number, baseSavings: number): number {
  if (age < 30) return baseSavings; // 25~29세: 1.0배 (사회초년생)
  if (age < 35) return Math.round(baseSavings * 1.8); // 30~34세: 1.8배 (승진/소득 상승)
  if (age < 45) return Math.round(baseSavings * 2.5); // 35~44세: 2.5배 (맞벌이/소득 전성기)
  if (age < 55) return Math.round(baseSavings * 1.8); // 45~54세: 1.8배 (교육비 피크 지출 증가)
  if (age < 65) return Math.round(baseSavings * 1.2); // 55~64세: 1.2배 (임금피크/은퇴 준비)
  return 0; // 65세 이상: 0원 (은퇴 생활기)
}

/**
 * 총 투자 원금 (초기 자산 + 연령대별 누적 자동 저축금 합산)
 */
export function calculateTotalInvested(state: GameState): number {
  let total = state.initialAsset;
  if (state.history && state.history.length > 0) {
    state.history.forEach((h) => {
      if (h.turn > 0) {
        const ageAtTurnStart = h.age - 0.5;
        total += getSavingsForAge(ageAtTurnStart, state.halfYearSavings);
      }
    });
  } else if (state.currentTurn > 0) {
    total += state.currentTurn * state.halfYearSavings;
  }
  return total;
}

/**
 * 누적 수익률 계산 (%): 총 투입 원금 대비 순자산 성장률
 */
export function calculateCumulativeReturn(netWorth: number, totalInvested: number): number {
  if (totalInvested <= 0) return 0;
  return parseFloat((((netWorth - totalInvested) / totalInvested) * 100).toFixed(2));
}

/**
 * 또래 평균 자산 계산 (반기 1.75% 복리 기준)
 */
export function calculatePeerWorth(state: GameState): number {
  let peerWorth = state.initialAsset;
  if (state.history && state.history.length > 0) {
    state.history.forEach((h) => {
      if (h.turn > 0) {
        const ageAtTurnStart = h.age - 0.5;
        const turnSavings = getSavingsForAge(ageAtTurnStart, state.halfYearSavings);
        peerWorth = (peerWorth + turnSavings) * 1.0175;
      }
    });
  } else {
    for (let i = 0; i < state.currentTurn; i++) {
      peerWorth = (peerWorth + state.halfYearSavings) * 1.0175;
    }
  }
  return Math.round(peerWorth);
}
