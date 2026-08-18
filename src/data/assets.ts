import type { Asset } from '../types/finance';


export const ASSETS: Asset[] = [
  {
    id: 'cash',
    name: '입출금·비상금 통장',
    category: 'cash',
    expectedReturn: 1.5, // 연 1.5%
    volatility: 0, // 변동성 없음
    liquidityScore: 10, // 즉시 출금 가능
    riskScore: 1, // 원금 손실 위험 없음
    description: '언제든 넣고 뺄 수 있는 현금성 통장입니다. 이자는 낮지만 비상금 확보에 필수적입니다.',
    educationTip: '비상금은 예상치 못한 지출(의료비, 사고 등)이 생겼을 때 다른 투자 자산을 헐값에 매각하지 않도록 방어해 주는 방패 역할을 합니다. 통상 3~6개월 분의 생활비를 현금으로 떼어두는 것이 바람직합니다.'
  },
  {
    id: 'deposit',
    name: '정기예금',
    category: 'savings',
    expectedReturn: 3.5, // 연 3.5%
    volatility: 0.1, // 중도해지 리스크가 있으나 원금은 안전
    liquidityScore: 3, // 만기 전 해지 시 페널티
    riskScore: 1, // 예금자보호법 적용 (5천만 원)
    description: '목돈을 일정 기간 묶어두고 확정 이자를 받는 예금입니다. 중도해지 시 약정 이자율보다 훨씬 낮은 이자가 지급됩니다.',
    educationTip: '정기예금은 원금은 안전하게 지키면서 목돈을 불릴 때 좋습니다. 단, 약속한 기간(만기)을 채우지 못하고 해지하면 이자가 거의 나오지 않는 페널티(중도해지 이율)가 있으므로 만기까지 쓰지 않을 자금으로 가입해야 합니다.'
  },
  {
    id: 'saving',
    name: '적금',
    category: 'savings',
    expectedReturn: 4.0, // 연 4.0%
    volatility: 0.1,
    liquidityScore: 4,
    riskScore: 1,
    description: '매달 또는 매 턴 규칙적으로 저축하여 목돈을 만드는 저축 상품입니다.',
    educationTip: '적금은 종잣돈(시드머니)을 모으는 가장 대표적인 저축 습관 기르기 상품입니다. 이자가 높기보다는 강제적인 저축 규율을 정해 매 분기/매달 저축하는 저축 습관을 몸에 익히게 도와줍니다.'
  },
  {
    id: 'korea_etf',
    name: '국내 주식형 ETF (한국 대표기업 ETF)',
    category: 'equity',
    expectedReturn: 6.0, // 연 6%
    volatility: 12, // 중간 변동성
    liquidityScore: 8, // 3~4일 내 현금화 가능
    riskScore: 6, // 주가 하락 시 원금 손실 가능
    description: '한국의 대표 기업들의 주식을 한 바구니에 담은 상장지수펀드(ETF)입니다. 코스피 지수에 연동됩니다.',
    educationTip: 'ETF(상장지수펀드)는 주식처럼 거래소에서 쉽게 사고팔 수 있는 펀드입니다. 여러 기업에 골고루 분산하여 투자하므로 개별 주식에 투자하는 것보다 위험을 크게 줄여주지만, 시장 전체가 불황일 때는 손실이 생길 수 있습니다.'
  },
  {
    id: 'global_etf',
    name: '글로벌 주식형 ETF (세계 성장기업 ETF)',
    category: 'equity',
    expectedReturn: 7.5, // 연 7.5%
    volatility: 15, // 다소 높은 변동성
    liquidityScore: 8,
    riskScore: 7,
    description: '미국 등 세계 주요 국가의 우량 기업들에 투자하는 ETF입니다. 환율 변동의 영향을 받습니다.',
    educationTip: '글로벌 투자는 한국 시장 외의 전 세계 경제 성장에 동참하고 국가적 위험을 분산하는 방법입니다. 다만 외국 통화(달러 등)로 거래되므로, 환율 상승(원화 약세) 시 추가 수익이 나고 환율 하락 시 손실이 날 수 있는 환율 위험이 존재합니다.'
  },
  {
    id: 'stock_samsung',
    name: '개별주: 국내 반도체 1위 기업',
    category: 'equity',
    expectedReturn: 8.5,
    volatility: 22,
    liquidityScore: 9,
    riskScore: 7,
    description: '대한민국 대표 IT·반도체 1위 기업으로, 메모리 업황 사이클과 국내 코스피 시장 지수를 견인합니다.',
    educationTip: '국내 반도체 1위 기업은 전자제품, 스마트폰, 메모리 시장을 이끄는 대표 우량주입니다. 글로벌 메모리 반도체 업황 사이클에 따라 주기적인 주가 변동을 보이므로 분석 후 장기적 관점에서 접근하는 것이 좋습니다.'
  },
  {
    id: 'stock_nokia',
    name: '개별주: 글로벌 모바일 통신 1위 기업',
    category: 'equity',
    expectedReturn: 16.5,
    volatility: 28,
    liquidityScore: 9,
    riskScore: 8,
    description: '전 세계 휴대폰 시장의 40% 이상을 점유 중인 독보적 모바일 거대 챔피언 기업입니다.',
    educationTip: '글로벌 모바일 통신 1위 기업은 막대한 시장 점유율을 자랑하지만, 기술 패러다임 변화에 뒤처질 경우 주가가 90% 이상 폭락할 수 있습니다. 개별 기업 올인은 상장폐지 위험(비체계적 위험)을 동반합니다.'
  },
  {
    id: 'stock_skhynix',
    name: '개별주: 글로벌 초고속 메모리 강자',
    category: 'equity',
    expectedReturn: 12.0,
    volatility: 32,
    liquidityScore: 9,
    riskScore: 8,
    description: '글로벌 초고속 HBM 및 D램 메모리 선도 기업으로, AI 반도체 호황기에 강한 수익성과 변동성을 보입니다.',
    educationTip: '글로벌 초고속 메모리 강자 기업은 AI 가속기용 차세대 HBM 메모리 분야의 핵심 공급사입니다. 반도체 호황기에는 폭발적 주가 상승을 보이지만 불황기에는 낙폭이 클 수 있는 고변동성 주식입니다.'
  },
  {
    id: 'stock_apple',
    name: '개별주: 미국 시가총액 1위 IT 대장주',
    category: 'equity',
    expectedReturn: 14.0,
    volatility: 18,
    liquidityScore: 9,
    riskScore: 6,
    description: '스마트폰과 독보적 서비스 생태계로 전 세계 시가총액 1위를 다투는 미국 대표 글로벌 IT 기업입니다.',
    educationTip: '미국 시가총액 1위 IT 대장주는 독보적인 브랜드 충성도와 플랫폼 생태계를 갖춘 글로벌 주식입니다. 상대적으로 낮은 변동성 대비 꾸준한 장기 우상향 추세를 보여왔습니다.'
  },
  {
    id: 'stock_blackberry',
    name: '개별주: 북미 비즈니스 모바일 테크 챔피언',
    category: 'equity',
    expectedReturn: 21.0,
    volatility: 35,
    liquidityScore: 8,
    riskScore: 9,
    description: '독보적인 보안 플랫폼과 전용 키패드로 기업용 비즈니스 스마트폰 시장을 독점 중인 초고성장 테크 기업입니다.',
    educationTip: '북미 비즈니스 모바일 테크 챔피언은 고성장 기업처럼 보이지만, 기술 경쟁에서 밀릴 경우 투자 원금이 0에 가깝게 고꾸라지는 상장폐지 위험을 경험할 수 있습니다.'
  },
  {
    id: 'stock_hyundai',
    name: '개별주: 글로벌 완성차 제조기업',
    category: 'equity',
    expectedReturn: 7.5,
    volatility: 20,
    liquidityScore: 9,
    riskScore: 6,
    description: '세계 3위권 완성차 제조 그룹으로, 전기차·하이브리드 및 주주환원 밸류업 모멘텀을 지닌 가치주입니다.',
    educationTip: '글로벌 완성차 제조기업은 전 세계 자동차 시장 점유율과 고배당 혜택을 갖춘 대형 가치주입니다. 경기 변동 및 글로벌 환율 흐름의 영향을 받습니다.'
  },
  {
    id: 'stock_nvidia',
    name: '개별주: 글로벌 AI 가속기 칩 선도기업',
    category: 'equity',
    expectedReturn: 28.0,
    volatility: 45,
    liquidityScore: 9,
    riskScore: 9,
    description: '전 세계 생성형 AI GPU 시장의 90% 이상을 독점하고 있는 초고성장 칩 챔피언 기업입니다.',
    educationTip: '글로벌 AI 가속기 칩 선도기업은 생성형 AI 기술 열풍의 최대 수혜주입니다. 엄청난 주가 급등 기록을 가지고 있지만, 시장 기대치에 미치지 못할 경우 30% 이상 급락할 수 있는 초고위험 주식입니다.'
  },
  {
    id: 'stock_tesla',
    name: '개별주: 미국 자율주행 전기차 테크기업',
    category: 'equity',
    expectedReturn: 22.0,
    volatility: 48,
    liquidityScore: 9,
    riskScore: 9,
    description: '전기차 상용화와 자율주행, 로보틱스 시장을 개척하며 주가 변동폭이 매우 극심한 혁신 기업입니다.',
    educationTip: '미국 자율주행 전기차 테크기업은 CEO 이슈와 신기술 발표 소식에 따라 주가가 극적으로 널뛰는 대표적인 고변동성 주식입니다. 단기 심리적 공포를 견뎌야 합니다.'
  },
  {
    id: 'stock_cocacola',
    name: '개별주: 글로벌 필수음료·배당킹 기업',
    category: 'equity',
    expectedReturn: 8.0,
    volatility: 10,
    liquidityScore: 9,
    riskScore: 4,
    description: '전 세계 200개국에서 매일 20억 잔 이상 팔리는 독보적 음료 챔피언이자 60년 연속 배당금을 늘려온 대표 가치주입니다.',
    educationTip: '워런 버핏의 평생 투자 종목으로 유명하며, 경기 침체기나 인플레이션 시기에도 가격 결정력(해자)과 강력한 브랜드로 꾸준한 배당과 복리 수익을 제공하는 대표적인 경기방어형 가치주입니다.'
  },
  {
    id: 'stock_costco',
    name: '개별주: 글로벌 창고형 유통 챔피언',
    category: 'equity',
    expectedReturn: 13.5,
    volatility: 14,
    liquidityScore: 9,
    riskScore: 5,
    description: '유료 멤버십 기반의 독보적 고객 충성도와 박리다매 구조로 불황에도 실적이 지속 성장하는 글로벌 유통 대장주입니다.',
    educationTip: '경기 불황기에도 소비자들이 저렴한 생필품을 대량 구매하기 위해 몰려드는 강력한 비즈니스 모델로, 20년 넘게 시장 지수를 상회하며 안정적으로 우상향해 온 대표적 우량 성장 가치주입니다.'
  },
  {
    id: 'bond',
    name: '국채·채권형 펀드',
    category: 'debt',
    expectedReturn: 4.5, // 연 4.5%
    volatility: 5, // 낮은 변동성
    liquidityScore: 7,
    riskScore: 3, // 안정적
    description: '국가나 기업이 발행한 채권에 투자하는 상품입니다. 시장 금리가 올라가면 채권 가격은 떨어지는 관계가 있습니다.',
    educationTip: '채권은 빌려준 돈에 대한 증서입니다. 발행 주체(국가 등)가 망하지 않는 한 이자가 안정적으로 나옵니다. 단, 시장의 이자율(금리)이 급격히 상승하면 기존 채권의 매력이 떨어져 채권 자체의 가격이 하락하는 현상이 발생하므로 주의해야 합니다.'
  },
  {
    id: 'gold',
    name: '금 (실물·골드뱅킹)',
    category: 'commodity',
    expectedReturn: 3.0, // 인플레이션 헤지 목적
    volatility: 10,
    liquidityScore: 6,
    riskScore: 4,
    description: '대표적인 안전자산이자 실물 상품입니다. 경제 위기나 물가 급등(인플레이션) 시 가치가 올라가는 경향이 있습니다.',
    educationTip: '금은 실물 가치를 지닌 대표적인 안전자산입니다. 종이 화폐 가치가 떨어지는 고물가 시기나 글로벌 금융 위기가 발생했을 때 투자자들의 돈이 몰려 가격이 급등하는 특성이 있어, 포트폴리오의 변동성을 방어해 줍니다.'
  },
  {
    id: 'pension',
    name: '연금저축·IRP (개인연금)',
    category: 'pension',
    expectedReturn: 5.0, // 세액공제 혜택 포함 환산 수익성 양호
    volatility: 6,
    liquidityScore: 1, // 만 55세 이전 중도인출 시 기타소득세 16.5% 부과
    riskScore: 3,
    description: '장기 노후 대비용 상품으로, 매년 연말정산 시 세금을 돌려받는 세제혜택이 있습니다. 중도 해지 시 혜택을 다 뱉어내야 합니다.',
    educationTip: '연금저축은 매년 납입액의 일정 비율을 세액공제(세금 환급)해 주는 강력한 혜택을 줍니다. 노후 준비에 최적이지만, 만 55세 이전에 중도 해지하면 세제 혜택받은 금액보다 더 큰 중도해지세(기타소득세 16.5%)가 부과되어 오히려 손해를 볼 수 있습니다. (교육용 단순 모델 적용)'
  },
  {
    id: 'housing',
    name: '주택청약 종합저축',
    category: 'housing',
    expectedReturn: 2.5,
    volatility: 0,
    liquidityScore: 2, // 청약 당첨 또는 중도해지 시에만 수령 가능
    riskScore: 1,
    description: '새 아파트를 분양받을 수 있는 권리를 얻기 위한 청약 통장입니다. 꾸준히 모으는 청약 점수 가산 혜택이 있습니다.',
    educationTip: '주택청약저축은 한국 고유의 주택 마련 제도입니다. 적금처럼 원금은 보장되나 예금보다 이율은 낮은 편입니다. 대신 가입 기간과 납입 횟수가 쌓일수록 아파트 분양 신청 시 당첨 확률을 높여주는 내 집 마련 필수 징검다리 통장입니다.'
  },
  {
    id: 'rent_deposit',
    name: '부동산 임차보증금 (전월세 보증금)',
    category: 'real_estate',
    expectedReturn: 0.0, // 보증금은 명목 가치가 그대로 보전됨 (인플레이션에는 취약)
    volatility: 0,
    liquidityScore: 1, // 계약 만료 또는 이사 시에만 회수 가능 (유동성 극히 낮음)
    riskScore: 1,
    description: '주거 안정을 위해 집주인에게 맡겨둔 전월세 보증금 자산입니다. 매매 차익은 없으나 돌려받을 수 있는 소중한 부동산 자산입니다.',
    educationTip: '임차보증금은 이자가 붙거나 매매가 변동이 없는 대신 원금이 묶여 있는 고정 부동산 자산입니다. 주거 독립이나 이사 시 보증금 형태로 취득하며, 전체 순자산 가치 및 부동산 카테고리에 확실히 반영됩니다.'
  },
  {
    id: 'house',
    name: '실물 주택 (부동산)',
    category: 'real_estate',
    expectedReturn: 4.0, // 부동산 가치 연평균 성장률 (반기 2.0%)
    volatility: 8,
    liquidityScore: 1, // 매각하고 현금화하는 데 오랜 시일이 소요됨
    riskScore: 3,
    description: '귀하가 소유하신 실물 부동산 아파트 주택 자산입니다.',
    educationTip: '내 집은 거주 안정을 제공하고 인플레이션을 헷지(방어)하는 부동산 실물 자산입니다. 매매 거래 비용이 크고 환금성이 매우 느리므로, 금리 변동에 따른 대출 원리금 상환 부담을 고려하여 건강하게 취득해야 합니다.'
  }
];
