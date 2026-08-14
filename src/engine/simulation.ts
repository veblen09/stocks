import type { GameState } from '../types/finance';
import { SeededRandom } from './seededRandom';
import { ASSETS } from '../data/assets';
import { STOCK_HISTORICAL_RETURNS } from '../data/stockHistoricalData';
import { HOUSING_HISTORICAL_RETURNS } from '../data/housingHistoricalData';

/**
 * 6개월(1턴) 진행 시 자산별 가치 변동 및 금융 요소를 계산하는 엔진
 */
export function runTurnSimulation(
  state: GameState,
  rng: SeededRandom
): {
  newAllocations: { [assetId: string]: number };
  actualReturns: { [assetId: string]: number };
  inflationRate: number;
  feesAndTaxes: number;
} {
  const { difficulty, allocations, simulationLength, currentTurn } = state;
  
  // 난이도별 변동성 배율
  let difficultyVolMultiplier = 1.0;
  if (difficulty === 'stable') difficultyVolMultiplier = 0.5;
  if (difficulty === 'volatile') difficultyVolMultiplier = 1.8;

  // 물가상승률 (인플레이션율) 연산: 반기 기본 1.0% ~ 2.2% 변동
  const inflationRate = parseFloat(rng.range(1.0, 2.2).toFixed(2));


  const newAllocations: { [assetId: string]: number } = {};
  const actualReturns: { [assetId: string]: number } = {};
  let totalFeesAndTaxes = 0;

  // 각 자산별 수익률 계산
  ASSETS.forEach((asset) => {
    const currentValue = allocations[asset.id] || 0;
    if (currentValue <= 0) {
      newAllocations[asset.id] = 0;
      actualReturns[asset.id] = 0;
      return;
    }

    let returnRate = 0;

    // 안전자산군과 투자자산군의 수익률 산출 모델 차별화
    if (asset.category === 'cash') {
      // 입출금: 금리 안정적 (연 1.5% -> 반기 0.75% 고정 수준 + 극소 변동)
      returnRate = 0.75 + rng.range(-0.1, 0.1);
    } else if (asset.id === 'housing') {
      // 주택청약: 소득공제 목적성 저축 (반기 1.25% 고정 수준)
      returnRate = 1.25;
    } else if (asset.category === 'savings') {
      // 예적금: 확정형 이자 (예적금 가입 시점 고정이지만, 6개월 롤링으로 연수익률/2 근사치)
      const halfExpected = asset.expectedReturn / 2;
      returnRate = halfExpected + rng.range(-0.05, 0.05);
    } else if (asset.id.startsWith('stock_')) {
      // 세분화된 대표 개별 주식 (삼성전자, SK하이닉스, 현대차, 애플, 엔비디아, 테슬라)
      // 실험기간(10년, 20년, 30년)별 과거 실제 주가 추이 매핑 + 난수 변동성
      const stockTrend = STOCK_HISTORICAL_RETURNS[asset.id];
      const validYears = (simulationLength === 10 || simulationLength === 30) ? simulationLength : 20;
      const historyArr = stockTrend?.[validYears] || stockTrend?.[20] || [];
      
      const turnIdx = Math.min(currentTurn, historyArr.length - 1);
      const baseHistoricalReturn = historyArr[turnIdx] !== undefined ? historyArr[turnIdx] : (asset.expectedReturn / 2);
      
      // 실제 주가 궤적 + 게임 난수(±1.5%) + 난이도 변동성 적용
      const noise = rng.range(-1.5, 1.5) * difficultyVolMultiplier;
      returnRate = baseHistoricalReturn + noise;

      // 개별 돌발 변동성 (3% 확률로 개별 호재/악재 발생)
      const suddenShock = rng.next();
      if (suddenShock < 0.03) {
        returnRate -= rng.range(15, 30);
      } else if (suddenShock > 0.97) {
        returnRate += rng.range(20, 35);
      }
    } else if (asset.id === 'house') {
      // 실물 주택 (부동산 아파트 시세 변동)
      // 실험기간(10년, 20년, 30년) 및 구입한 지역(강남, 마포, 분당, 경기 외곽 등)별 과거 실제 부동산 가격 추이 매핑
      const regionKey = state.houseRegion || 'bundang';
      const housingTrend = HOUSING_HISTORICAL_RETURNS[regionKey];
      const validYears = (simulationLength === 10 || simulationLength === 30) ? simulationLength : 20;
      const historyArr = housingTrend?.[validYears] || housingTrend?.[20] || [];
      
      const turnIdx = Math.min(currentTurn, historyArr.length - 1);
      const baseHistoricalReturn = historyArr[turnIdx] !== undefined ? historyArr[turnIdx] : (asset.expectedReturn / 2);
      
      // 실제 부동산 시세 궤적 + 미세 난수(±0.5%) + 난이도 변동성 적용
      const noise = rng.range(-0.5, 0.5) * difficultyVolMultiplier;
      returnRate = baseHistoricalReturn + noise;
    } else if (asset.id === 'rent_deposit') {
      // 부동산 임차보증금 (전월세 보증금은 원금이 보전되는 고정 자산으로 수익률 0% 유지)
      returnRate = 0;
    } else {
      // 기타 투자 자산군 (국내ETF, 해외ETF, 채권, 금, 연금)
      const halfYearReturn = asset.expectedReturn / 2;
      // 반기 변동성 = 연변동성 / sqrt(2)
      const halfYearVolatility = (asset.volatility / Math.sqrt(2)) * difficultyVolMultiplier;
      
      // 정규분포를 따르는 반기 수익률 추출
      returnRate = rng.normal(halfYearReturn, halfYearVolatility);

      // 금은 시장 위기나 물가 급등 시 상승 부스트 (게임 내 시뮬레이션용 단순 보정)
      if (asset.id === 'gold' && inflationRate > 1.8) {
        returnRate += rng.range(1.0, 3.0); // 인플레이션 헤지 보너스
      }
    }

    // 소수점 둘째자리 반올림
    returnRate = parseFloat(returnRate.toFixed(2));
    actualReturns[asset.id] = returnRate;

    // 평가액 계산
    let newValue = currentValue * (1 + returnRate / 100);

    // 세금 및 수수료 모의 계산
    let feeAndTax = 0;
    
    // 1. 수수료 (거래 비용): 투자성 자산 대상 반기 0.05%~0.15% 가상 수수료 부과
    if (asset.category === 'equity' || asset.category === 'commodity') {
      const feeRate = 0.001; // 0.1% 수수료
      feeAndTax += currentValue * feeRate;
    }

    // 2. 세금: 이익이 났을 경우 (수익금 > 0)
    const profit = newValue - currentValue;
    if (profit > 0) {
      if (asset.id === 'pension') {
        // 연금저축/IRP는 연금수령 시까지 과세 이연 (세금 0원!)
        // 학생들에게 세제 혜택 교육 목적으로 생략
      } else if (asset.category === 'savings' || asset.category === 'equity' || asset.id === 'bond') {
        // 일반 예금 및 투자 상품은 이자소득세/배당소득세 등 15.4% 부과
        const taxRate = 0.154;
        feeAndTax += profit * taxRate;
      }
    }

    newValue -= feeAndTax;
    totalFeesAndTaxes += feeAndTax;

    // 자산 가치가 0 이하로 떨어지는 것을 방지 (원금 손실 한도는 자산 총액)
    newAllocations[asset.id] = parseFloat(Math.max(0, newValue).toFixed(2));
  });

  return {
    newAllocations,
    actualReturns,
    inflationRate,
    feesAndTaxes: parseFloat(totalFeesAndTaxes.toFixed(2))
  };
}
