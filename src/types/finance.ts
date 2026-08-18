export type AssetCategory = 'cash' | 'savings' | 'equity' | 'debt' | 'commodity' | 'pension' | 'housing' | 'real_estate';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  expectedReturn: number; // 연 평균 기대 수익률 (%)
  volatility: number; // 연 변동성 (%)
  liquidityScore: number; // 유동성 (환금성) 점수 (1~10)
  riskScore: number; // 원금 손실 위험 수준 (1~10)
  description: string; // 금융상품 한 줄 설명
  educationTip: string; // 교과과정에 맞춘 교육 팁 (2-3문장)
}

export interface Choice {
  text: string;
  resultDescription: string;
  impact?: {
    [assetId: string]: number; // 자산별 가치 변화량 (배율, 예: 0.1 이면 +10% 성장, -0.05 이면 -5%)
  };
  cashChange?: number; // 현금(만 원)의 즉각적인 변화 (예: -100만원 의료비 지출)
  flatAssetChange?: {
    [assetId: string]: number; // 신규: 자산에 즉시 더하거나 뺄 정량 액수 (만 원 단위, 예: 전세금 반환/증액 등)
  };
  loanChange?: {
    credit?: number;   // 신용대출 변화량 (만 원)
    mortgage?: number; // 담보대출 변화량 (만 원)
  };
  liquidateAssets?: string[]; // 전액 매도/현금화할 자산 ID 목록
  liquidateCategory?: 'equity' | 'savings' | 'all'; // 전액 매도/현금화할 카테고리 (예: 모든 주식/ETF)
  transferAllocation?: {
    from: string[]; // 인출할 자산 ID 목록
    to: { [targetAssetId: string]: number }; // 분배 배분할 자산 및 가중치 비율
    ratio?: number; // 이동시킬 비율 (기본 0.5 = 50%)
  };
  houseRegion?: string; // 신규: 구입한 지역 (예: 'gangnam', 'mapo' 등)
  scoreChange?: {
    emergency?: number; // 비상금 점수 영향
    diversification?: number; // 분산투자 점수 영향
    longTerm?: number; // 장기투자 점수 영향
    decision?: number; // 금융의사결정 점수 영향
  };
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  affectedAssets: string[]; // 영향을 받는 자산 ID 목록
  choices: Choice[];
  lesson: string; // 이 이벤트로부터 배울 점
  discussionQuestion: string; // 수업 토론용 발문
  minAge?: number; // 이벤트 발생 최소 나이 (기본 25세)
  maxAge?: number; // 이벤트 발생 최대 나이 (기본 무제한)
  lifeStage?: 'early_career' | 'marriage' | 'child_care' | 'mid_career' | 'retirement_prep' | 'general'; // 생애 단계 분류
  isMilestone?: boolean; // 해당 나이대에 도달 시 우선 발생하는 생애 주요 마일스톤 이벤트 여부
}

export interface TurnHistory {
  turn: number; // 6개월 단위 턴 (0부터 시작)
  age: number;
  netWorth: number; // 총 순자산 (만 원)
  cash: number; // 현금성 자산 (만 원)
  invested: number; // 투자 자산 총액 (만 원)
  returnRate: number; // 이번 반기 전체 포트폴리오 수익률 (%)
  mdd: number; // 이번 턴까지의 최대 낙폭 (%)
  allocation: { [assetId: string]: number }; // 각 자산별 보유액
  loans?: { credit: number; mortgage: number }; // 각 턴별 대출 잔액 기록
  actualReturns?: { [assetId: string]: number }; // 각 자산별 실제 반기 수익률 (%)
  event?: {
    title: string;
    choiceMade: string;
    resultDescription: string;
  } | null;
}

export interface Scores {
  finalNetWorth: number;
  cumulativeReturn: number;
  maxDrawdown: number;
  emergencyFundScore: number; // 0 ~ 100
  diversificationScore: number; // 0 ~ 100
  longTermScore: number; // 0 ~ 100
  decisionScore: number; // 0 ~ 100
  archetype: {
    name: string;
    emoji: string;
    description: string;
    pros: string;
    cons: string;
    questions: string[];
  };
}

export interface GameState {
  nickname: string;
  startAge: number;
  initialAsset: number; // 만 원
  halfYearSavings: number; // 만 원
  difficulty: 'stable' | 'normal' | 'volatile';
  simulationLength: number; // 년수 (10, 20, 30)
  goalAsset?: number; // 목표 자산액 (만 원)
  scenario?: 'standard' | 'inflation' | 'bubble' | 'turbulent'; // 시나리오 타입
  processedMaturityTurn?: number; // 만기 이벤트를 처리한 가장 최근의 턴 번호
  isHousingActive?: boolean; // 청약 자동 납입이 활성화되어 있는지 여부
  houseRegion?: string; // 신규: 소유한 부동산 지역
  
  currentTurn: number; // 6개월 단위
  currentAge: number;
  cash: number; // 현재 턴에서 새로 배분해야 하는 가용 현금 (저축액 포함)
  allocations: { [assetId: string]: number }; // 현재 각 금융상품에 거치되어 있는 잔액
  loans: {
    credit: number;   // 신용대출 잔액 (만 원)
    mortgage: number; // 담보대출 잔액 (만 원)
  };
  history: TurnHistory[];
  seed: number;
  isGameOver: boolean;
  scores: Scores | null;
  currentEvent: GameEvent | null;
  lastEventResult: {
    title: string;
    choiceText: string;
    resultText: string;
  } | null;
  viewedAssets: string[]; // 한번 이상 팁 모달을 열어본 자산 ID들
}
