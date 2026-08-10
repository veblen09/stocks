import type { Scores, GameState } from '../types/finance';


/**
 * 게임 종료 후 학생의 투자 점수 및 자산관리 유형을 진단하는 로직
 */
export function calculateFinalScores(state: GameState): Scores {
  const { history, initialAsset } = state;
  const lastTurn = history[history.length - 1];
  const finalNetWorth = lastTurn.netWorth;
  const startNetWorth = initialAsset;
  
  // 1. 누적 수익률 (%)
  const cumulativeReturn = parseFloat((((finalNetWorth - startNetWorth) / startNetWorth) * 100).toFixed(2));
  
  // 2. 최대 낙폭 MDD (%)
  // 턴별 최고 순자산 대비 낙폭 계산
  let peak = startNetWorth;
  let maxDrawdown = 0;
  history.forEach((h) => {
    if (h.netWorth > peak) {
      peak = h.netWorth;
    }
    const dd = ((peak - h.netWorth) / peak) * 100;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }
  });
  maxDrawdown = parseFloat(maxDrawdown.toFixed(2));

  // 3. 비상금 유지 점수 (0 ~ 100)
  // 매 턴 입출금통장(cash) 비중의 평균 및 최소 기준선 평가
  // 고등학생 기준, 매 반기 저축액(기본 300만원)의 최소 1배(300만원, 즉 1개월 생활비 수준) 이상을 현금으로 유지했는가?
  let cashSafeTurns = 0;
  const emergencyThreshold = 300; // 300만 원 (비상금 하한선)
  history.forEach((h) => {
    // h.allocation['cash'] 가 300만원 이상인지 확인
    const cashVal = h.allocation['cash'] || 0;
    if (cashVal >= emergencyThreshold) {
      cashSafeTurns++;
    }
  });
  const emergencyFundScore = Math.min(100, Math.round((cashSafeTurns / history.length) * 100));

  // 4. 분산투자 점수 (0 ~ 100)
  // 허핀달-허쉬만 지수(HHI)의 개념을 차용해 자산 비중 분산도 평가
  // HHI = sum(p_i^2). 포트폴리오가 균등하면 HHI가 작고, 집중되면 HHI가 1에 수렴함.
  let totalHhi = 0;
  history.forEach((h) => {
    if (h.netWorth <= 0) return;
    let hhi = 0;
    Object.keys(h.allocation).forEach((assetId) => {
      const weight = h.allocation[assetId] / h.netWorth;
      hhi += weight * weight;
    });
    totalHhi += hhi;
  });
  const avgHhi = totalHhi / history.length;
  // HHI가 0.2 이하(매우 균등)면 100점, 0.8 이상(한 자산 몰빵)이면 20점 수준으로 맵핑
  // 분산투자 점수 = (1 - avgHhi) * 120. (최대 100점 제한)
  const diversificationScore = Math.max(0, Math.min(100, Math.round((1 - avgHhi) * 130)));

  // 5. 장기투자 점수 (0 ~ 100)
  // - 연금저축/IRP를 유지했는지 (기여 비중 및 해지 안 했는지)
  // - 주택청약을 중도 해지하지 않고 꾸준히 유지했는지
  // - 주식 시장 폭락 시 뇌동매매를 참아냈는지 (이벤트 선택지 가중치 합산)
  let longTermVal = 60; // 기본 60점 출발
  
  // 연금저축 및 청약의 종말 시점 존재 여부 및 평균 비중 확인
  let pensionSum = 0;
  let housingSum = 0;
  history.forEach((h) => {
    pensionSum += h.allocation['pension'] || 0;
    housingSum += h.allocation['housing'] || 0;
  });
  
  const avgPension = pensionSum / history.length;
  const avgHousing = housingSum / history.length;

  if (avgPension > 0) longTermVal += 15;
  if (avgHousing > 0) longTermVal += 15;
  


  // 최종 장기투자 점수
  const longTermScore = Math.max(0, Math.min(100, longTermVal));



  // 자산관리 유형(아키타입) 판정 로직
  let archetype = ARCHETYPES.balanced; // 기본은 균형 잡힌 자산관리자

  // 각 자산군의 평균 비중 연산
  const avgAllocationPercent: { [assetId: string]: number } = {};
  
  let totalSumOfAllTurns = 0;
  const sumAllocations: { [assetId: string]: number } = {};
  
  history.forEach((h) => {
    Object.keys(h.allocation).forEach((key) => {
      sumAllocations[key] = (sumAllocations[key] || 0) + h.allocation[key];
    });
    totalSumOfAllTurns += h.netWorth;
  });

  Object.keys(sumAllocations).forEach((key) => {
    avgAllocationPercent[key] = totalSumOfAllTurns > 0 
      ? (sumAllocations[key] / totalSumOfAllTurns) * 100 
      : 0;
  });

  const stockAvg = (avgAllocationPercent['stock_samsung'] || 0) +
                   (avgAllocationPercent['stock_skhynix'] || 0) +
                   (avgAllocationPercent['stock_hyundai'] || 0) +
                   (avgAllocationPercent['stock_apple'] || 0) +
                   (avgAllocationPercent['stock_nvidia'] || 0) +
                   (avgAllocationPercent['stock_tesla'] || 0);
  const koreaEtfAvg = avgAllocationPercent['korea_etf'] || 0;
  const globalEtfAvg = avgAllocationPercent['global_etf'] || 0;
  const cashAvg = avgAllocationPercent['cash'] || 0;
  const savingAvg = avgAllocationPercent['saving'] || 0;
  const depositAvg = avgAllocationPercent['deposit'] || 0;
  const pensionAvg = avgAllocationPercent['pension'] || 0;

  // 유형 분류 조건
  if (stockAvg >= 30) {
    archetype = ARCHETYPES.speculative; // 테마주 과몰입형 (개별주 비중 30% 이상)
  } else if (stockAvg + globalEtfAvg + koreaEtfAvg >= 65) {
    archetype = ARCHETYPES.adventure; // 위험추구형 모험가 (전체 주식형 비중 65% 이상)
  } else if (cashAvg + savingAvg + depositAvg >= 70) {
    archetype = ARCHETYPES.safe; // 안정적 계획가 (현금+예적금 비중 70% 이상)
  } else if (cashAvg <= 5 && emergencyFundScore < 40) {
    archetype = ARCHETYPES.cashless; // 현금부족형 투자자 (평균 현금 비중 5% 이하)
  } else if (koreaEtfAvg + globalEtfAvg + pensionAvg >= 45 && longTermScore >= 75) {
    archetype = ARCHETYPES.growth; // 장기투자형 성장가 (ETF 및 연금 45% 이상 및 장기투자 고점)
  } else if (cashAvg >= 30 && emergencyFundScore >= 80) {
    archetype = ARCHETYPES.cushion; // 비상금 탄탄형 (현금성 자산 30% 이상)
  } else {
    archetype = ARCHETYPES.balanced; // 균형 잡힌 자산관리자
  }

  // 최종 누적 결정점수 보정 (gameStore에서 추적하므로 임시 대입 후 스토어 데이터로 오버라이드 예정)
  return {
    finalNetWorth: Math.round(finalNetWorth),
    cumulativeReturn,
    maxDrawdown,
    emergencyFundScore,
    diversificationScore,
    longTermScore,
    decisionScore: 50, // 스토어의 누적값으로 최종 보정됨
    archetype
  };
}

// 7가지 한국형 학생 자산관리 아키타입 정의
export const ARCHETYPES = {
  balanced: {
    name: '균형 잡힌 자산관리자',
    emoji: '⚖️',
    description: '적절한 비상금, 안정적인 예적금, 장기 성장 동력인 ETF까지 균등하게 배분한 모범적인 자산가입니다.',
    pros: '시장 위기가 닥쳐도 비상금과 안전자산 덕분에 흔들리지 않으며, 장기적으로 시장 평균 이상의 복리 효과를 누립니다.',
    cons: '단기적으로 급등하는 테마주에 비해 자산 상승 속도가 느리게 느껴져 지루함을 느낄 수 있습니다.',
    questions: [
      '나만의 자산 배분 기준(예: 안전자산 vs 투자자산 비율)은 무엇이었나요?',
      '포트폴리오의 안정성이 심리적으로 어떤 도움을 주었나요?'
    ]
  },
  safe: {
    name: '안정적 계획가',
    emoji: '🛡️',
    description: '원금 손실을 극도로 경계하며, 예적금과 현금 위주로 자산을 보전하는 데 집중한 수호형 자산가입니다.',
    pros: '주식시장 폭락이나 인플레이션 충격에도 원금 손실이 거의 없어 심리적으로 매우 편안합니다.',
    cons: '물가상승률(인플레이션)보다 낮은 이자를 받을 경우, 시간이 갈수록 돈의 실질 구매력이 줄어드는 보이지 않는 손실을 입습니다.',
    questions: [
      '시뮬레이션 중 물가가 상승했을 때, 나의 예적금 가치는 어떻게 변했나요?',
      '원금 손실의 두려움을 극복하고 일부 투자자산을 섞는다면 어떤 상품부터 시작하고 싶나요?'
    ]
  },
  adventure: {
    name: '위험추구형 모험가',
    emoji: '🚀',
    description: '높은 수익률을 목표로 개별 주식과 글로벌 ETF 등 주식형 위험 자산에 과감히 투자하는 열정가입니다.',
    pros: '상승장에서는 눈부신 수익률을 기록하며 자산 규모를 빠르게 불릴 수 있습니다.',
    cons: '하락장이 찾아오면 순자산의 30% 이상이 순식간에 증발하는 고통을 겪으며, 비상금이 부족할 경우 투자를 중도 해지해야 할 수 있습니다.',
    questions: [
      '순자산이 크게 깎였을(최대 낙폭 MDD) 때의 기분은 어땠으며, 어떻게 대처했나요?',
      '위기 상황을 방어하기 위해 내 포트폴리오에 어떤 안전판을 추가할 수 있을까요?'
    ]
  },
  speculative: {
    name: '테마주 과몰입형',
    emoji: '🔥',
    description: '소문과 급등 정보에 이끌려 변동성이 매우 높은 개별 주식에 자금의 상당수를 베팅하는 승부사입니다.',
    pros: '운이 좋을 경우 단기간에 엄청난 고수익을 거두는 짜릿함을 경험합니다.',
    cons: '개별 기업의 악재(배임, 횡령, 부도 등) 하나에 원금의 절반 이상을 잃는 등 도박에 가까운 리스크에 노출됩니다.',
    questions: [
      '친구의 테마주 추천이나 고수익 제안에 흔들려 결정했을 때의 최종 결과는 어땠나요?',
      '‘투자’와 ‘투기’의 근본적인 차이점은 무엇이라고 생각하나요?'
    ]
  },
  growth: {
    name: '장기투자형 성장가',
    emoji: '🌳',
    description: '세제 혜택이 있는 연금저축과 글로벌 시장 지수 ETF를 꾸준히 적립하며 장기 복리 효과를 이해하는 지혜로운 투자자입니다.',
    pros: '소득공제/세액공제 혜택으로 세금을 아끼고, 글로벌 기업들의 성장에 장기적으로 올라타 안정적인 부를 축적합니다.',
    cons: '연금저축 등 장기 상품의 특성상 중도 인출이 어려워 갑작스러운 유동성 위기 시 곤란할 수 있습니다.',
    questions: [
      '연금저축의 세액공제 혜택이 장기적으로 수익률에 어떤 영향을 주었나요?',
      '만기 전 자산이 묶이는 ‘유동성 제약’을 예방하기 위해선 현금 관리를 어떻게 해야 할까요?'
    ]
  },
  cushion: {
    name: '비상금 탄탄형',
    emoji: '🏦',
    description: '현금과 비상금 통장에 상당한 돈을 넣어두어 예기치 못한 지출과 인생 변수에 철저하게 방비하는 방어형 자산가입니다.',
    pros: '갑작스러운 사고, 전세금 인상, 병원비 등 예측 불가능한 돌발 이벤트가 발생해도 빚을 지거나 다른 자산을 해지하지 않고 완벽하게 해결합니다.',
    cons: '지나치게 많은 자금을 현금으로만 방치하여, 자산이 스스로 일해서 돈을 버는 복리 투자 기회를 상실(기회비용)하게 됩니다.',
    questions: [
      '돌발 이벤트가 발생했을 때 비상금이 있어 다행이라고 느꼈던 순간은 언제인가요?',
      '방치된 유휴 현금 중 일부를 장기 적립식 투자로 돌린다면 재정 상태가 어떻게 개선될까요?'
    ]
  },
  cashless: {
    name: '현금부족형 투자자',
    emoji: '💸',
    description: '모든 돈을 주식이나 연금, 주택청약 등 묶여있는 자산에 올인하여 당장 쓸 수 있는 현금이 바닥나 있는 상태입니다.',
    pros: '모든 자산이 쉬지 않고 투자되어 최고의 자금 효율을 노릴 수 있습니다.',
    cons: '작은 돌발 지출(의료비 등)만 생겨도 세금 페널티가 있는 연금이나 만기 직전 예금을 깨야 하는 치명적인 유동성 위기를 겪습니다.',
    questions: [
      '돈이 모두 투자 자산에 묶여 있을 때, 돌발 지출을 메우기 위해 어떤 손해를 감수해야 했나요?',
      '‘유동성(환금성)’이 자산관리에서 수익률만큼 중요한 이유는 무엇일까요?'
    ]
  }
};
