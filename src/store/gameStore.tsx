import React, { createContext, useContext, useState, useEffect } from 'react';
import type { GameState, Choice, GameEvent, TurnHistory } from '../types/finance';
import { EVENTS } from '../data/events';
import { SeededRandom } from '../engine/seededRandom';
import { runTurnSimulation } from '../engine/simulation';
import { calculateFinalScores } from '../engine/scoring';
import { formatMoney } from '../utils/formatMoney';
import { audioManager } from '../utils/audioManager';

// 나이대별 저축액 계산 헬퍼 함수
export function getSavingsForAge(age: number, baseSavings: number): number {
  if (age < 30) return baseSavings; // 25~29세: 1.0배 (사회초년생)
  if (age < 35) return Math.round(baseSavings * 1.8); // 30~34세: 1.8배 (승진/소득 상승)
  if (age < 45) return Math.round(baseSavings * 2.5); // 35~44세: 2.5배 (맞벌이/소득 전성기)
  if (age < 55) return Math.round(baseSavings * 1.8); // 45~54세: 1.8배 (교육비 피크 지출 증가)
  if (age < 65) return Math.round(baseSavings * 1.2); // 55~64세: 1.2배 (임금피크/은퇴 준비)
  return 0; // 65세 이상: 0원 (은퇴 생활기)
}

interface GameContextType {
  state: GameState;
  startGame: (
    nickname: string,
    startAge: number,
    initialAsset: number,
    halfYearSavings: number,
    difficulty: 'stable' | 'normal' | 'volatile',
    simulationLength: number,
    goalAsset?: number,
    scenario?: 'standard' | 'inflation' | 'bubble' | 'turbulent'
  ) => void;
  allocateAndNextTurn: (allocationsChange: { [assetId: string]: number }) => void;
  selectChoice: (choice: Choice) => void;
  markAssetAsViewed: (assetId: string) => void;
  processMaturity: (decisions: { [assetId: string]: 'reinvest' | 'withdraw' }) => void;
  repayLoan: (type: 'credit' | 'mortgage', amount: number) => void;
  liquidateHousing: () => void;
  toggleHousingActive: () => void;
  sellHouse: () => void;
  buyHouse: (region: 'gangnam' | 'mapo' | 'bundang' | 'gyeonggi_outer', price: number) => void;
  clearLastEventResult: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'money_track_game_state';

const initialGameState: GameState = {
  nickname: '',
  startAge: 25,
  initialAsset: 1000,
  halfYearSavings: 300,
  difficulty: 'normal',
  simulationLength: 20,
  goalAsset: 3000,
  scenario: 'standard',
  currentTurn: 0,
  currentAge: 25,
  cash: 1000, // 시작 시 초기 자산은 모두 현금 상태
  allocations: {
    cash: 1000,
    deposit: 0,
    saving: 0,
    korea_etf: 0,
    global_etf: 0,
    stock_samsung: 0,
    stock_skhynix: 0,
    stock_hyundai: 0,
    stock_apple: 0,
    stock_nvidia: 0,
    stock_tesla: 0,
    bond: 0,
    gold: 0,
    pension: 0,
    housing: 0,
    rent_deposit: 0,
    house: 0
  },
  loans: {
    credit: 0,
    mortgage: 0
  },
  history: [],
  seed: 12345,
  isGameOver: false,
  scores: null,
  currentEvent: null,
  lastEventResult: null,
  viewedAssets: [],
  processedMaturityTurn: 0,
  isHousingActive: true,
  houseRegion: undefined
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 하위 호환성 유지: 이전 세이브 파일에 대출 및 청약 상태 필드가 없는 경우 보정
        if (!parsed.loans) {
          parsed.loans = { credit: 0, mortgage: 0 };
        }
        if (parsed.isHousingActive === undefined) {
          parsed.isHousingActive = true;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved game state', e);
      }
    }
    return initialGameState;
  });

  // 로컬 스토리지 자동 저장 동기화
  useEffect(() => {
    if (state.nickname) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [state]);

  // 게임 시작
  const startGame = (
    nickname: string,
    startAge: number,
    initialAsset: number,
    halfYearSavings: number,
    difficulty: 'stable' | 'normal' | 'volatile',
    simulationLength: number,
    goalAsset?: number,
    scenario?: 'standard' | 'inflation' | 'bubble' | 'turbulent'
  ) => {
    const randomSeed = Math.floor(Math.random() * 1000000) + 1;
    
    // 초기 allocations 설정 (초기 자산은 cash에 전부 배분)
    const initialAllocations = { ...initialGameState.allocations, cash: initialAsset };
    
    // 첫 턴 기록 등록 (시작 시점)
    const initialHistoryItem: TurnHistory = {
      turn: 0,
      age: startAge,
      netWorth: initialAsset,
      cash: initialAsset,
      invested: 0,
      returnRate: 0,
      mdd: 0,
      allocation: initialAllocations,
      loans: { credit: 0, mortgage: 0 },
      event: null
    };

    // 시작 나이대에 맞는 첫 반기 저축액 계산
    const startingSavings = getSavingsForAge(startAge, halfYearSavings);

    const newState: GameState = {
      nickname: nickname || '학생',
      startAge,
      initialAsset,
      halfYearSavings, // 기입 설정된 기본(Base) 반기 저축액
      difficulty,
      simulationLength,
      goalAsset: goalAsset || 3000,
      scenario: scenario || 'standard',
      currentTurn: 0,
      currentAge: startAge,
      cash: startingSavings, // 첫 투자 배분 턴에는 나이대에 보정된 첫 저축액으로 시작
      allocations: initialAllocations,
      loans: { credit: 0, mortgage: 0 },
      history: [initialHistoryItem],
      seed: randomSeed,
      isGameOver: false,
      scores: null,
      currentEvent: null,
      lastEventResult: null,
      viewedAssets: [],
      processedMaturityTurn: 0,
      isHousingActive: true,
      houseRegion: undefined
    };

    setState(newState);
  };

  // 자산 배분 후 다음 턴 진행
  const allocateAndNextTurn = (allocationsChange: { [assetId: string]: number }) => {
    // 1. 배분 변경 사항을 반영하여 새로운 보유고 설정
    const updatedAllocations = { ...state.allocations };
    
    let penaltyFee = 0;
    Object.keys(allocationsChange).forEach((assetId) => {
      const currentVal = updatedAllocations[assetId] || 0;
      const change = allocationsChange[assetId];
      
      // 정기예금/적금 만기 전 해지 페널티 (인출 금액의 2.0% 차감)
      if (change < 0 && (assetId === 'deposit' || assetId === 'saving')) {
        penaltyFee += Math.abs(change) * 0.02;
      }

      updatedAllocations[assetId] = parseFloat((currentVal + change).toFixed(2));
    });

    // 중도해지 패널티가 존재할 경우 비상금(cash)에서 즉시 차감
    if (penaltyFee > 0) {
      const currentEmergencyCash = updatedAllocations['cash'] || 0;
      updatedAllocations['cash'] = parseFloat(Math.max(0, currentEmergencyCash - penaltyFee).toFixed(2));
    }

    // A. 대출 반기 이자 비용 지출 연산 (신용대출: 반기 3.0%, 담보대출: 반기 1.75% 복합 연산)
    const interestCost = parseFloat(((state.loans.credit * 0.030) + (state.loans.mortgage * 0.0175)).toFixed(2));
    let unpaidInterestDeficit = 0;
    let liquidatedAssetsForInterestText = '';

    if (interestCost > 0) {
      let currentEmergencyCash = updatedAllocations['cash'] || 0;
      if (currentEmergencyCash >= interestCost) {
        updatedAllocations['cash'] = parseFloat((currentEmergencyCash - interestCost).toFixed(2));
      } else {
        // 비상금이 이자보다 부족한 경우: 기존 보유 투자 자산을 순차 자동 매각하여 이자 충당!
        let needed = parseFloat((interestCost - currentEmergencyCash).toFixed(2));
        updatedAllocations['cash'] = 0;

        // 유동성 점수(liquidityScore) 내림차순 정렬 (유동성이 가장 높은 자산부터 우선 매도하여 대출 이자 상환)
        const sortedAssets = [...ASSETS]
          .filter(a => a.id !== 'cash' && a.id !== 'house' && a.id !== 'rent_deposit' && a.id !== 'housing')
          .sort((a, b) => b.liquidityScore - a.liquidityScore);

        const soldDetails: string[] = [];

        for (const assetObj of sortedAssets) {
          if (needed <= 0) break;
          const assetId = assetObj.id;
          const currentBal = updatedAllocations[assetId] || 0;
          if (currentBal > 0) {
            const sellAmt = Math.min(currentBal, needed);
            updatedAllocations[assetId] = parseFloat((currentBal - sellAmt).toFixed(2));
            needed = parseFloat((needed - sellAmt).toFixed(2));
            soldDetails.push(`${assetObj.name} ${formatMoney(sellAmt)}`);
          }
        }

        if (soldDetails.length > 0) {
          liquidatedAssetsForInterestText = ` (부족한 이자를 위해 ${soldDetails.join(', ')} 자산을 매각함)`;
        }

        if (needed > 0) {
          // 모든 금융 자산을 다 매각해도 부족한 남아있는 이자 부족액
          unpaidInterestDeficit = needed;
        }
      }
    }

    // 미납 대출 이자를 연체 가산금(5%)과 함께 신용대출 원금에 복리로 가산!
    let nextLoans = { ...state.loans };
    let overdueCompoundedText = '';
    if (unpaidInterestDeficit > 0) {
      const overduePenalty = parseFloat((unpaidInterestDeficit * 0.05).toFixed(2));
      const compoundedAmount = parseFloat((unpaidInterestDeficit + overduePenalty).toFixed(2));
      nextLoans.credit = parseFloat((nextLoans.credit + compoundedAmount).toFixed(2));
      overdueCompoundedText = ` (미납 이자 ${formatMoney(unpaidInterestDeficit)} + 연체 가산금 ${formatMoney(overduePenalty)} = 총 ${formatMoney(compoundedAmount)}이 신용대출 원금에 가산됨)`;
    }

    // B. 주택청약 자동 납입 연산 (활성화 상태일 경우 매 턴 비상금에서 60만 원 자동 이체)
    let autoHousingDeducted = false;
    let autoHousingFailed = false;
    if (state.isHousingActive !== false) {
      const currentEmergencyCash = updatedAllocations['cash'] || 0;
      if (currentEmergencyCash >= 60) {
        updatedAllocations['cash'] = parseFloat((currentEmergencyCash - 60).toFixed(2));
        updatedAllocations['housing'] = parseFloat(((updatedAllocations['housing'] || 0) + 60).toFixed(2));
        autoHousingDeducted = true;
      } else {
        autoHousingFailed = true;
      }
    }

    // 2. 난수 엔진 로드
    const rng = new SeededRandom(state.seed + state.currentTurn);

    // 3. 시뮬레이션 계산 실행 (수익률, 물가, 세금 등)
    const tempState = { ...state, allocations: updatedAllocations };
    const simResult = runTurnSimulation(tempState, rng);

    // 4. 새로운 현금 잔고 계산
    const nextAge = state.currentAge + 0.5;
    const baseNextCash = getSavingsForAge(nextAge, state.halfYearSavings);
    const nextCashToAllocate = parseFloat(Math.max(0, baseNextCash).toFixed(2));
    
    // 다음 턴 allocations 기본 세팅
    const finalAllocationsForNextTurn = { ...simResult.newAllocations };

    // 총 자산 가치 계산 (대차대조표 기준: 순자산 = 총자산 - 부채)
    let totalAssetsVal = 0;
    let investedVal = 0;
    Object.keys(simResult.newAllocations).forEach((id) => {
      totalAssetsVal += simResult.newAllocations[id];
      if (id !== 'cash') {
        investedVal += simResult.newAllocations[id];
      }
    });

    const currentLoansTotal = nextLoans.credit + nextLoans.mortgage;
    const newNetWorth = parseFloat((totalAssetsVal - currentLoansTotal).toFixed(2));

    // 🚨 파산 (Bankruptcy) 조건 검사: 순자산 0 이하 (자본 잠식 및 부채가 총자산 초과)
    const isBankrupt = newNetWorth <= 0 || (unpaidInterestDeficit > 0 && totalAssetsVal <= 0);

    const previousNetWorth = state.history[state.history.length - 1]?.netWorth || state.initialAsset;
    const turnReturnRate = parseFloat((((newNetWorth - previousNetWorth) / previousNetWorth) * 100).toFixed(2));

    // 최대 낙폭(MDD) 연산
    let peak = state.initialAsset;
    state.history.forEach((h) => {
      if (h.netWorth > peak) peak = h.netWorth;
    });
    if (newNetWorth > peak) peak = newNetWorth;
    const currentMdd = parseFloat((((peak - newNetWorth) / peak) * 100).toFixed(2));

    // 이번 턴의 기록 생성
    const nextTurnIndex = state.currentTurn + 1;
    
    // 이벤트 발생 여부 결정
    let triggeredEvent: GameEvent | null = null;
    const hasEvent = rng.next() < 0.85; // 85% 확률
    
    // 시나리오 우선 이벤트 리스트 정의
    const SCENARIO_EVENTS: { [key: string]: string[] } = {
      inflation: ['inflation_shock', 'rate_up', 'exchange_spike', 'gold_rush', 'oil_price_surge', 'rate_down', 'lease_raise', 'pension_tax_refund', 'tax_reform', 'overseas_stock_tax_notice'],
      bubble: ['korea_bull', 'global_crash', 'stock_crash_one', 'crypto_craze', 'ai_revolution', 'dividend_payout', 'semiconductor_downcycle', 'unlisted_stock_scam', 'sns_fomo_luxury', 'patience_test', 'theme_stock', 'rate_down', 'rate_up'],
      turbulent: ['job_promotion', 'medical_emergency', 'appliance_breakdown', 'side_hustle_success', 'marriage_expense', 'child_education_planning', 'mortgage_refinancing_chance', 'isa_tax_exemption', 'bank_failure_panic', 'buy_car', 'independent_living', 'voice_phishing', 'scam_offer', 'housing_subscription_chance', 'lease_raise', 'jeonse_fraud_prevention']
    };

    if (hasEvent) {
      const hasHouse = (finalAllocationsForNextTurn['house'] || 0) > 0;
      const tenantOnlyEventIds = ['independent_living', 'lease_raise', 'housing_subscription_chance', 'buy_house_opportunity', 'jeonse_fraud_prevention'];
      
      // 주택 소유 여부 판별에 따른 기본 이벤트 풀 구성
      const basePool = hasHouse
        ? EVENTS.filter((e) => !tenantOnlyEventIds.includes(e.id))
        : EVENTS;

      const usedEventTitles = state.history
        .map((h) => h.event?.title)
        .filter(Boolean);
      
      // 아직 한 번도 등장하지 않은 이벤트 검색
      let availableEvents = basePool.filter((e) => !usedEventTitles.includes(e.title));

      // 15~16년차(약 30턴) 이후 모든 이벤트가 1회 이상 소진된 경우: 최근 8턴(4년) 이내 등장한 이벤트만 제외하여 연속 중복 방지
      if (availableEvents.length === 0) {
        const recentEventTitles = state.history
          .slice(-8)
          .map((h) => h.event?.title)
          .filter(Boolean);

        availableEvents = basePool.filter((e) => !recentEventTitles.includes(e.title));

        // 혹시 8턴 이내에도 남은 이벤트가 부족하면 직전 턴 이벤트라도 연속으로 뜨지 않도록 방지
        if (availableEvents.length === 0 && state.history.length > 0) {
          const lastTitle = state.history[state.history.length - 1]?.event?.title;
          availableEvents = basePool.filter((e) => e.title !== lastTitle);
        }
      }
      
      const selectedScenario = state.scenario || 'standard';
      if (selectedScenario !== 'standard' && SCENARIO_EVENTS[selectedScenario]) {
        const priorityIds = SCENARIO_EVENTS[selectedScenario];
        const priorityEvents = availableEvents.filter(e => priorityIds.includes(e.id));
        if (priorityEvents.length > 0) {
          availableEvents = priorityEvents;
        }
      }

      if (availableEvents.length > 0) {
        triggeredEvent = rng.choice(availableEvents);
      } else {
        triggeredEvent = rng.choice(basePool.length > 0 ? basePool : EVENTS);
      }
    }

    const currentHistoryItem: TurnHistory = {
      turn: nextTurnIndex,
      age: nextAge,
      netWorth: parseFloat(newNetWorth.toFixed(2)),
      cash: parseFloat(simResult.newAllocations['cash'].toFixed(2)),
      invested: parseFloat(investedVal.toFixed(2)),
      returnRate: turnReturnRate,
      mdd: currentMdd,
      allocation: { ...simResult.newAllocations },
      loans: { ...state.loans },
      actualReturns: { ...simResult.actualReturns },
      event: null
    };

    const isNextGameOver = isBankrupt || (nextTurnIndex >= state.simulationLength * 2);

    // 자동 정산 피드백 텍스트 생성
    let autoResultText = '';
    if (isBankrupt) {
      autoResultText += `🚨 [금융 파산 (Bankruptcy) 발생] 대출 이자 미납 및 누적으로 총부채(${formatMoney(currentLoansTotal)})가 총자산(${formatMoney(totalAssetsVal)})을 초과하여 파산 상태에 도달했습니다. 재정이 파산함에 따라 모의 시뮬레이션이 조기 종료됩니다. `;
    }
    if (penaltyFee > 0) {
      autoResultText += `• 예적금 중도해지 수수료 ${formatMoney(penaltyFee)}가 차감되었습니다. `;
    }
    if (interestCost > 0) {
      if (unpaidInterestDeficit > 0) {
        autoResultText += `• 🚨 이번 반기 대출 이자비용(${formatMoney(interestCost)})을 상환할 비상금 및 보유 자산이 부족하여,${overdueCompoundedText} 신용대출 원금에 복리로 가산되었습니다! (다음 턴 이자 부담 증가) `;
      } else if (liquidatedAssetsForInterestText) {
        autoResultText += `• 💡 이번 반기 대출 이자비용 ${formatMoney(interestCost)} 납부를 위해${liquidatedAssetsForInterestText}이 정상 출금되었습니다. `;
      } else {
        autoResultText += `• 이번 반기 대출 이자비용 ${formatMoney(interestCost)}가 비상금 통장에서 자동 출금되었습니다. `;
      }
    }
    if (autoHousingDeducted) {
      autoResultText += `• 주택청약 자동 납입액 60만 원이 비상금 통장에서 저축되었습니다. `;
    }
    if (autoHousingFailed) {
      autoResultText += `• 🚨 비상금 잔액 부족으로 이번 턴 주택청약 자동 납입(60만 원)이 실패(유예)되었습니다. `;
    }
    
    // 저축액 변화 안내 추가
    const currentTurnSavings = getSavingsForAge(state.currentAge, state.halfYearSavings);
    const nextTurnSavings = getSavingsForAge(nextAge, state.halfYearSavings);
    if (currentTurnSavings !== nextTurnSavings) {
      if (nextTurnSavings === 0) {
        autoResultText += `• 👴 65세 은퇴 시점에 도달하여, 더 이상 반기 자동 저축액이 발생하지 않습니다. 모으신 연금과 자산 포트폴리오를 운용하여 은퇴 생활을 유지하십시오! `;
      } else {
        autoResultText += `• 📈 나이에 따른 소득 보정으로 반기 저축액이 기존 ${formatMoney(currentTurnSavings)}에서 ${formatMoney(nextTurnSavings)}으로 변동되었습니다. `;
      }
    }

    const nextState: GameState = {
      ...state,
      currentTurn: nextTurnIndex,
      currentAge: nextAge,
      cash: nextCashToAllocate,
      allocations: finalAllocationsForNextTurn,
      history: [...state.history, currentHistoryItem],
      currentEvent: triggeredEvent,
      lastEventResult: autoResultText ? {
        title: '💸 금융거래 및 나이별 저축액 고지',
        choiceText: '턴 진행에 따른 자동 연산',
        resultText: autoResultText.trim()
      } : null,
      isGameOver: isNextGameOver,
      scores: null
    };

    if (isNextGameOver) {
      const finalScores = calculateFinalScores(nextState);
      
      let sumDecision = 50;
      nextState.history.forEach((h) => {
        if (h.event?.choiceMade) {
          const eventMatch = EVENTS.find(e => e.title === h.event?.title);
          const choiceMatch = eventMatch?.choices.find(c => c.text === h.event?.choiceMade);
          if (choiceMatch?.scoreChange?.decision) {
            sumDecision += choiceMatch.scoreChange.decision;
          }
        }
      });
      finalScores.decisionScore = Math.max(0, Math.min(100, sumDecision));
      nextState.scores = finalScores;
    }

    setState(nextState);
  };

  // 이벤트 선택지 클릭 시 결과 처리
  const selectChoice = (choice: Choice) => {
    if (!state.currentEvent) return;

    const currentEventName = state.currentEvent.title;
    const updatedAllocations = { ...state.allocations };
    let cashChangeVal = choice.cashChange || 0;

    // 자산 가치 변화 적용 (예: 주식 -40% 폭락 등)
    if (choice.impact) {
      Object.keys(choice.impact).forEach((assetId) => {
        const val = updatedAllocations[assetId] || 0;
        const multiplier = choice.impact![assetId];
        
        // 연금이나 청약 해지 등의 특수 처리 (impact가 -1.0이면 자산 전액 몰수 후 cash로 전환)
        if (multiplier === -1.0) {
          cashChangeVal += val; // 원금이 현금으로 전환됨
          updatedAllocations[assetId] = 0;
        } else {
          updatedAllocations[assetId] = parseFloat((val * (1 + multiplier)).toFixed(2));
        }
      });
    }

    // 정량 자산 변화량 적용
    if (choice.flatAssetChange) {
      Object.keys(choice.flatAssetChange).forEach((assetId) => {
        const currentVal = updatedAllocations[assetId] || 0;
        const flatChange = choice.flatAssetChange![assetId];
        if (flatChange < 0) {
          const actualReduction = Math.min(currentVal, -flatChange);
          cashChangeVal += actualReduction;
          updatedAllocations[assetId] = parseFloat((currentVal - actualReduction).toFixed(2));
        } else {
          updatedAllocations[assetId] = parseFloat((currentVal + flatChange).toFixed(2));
        }
      });
    }

    // 대출(부채) 증감 적용 (예: 주택 구입 시 담보대출 +20,000만 원 등)
    let nextLoans = { ...state.loans };
    if (choice.loanChange) {
      Object.keys(choice.loanChange).forEach((type) => {
        const key = type as 'credit' | 'mortgage';
        const change = choice.loanChange![key] || 0;
        nextLoans[key] = parseFloat(Math.max(0, nextLoans[key] + change).toFixed(2));
      });
    }

    // 현금 변동분을 allocations['cash']에 직접 반영
    let newCash = state.cash;
    if (cashChangeVal > 0) {
      updatedAllocations['cash'] = parseFloat(((updatedAllocations['cash'] || 0) + cashChangeVal).toFixed(2));
    } else if (cashChangeVal < 0) {
      const currentEmergencyCash = updatedAllocations['cash'] || 0;
      const loss = -cashChangeVal;
      if (currentEmergencyCash >= loss) {
        updatedAllocations['cash'] = parseFloat((currentEmergencyCash - loss).toFixed(2));
      } else {
        updatedAllocations['cash'] = 0;
        const remainderLoss = parseFloat((loss - currentEmergencyCash).toFixed(2));
        newCash = parseFloat(Math.max(0, newCash - remainderLoss).toFixed(2));
      }
    }

    // 히스토리의 가장 최근 항목 업데이트
    const updatedHistory = [...state.history];
    if (updatedHistory.length > 0) {
      const lastIndex = updatedHistory.length - 1;
      const lastHistoryItem = updatedHistory[lastIndex];
      
      const newHistoryAllocation = { ...lastHistoryItem.allocation };
      const newHistoryActualReturns = { ...lastHistoryItem.actualReturns };

      Object.keys(updatedAllocations).forEach((assetId) => {
        newHistoryAllocation[assetId] = updatedAllocations[assetId];
      });

      if (choice.impact) {
        Object.keys(choice.impact).forEach((assetId) => {
          const multiplier = choice.impact![assetId];
          const hadAsset = (lastHistoryItem.allocation[assetId] || 0) > 0;
          if (hadAsset || assetId === 'cash') {
            const prevReturn = lastHistoryItem.actualReturns?.[assetId] || 0;
            const finalReturn = parseFloat((((1 + prevReturn / 100) * (1 + multiplier) - 1) * 100).toFixed(2));
            newHistoryActualReturns[assetId] = finalReturn;
          } else {
            newHistoryActualReturns[assetId] = 0;
          }
        });
      }

      const totalAssets = Object.values(updatedAllocations).reduce((a, b) => a + b, 0);
      const totalLoans = nextLoans.credit + nextLoans.mortgage;

      updatedHistory[lastIndex] = {
        ...lastHistoryItem,
        netWorth: parseFloat((totalAssets - totalLoans).toFixed(2)),
        cash: updatedAllocations['cash'],
        invested: parseFloat(Object.keys(updatedAllocations).filter(k => k !== 'cash').reduce((sum, k) => sum + updatedAllocations[k], 0).toFixed(2)),
        allocation: newHistoryAllocation,
        loans: nextLoans,
        actualReturns: newHistoryActualReturns,
        event: {
          title: currentEventName,
          choiceMade: choice.text,
          resultDescription: choice.resultDescription
        }
      };
    }

    const nextState: GameState = {
      ...state,
      cash: newCash < 0 ? 0 : newCash,
      allocations: updatedAllocations,
      loans: nextLoans,
      history: updatedHistory,
      houseRegion: choice.houseRegion !== undefined ? choice.houseRegion : state.houseRegion,
      lastEventResult: {
        title: currentEventName,
        choiceText: choice.text,
        resultText: choice.resultDescription
      },
      currentEvent: null
    };

    if (state.isGameOver) {
      const finalScores = calculateFinalScores(nextState);
      
      let sumDecision = 50;
      updatedHistory.forEach((h) => {
        if (h.event?.choiceMade) {
          const eventMatch = EVENTS.find(e => e.title === h.event?.title);
          const choiceMatch = eventMatch?.choices.find(c => c.text === h.event?.choiceMade);
          if (choiceMatch?.scoreChange?.decision) {
            sumDecision += choiceMatch.scoreChange.decision;
          }
        }
      });
      finalScores.decisionScore = Math.max(0, Math.min(100, sumDecision));
      nextState.scores = finalScores;
    }

    setState(nextState);
  };

  // 자산 설명(팁)을 열어보았는지 추적
  const markAssetAsViewed = (assetId: string) => {
    if (!state.viewedAssets.includes(assetId)) {
      setState((prev) => ({
        ...prev,
        viewedAssets: [...prev.viewedAssets, assetId]
      }));
    }
  };

  // 예적금 만기 이관 및 재예치 처리 함수
  const processMaturity = (decisions: { [assetId: string]: 'reinvest' | 'withdraw' }) => {
    const updatedAllocations = { ...state.allocations };
    let totalWithdrawn = 0;
    let details = '';

    Object.keys(decisions).forEach((assetId) => {
      const decision = decisions[assetId];
      if (decision === 'withdraw') {
        const balance = updatedAllocations[assetId] || 0;
        if (balance > 0) {
          totalWithdrawn += balance;
          updatedAllocations[assetId] = 0;
          const assetName = assetId === 'deposit' ? '정기예금' : '적금';
          details += `${assetName} 만기 수령 ${formatMoney(balance)}, `;
        }
      }
    });

    if (totalWithdrawn > 0) {
      updatedAllocations['cash'] = parseFloat(((updatedAllocations['cash'] || 0) + totalWithdrawn).toFixed(2));
    }

    const nextState: GameState = {
      ...state,
      allocations: updatedAllocations,
      processedMaturityTurn: state.currentTurn,
      lastEventResult: totalWithdrawn > 0 ? {
        title: '🔔 예적금 만기 수령 완료',
        choiceText: '비상금 통장으로 이체',
        resultText: `${details.slice(0, -2)}이 입출금·비상금 통장으로 전액 안전하게 이체되었습니다.`
      } : {
        title: '🔔 예적금 만기 재예치 완료',
        choiceText: '동일 상품 연장',
        resultText: '만기 자산이 동일 상품으로 성공적으로 재예치(자동 연장)되었습니다.'
      }
    };

    const updatedHistory = [...state.history];
    if (updatedHistory.length > 0) {
      const lastIndex = updatedHistory.length - 1;
      const lastHistoryItem = updatedHistory[lastIndex];
      
      const newHistoryAllocation = { ...lastHistoryItem.allocation };
      Object.keys(updatedAllocations).forEach((id) => {
        newHistoryAllocation[id] = updatedAllocations[id];
      });

      const totalAssets = Object.values(updatedAllocations).reduce((a, b) => a + b, 0);
      const totalLoans = state.loans.credit + state.loans.mortgage;

      updatedHistory[lastIndex] = {
        ...lastHistoryItem,
        netWorth: parseFloat((totalAssets - totalLoans).toFixed(2)),
        cash: updatedAllocations['cash'],
        invested: parseFloat(Object.keys(updatedAllocations).filter(k => k !== 'cash').reduce((sum, k) => sum + updatedAllocations[k], 0).toFixed(2)),
        allocation: newHistoryAllocation
      };
      nextState.history = updatedHistory;
    }

    setState(nextState);
  };

  // 대출 상환 처리 함수
  const repayLoan = (type: 'credit' | 'mortgage', amount: number) => {
    if (amount <= 0) return;
    const updatedAllocations = { ...state.allocations };
    const currentEmergencyCash = updatedAllocations['cash'] || 0;
    const currentLoanAmount = state.loans[type] || 0;

    const actualRepayAmount = Math.min(currentEmergencyCash, currentLoanAmount, amount);
    if (actualRepayAmount <= 0) return;

    updatedAllocations['cash'] = parseFloat((currentEmergencyCash - actualRepayAmount).toFixed(2));
    const nextLoans = {
      ...state.loans,
      [type]: parseFloat((currentLoanAmount - actualRepayAmount).toFixed(2))
    };

    const nextState: GameState = {
      ...state,
      allocations: updatedAllocations,
      loans: nextLoans,
      lastEventResult: {
        title: '💳 대출금 중도 상환 완료',
        choiceText: `${type === 'credit' ? '신용대출' : '담보대출'} 상환`,
        resultText: `비상금 통장에서 ${formatMoney(actualRepayAmount)}을 출금하여 대출금을 성공적으로 상환했습니다.`
      }
    };

    const updatedHistory = [...state.history];
    if (updatedHistory.length > 0) {
      const lastIndex = updatedHistory.length - 1;
      const lastHistoryItem = updatedHistory[lastIndex];
      const newHistoryAllocation = { ...lastHistoryItem.allocation };
      Object.keys(updatedAllocations).forEach((id) => {
        newHistoryAllocation[id] = updatedAllocations[id];
      });

      const totalAssets = Object.values(updatedAllocations).reduce((a, b) => a + b, 0);
      const totalLoans = nextLoans.credit + nextLoans.mortgage;

      updatedHistory[lastIndex] = {
        ...lastHistoryItem,
        netWorth: parseFloat((totalAssets - totalLoans).toFixed(2)),
        cash: updatedAllocations['cash'],
        invested: parseFloat(Object.keys(updatedAllocations).filter(k => k !== 'cash').reduce((sum, k) => sum + updatedAllocations[k], 0).toFixed(2)),
        allocation: newHistoryAllocation,
        loans: nextLoans
      };
      nextState.history = updatedHistory;
    }

    setState(nextState);
    audioManager.playSound('success');
  };

  // 주택청약 통장 전액 해지 처리 함수
  const liquidateHousing = () => {
    const updatedAllocations = { ...state.allocations };
    const currentHousingBalance = updatedAllocations['housing'] || 0;
    
    updatedAllocations['housing'] = 0;
    updatedAllocations['cash'] = parseFloat(((updatedAllocations['cash'] || 0) + currentHousingBalance).toFixed(2));

    const nextState: GameState = {
      ...state,
      allocations: updatedAllocations,
      isHousingActive: false,
      lastEventResult: {
        title: '⚠️ 주택청약 종합저축 해지 완료',
        choiceText: '청약 해지 단행',
        resultText: `청약 통장을 중도 해지하여 누적 금액 ${formatMoney(currentHousingBalance)}이 비상금 통장으로 이체되었습니다. 단, 그동안의 무주택 청약 가점 점수는 완전히 소멸되었습니다.`
      }
    };

    const updatedHistory = [...state.history];
    if (updatedHistory.length > 0) {
      const lastIndex = updatedHistory.length - 1;
      const lastHistoryItem = updatedHistory[lastIndex];
      const newHistoryAllocation = { ...lastHistoryItem.allocation };
      Object.keys(updatedAllocations).forEach((id) => {
        newHistoryAllocation[id] = updatedAllocations[id];
      });

      const totalAssets = Object.values(updatedAllocations).reduce((a, b) => a + b, 0);
      const totalLoans = state.loans.credit + state.loans.mortgage;

      updatedHistory[lastIndex] = {
        ...lastHistoryItem,
        netWorth: parseFloat((totalAssets - totalLoans).toFixed(2)),
        cash: updatedAllocations['cash'],
        invested: parseFloat(Object.keys(updatedAllocations).filter(k => k !== 'cash').reduce((sum, k) => sum + updatedAllocations[k], 0).toFixed(2)),
        allocation: newHistoryAllocation
      };
      nextState.history = updatedHistory;
    }

    setState(nextState);
    audioManager.playSound('notification');
  };

  // 주택청약 자동 납입 활성화/비활성화 처리 함수
  const toggleHousingActive = () => {
    setState((prev) => {
      const nextActive = !prev.isHousingActive;
      return {
        ...prev,
        isHousingActive: nextActive,
        lastEventResult: {
          title: '🔔 주택청약 납입 상태 조정',
          choiceText: nextActive ? '청약 가입/활성화' : '청약 납입 유예/비활성화',
          resultText: nextActive 
            ? '주택청약 종합저축이 다시 활성화되었습니다. 매 턴마다 비상금에서 60만 원이 자동 저축됩니다.'
            : '주택청약 자동 이체를 일시 유예합니다. (청약 점수 가산은 멈추지만 통장은 해지되지 않습니다)'
        }
      };
    });
    audioManager.playSound('click');
  };

  // 실물 주택 매도 (시세 매도, 담보대출 자동 전액 상환 및 순 매도금 비상금 입금)
  const sellHouse = () => {
    const updatedAllocations = { ...state.allocations };
    const currentHouseVal = updatedAllocations['house'] || 0;
    if (currentHouseVal <= 0) return;

    const mortgageLoan = state.loans.mortgage || 0;
    const netProceeds = parseFloat(Math.max(0, currentHouseVal - mortgageLoan).toFixed(2));

    updatedAllocations['house'] = 0;
    updatedAllocations['cash'] = parseFloat(((updatedAllocations['cash'] || 0) + netProceeds).toFixed(2));

    const nextLoans = {
      ...state.loans,
      mortgage: 0
    };

    const nextState: GameState = {
      ...state,
      allocations: updatedAllocations,
      loans: nextLoans,
      lastEventResult: {
        title: '🏠 실물 주택 매도 완료',
        choiceText: '소유 주택 시세 매도 및 현금화',
        resultText: `소유하신 주택(시세 ${formatMoney(currentHouseVal)})을 성공적으로 매도했습니다.${mortgageLoan > 0 ? ` 주택담보대출 ${formatMoney(mortgageLoan)}이 전액 상환되었으며,` : ''} 순 매도금 ${formatMoney(netProceeds)}이 비상금 통장으로 전액 입금되었습니다.`
      }
    };

    const updatedHistory = [...state.history];
    if (updatedHistory.length > 0) {
      const lastIndex = updatedHistory.length - 1;
      const lastHistoryItem = updatedHistory[lastIndex];
      const newHistoryAllocation = { ...lastHistoryItem.allocation };
      Object.keys(updatedAllocations).forEach((id) => {
        newHistoryAllocation[id] = updatedAllocations[id];
      });

      const totalAssets = Object.values(updatedAllocations).reduce((a, b) => a + b, 0);
      const totalLoans = nextLoans.credit + nextLoans.mortgage;

      updatedHistory[lastIndex] = {
        ...lastHistoryItem,
        netWorth: parseFloat((totalAssets - totalLoans).toFixed(2)),
        cash: updatedAllocations['cash'],
        invested: parseFloat(Object.keys(updatedAllocations).filter(k => k !== 'cash').reduce((sum, k) => sum + updatedAllocations[k], 0).toFixed(2)),
        allocation: newHistoryAllocation,
        loans: nextLoans
      };
      nextState.history = updatedHistory;
    }

    setState(nextState);
    audioManager.playSound('success');
  };

  // 실물 주택 매입 (내 집 마련: LTV 60% 담보대출 + 자기자본 40%)
  const buyHouse = (region: 'gangnam' | 'mapo' | 'bundang' | 'gyeonggi_outer', price: number) => {
    const updatedAllocations = { ...state.allocations };
    const currentEmergencyCash = updatedAllocations['cash'] || 0;
    
    const downPayment = parseFloat((price * 0.4).toFixed(2));
    const mortgageAmount = parseFloat((price * 0.6).toFixed(2));

    if (currentEmergencyCash < downPayment) return;

    updatedAllocations['cash'] = parseFloat((currentEmergencyCash - downPayment).toFixed(2));
    updatedAllocations['house'] = price;

    const nextLoans = {
      ...state.loans,
      mortgage: parseFloat((state.loans.mortgage + mortgageAmount).toFixed(2))
    };

    const regionNames: { [k: string]: string } = {
      gangnam: '강남 대형 아파트',
      mapo: '마포·용산 역세권 아파트',
      bundang: '분당·판교 신도시 아파트',
      gyeonggi_outer: '경기 외곽 아파트'
    };

    const nextState: GameState = {
      ...state,
      allocations: updatedAllocations,
      loans: nextLoans,
      houseRegion: region,
      lastEventResult: {
        title: '🏠 실물 주택 매입 (내 집 마련) 성공',
        choiceText: `${regionNames[region] || '주택'} 매입`,
        resultText: `${regionNames[region] || '주택'} (매수가 ${formatMoney(price)})을 성공적으로 매입했습니다. 자기자본 ${formatMoney(downPayment)}이 출금되고 주택담보대출 ${formatMoney(mortgageAmount)}이 실행되었습니다.`
      }
    };

    const updatedHistory = [...state.history];
    if (updatedHistory.length > 0) {
      const lastIndex = updatedHistory.length - 1;
      const lastHistoryItem = updatedHistory[lastIndex];
      const newHistoryAllocation = { ...lastHistoryItem.allocation };
      Object.keys(updatedAllocations).forEach((id) => {
        newHistoryAllocation[id] = updatedAllocations[id];
      });

      const totalAssets = Object.values(updatedAllocations).reduce((a, b) => a + b, 0);
      const totalLoans = nextLoans.credit + nextLoans.mortgage;

      updatedHistory[lastIndex] = {
        ...lastHistoryItem,
        netWorth: parseFloat((totalAssets - totalLoans).toFixed(2)),
        cash: updatedAllocations['cash'],
        invested: parseFloat(Object.keys(updatedAllocations).filter(k => k !== 'cash').reduce((sum, k) => sum + updatedAllocations[k], 0).toFixed(2)),
        allocation: newHistoryAllocation,
        loans: nextLoans
      };
      nextState.history = updatedHistory;
    }

    setState(nextState);
    audioManager.playSound('success');
  };

  const clearLastEventResult = () => {
    setState((prev) => ({ ...prev, lastEventResult: null }));
  };

  // 게임 초기화
  const resetGame = () => {
    setState(initialGameState);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <GameContext.Provider
      value={{
        state,
        startGame,
        allocateAndNextTurn,
        selectChoice,
        markAssetAsViewed,
        processMaturity,
        repayLoan,
        liquidateHousing,
        toggleHousingActive,
        sellHouse,
        buyHouse,
        clearLastEventResult,
        resetGame
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
