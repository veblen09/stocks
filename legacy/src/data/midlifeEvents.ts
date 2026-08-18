import type { GameEvent } from '../types/finance';

export const MIDLIFE_AND_RETIREMENT_EVENTS: GameEvent[] = [
  {
    id: 'child_college_tuition',
    minAge: 44,
    maxAge: 51,
    lifeStage: 'child_care',
    isMilestone: true,
    title: '자녀 대학교 진학 및 등록금/주거비 지원',
    description: '자녀가 대학교에 입학하며 등록금과 첫 자취방/기숙사 보증금 지출이 발생했습니다. 인생에서 교육비 지출이 가장 커지는 시기입니다.',
    affectedAssets: ['cash', 'deposit', 'saving'],
    choices: [
      {
        text: '그동안 차곡차곡 준비해 둔 자녀 교육 목적 예적금과 비상금으로 차질 없이 지원한다.',
        resultDescription: '미리 준비해 둔 목적성 자금 덕분에 다른 투자 자산이나 은퇴 연금을 깨지 않고 400만 원의 학자금을 깔끔하게 지원했습니다.',
        cashChange: -400,
        scoreChange: { decision: 20, longTerm: 15, emergency: 10 }
      },
      {
        text: '준비된 목돈이 없어 한국장학재단 학자금 대출 제도를 신청하고 자녀와 분담 상환하기로 한다.',
        resultDescription: '정부의 저금리 학자금 대출 제도를 활용하여 당장의 현금 지출을 100만 원으로 최소화하고 유동성을 사수했습니다.',
        cashChange: -100,
        scoreChange: { decision: 10, emergency: 5 }
      }
    ],
    lesson: '자녀 대학 등록금과 주거비는 40대 중후반 가계 재정에서 가장 큰 일시적 지출 충격을 줍니다. 10년 전부터 목적성 저축을 준비하거나 정책 금융(학자금 대출) 제도를 스마트하게 활용하는 분산 설계가 중요합니다.',
    discussionQuestion: '자녀 학자금 지원과 부모의 은퇴 준비 자금 사이에서 우선순위는 어떻게 정해야 할까요?'
  },
  {
    id: 'peak_wage_or_early_retirement',
    minAge: 46,
    maxAge: 54,
    lifeStage: 'mid_career',
    isMilestone: true,
    title: '임금피크제 적용 vs 조기퇴직(희망퇴직) 선택의 기로',
    description: '회사에서 만 50세를 앞두고 임금피크제(급여 25% 삭감 후 정년 보장)와 특별 퇴직위로금(현금 1,500만 원 일시 지급)을 주는 희망퇴직 중 하나를 선택하라고 공고했습니다.',
    affectedAssets: ['cash', 'pension', 'deposit'],
    choices: [
      {
        text: '고정적인 근로 소득의 가치를 우선하여 임금피크제를 수용하고 정년까지 안정적으로 근무한다.',
        resultDescription: '급여는 일부 삭감되었지만 은퇴 전까지 매 반기 안정적인 현금 흐름을 확보하여 노후 준비를 차분히 이어갑니다.',
        scoreChange: { decision: 15, longTerm: 15 }
      },
      {
        text: '희망퇴직을 신청하여 특별위로금 1,500만 원을 수령하고 IRP(퇴직연금) 계좌로 이전해 퇴직소득세를 절세한다.',
        resultDescription: '특별위로금 1,500만 원을 현금으로 수령하고 IRP로 이전하여 퇴직소득세를 30% 감면받으며 인생 2막을 준비합니다.',
        cashChange: 1500,
        scoreChange: { decision: 15, longTerm: 20 }
      }
    ],
    lesson: '중장년기에는 소득이 최고점을 찍고 감소하는 "소득 피크"를 겪게 됩니다. 퇴직금을 일시에 쓰지 않고 IRP(개인형 퇴직연금)로 이체하면 퇴직소득세를 30~40% 감면받을 수 있어 절세 효과가 매우 큽니다.',
    discussionQuestion: '정년까지의 고정 근로 소득과 일시금 퇴직위로금 중 나의 재정 상황에 더 유리한 선택은 무엇일까요?'
  },
  {
    id: 'elderly_parents_care',
    minAge: 45,
    maxAge: 55,
    lifeStage: 'mid_career',
    title: '연로하신 부모님 건강 악화 및 간병·의료비 지원',
    description: '부모님의 건강이 악화되어 수술 및 간병 지원이 필요해졌습니다. 자녀 양육과 부모 부양을 동시에 맞는 샌드위치 세대의 재무적 현실이 다가옵니다.',
    affectedAssets: ['cash', 'deposit', 'pension'],
    choices: [
      {
        text: '국가 노인장기요양보험 제도를 신청하고, 준비된 비상금으로 간병비 150만 원을 정기 편성한다.',
        resultDescription: '공적 사회보험 제도를 적극 활용하여 본인부담금을 낮추고, 비상금으로 150만 원을 지출해 가계 안정을 지켰습니다.',
        cashChange: -150,
        scoreChange: { emergency: 15, decision: 15 }
      },
      {
        text: '갑작스러운 간병비 부담에 당황하여 노후 대비 연금저축을 중도 해지하여 지출한다.',
        resultDescription: '연금저축 해지 페널티(16.5% 과세)를 물며 200만 원을 조달하여 장기 노후 자산에 손실이 생겼습니다.',
        cashChange: -200,
        impact: {
          pension: -0.10
        },
        scoreChange: { emergency: -15, longTerm: -15, decision: -10 }
      }
    ],
    lesson: '40~50대는 자녀 교육비와 부모 의료비가 동시에 발생하는 "샌드위치 부양기"입니다. 공적 간병보험(노인장기요양보험) 등 복지 제도를 숙지하고 사전 비상금을 다져놓아야 노후 자금의 누수를 막을 수 있습니다.',
    discussionQuestion: '가족의 의료비/간병 리스크에 대비하기 위해 미리 점검해야 하는 사회보험과 민간보험은 무엇이 있을까요?'
  },
  {
    id: 'child_marriage_support',
    minAge: 49,
    maxAge: 55,
    lifeStage: 'retirement_prep',
    isMilestone: true,
    title: '장성한 자녀의 결혼 및 독립 지원',
    description: '첫째 자녀가 결혼을 앞두고 전세 보증금 마련에 보탬을 요청해 왔습니다. 부모로서 축하와 함께 노후 자금과의 균형을 고민하게 됩니다.',
    affectedAssets: ['cash', 'deposit', 'house'],
    choices: [
      {
        text: '부모의 은퇴 준비를 훼손하지 않는 선에서 1,000만 원을 증여세 면제 한도 내로 합리적으로 지원한다.',
        resultDescription: '부모의 노후 자금을 철저히 보존하면서도 자녀에게 실질적인 독립 보탬(1,000만 원)을 주어 훌륭한 균형을 잡았습니다.',
        cashChange: -1000,
        scoreChange: { decision: 20, longTerm: 15 }
      },
      {
        text: '체면을 중시하여 보유 주식과 예금을 대량 매도해 3,000만 원을 무리하게 전액 지원한다.',
        resultDescription: '자녀에게 큰돈을 보탰으나 부모의 핵심 은퇴 시드머니 3,000만 원이 일시에 빠져나가 노후 준비에 큰 차질이 생겼습니다.',
        cashChange: -3000,
        scoreChange: { decision: -20, longTerm: -25 }
      }
    ],
    lesson: '자녀의 결혼 지원에 무리하게 은퇴 자금을 쏟아붓는 것은 부모를 "실버 푸어(노인 빈곤)"로 만드는 대표적 원인입니다. 부모의 확실한 노후 독립이 자녀에게 줄 수 있는 최고의 선물임을 잊지 말아야 합니다.',
    discussionQuestion: '자녀의 결혼/주거 지원 시 부모의 노후 자금을 지키기 위한 합리적인 원칙은 무엇일까요?'
  },
  {
    id: 'health_screening_alert',
    minAge: 46,
    maxAge: 55,
    lifeStage: 'mid_career',
    title: '종합건강검진 이상 소견과 건강 관리 경보',
    description: '50세를 앞두고 받은 정밀 건강검진에서 심혈관 및 관절 치료가 필요하다는 소견을 받았습니다. 무리한 업무를 줄이고 건강 관리에 투자해야 할 때입니다.',
    affectedAssets: ['cash', 'deposit'],
    choices: [
      {
        text: '실손의료보험과 비상금으로 치료비(100만 원)를 즉시 납부하고, 정기 운동과 식단 관리를 시작한다.',
        resultDescription: '선제적인 건강 치료와 생활습관 개선으로 조기에 건강을 회복하고 장기 근로 능력을 지켜냈습니다.',
        cashChange: -100,
        scoreChange: { emergency: 15, decision: 15 }
      },
      {
        text: '치료비 100만 원이 아깝다며 치료를 미루고 야근을 지속하다가 병세가 커져 큰 수술비(300만 원)를 치른다.',
        resultDescription: '조기 치료를 놓쳐 수술비와 입원비로 300만 원의 큰 현금 손실이 발생하고 큰 고통을 겪었습니다.',
        cashChange: -300,
        scoreChange: { emergency: -20, decision: -15 }
      }
    ],
    lesson: '건강은 인생 후반기 최고의 자산이자 지속적인 근로 소득을 보장하는 인적 자본입니다. 건강 이상 징후를 조기에 발견하고 치료하는 것은 장기적으로 의료비 지출을 수천만 원 아끼는 최고의 투자입니다.',
    discussionQuestion: '노후 자산 관리에서 금융 자산(돈) 못지않게 "건강 자산"이 중요한 이유는 무엇일까요?'
  },
  {
    id: 'retirement_rebalancing_prep',
    minAge: 48,
    maxAge: 55,
    lifeStage: 'retirement_prep',
    isMilestone: true,
    title: '은퇴 5년 전, 안전자산 중심 포트폴리오 리밸런싱',
    description: '은퇴 시점이 코앞으로 다가왔습니다. 은퇴 직전 주식 시장이 폭락하면 노후 자금이 회복되지 못하는 위험(시퀀스 리스크)을 방어하기 위해 자산 배분을 점검해야 합니다.',
    affectedAssets: ['korea_etf', 'global_etf', 'deposit', 'saving', 'bond'],
    choices: [
      {
        text: '주식 ETF의 비중을 낮추고 정기예금과 채권, 배당형 안전자산 비중을 60% 이상으로 확대한다.',
        resultDescription: '공격적 자산 증식에서 안전한 자산 보존 모드로 성공적으로 전환하여 은퇴 직전 시장 변동성 위험을 완벽히 차단했습니다.',
        impact: {
          deposit: 0.02,
          bond: 0.03,
          korea_etf: -0.02
        },
        scoreChange: { decision: 25, diversification: 25, longTerm: 20 }
      },
      {
        text: '은퇴 전 마지막 한 방을 노리고 변동성이 큰 테크 성장주와 개별 주식 비중을 80%로 유지한다.',
        resultDescription: '시장 변동성 위험에 그대로 노출되어 은퇴를 앞두고 자산 가치가 급락할 수 있는 큰 위험을 안게 되었습니다.',
        impact: {
          korea_etf: -0.08,
          global_etf: -0.10
        },
        scoreChange: { decision: -20, diversification: -20, longTerm: -15 }
      }
    ],
    lesson: '청년기에는 시간의 힘을 믿고 주식 등 위험자산 비중을 높여도 되지만, 은퇴 5년 전부터는 "수익률"보다 "MDD(최대 손실폭) 방어"가 최우선입니다. 이를 글라이드 패스(Glide Path, 연령별 안전자산 확대) 전략이라고 부릅니다.',
    discussionQuestion: '은퇴가 임박했을 때 고위험 주식 투자 비중을 줄이고 안전자산을 늘려야 하는 이유는 무엇일까요?'
  },
  {
    id: 'national_pension_timing_choice',
    minAge: 50,
    maxAge: 55,
    lifeStage: 'retirement_prep',
    title: '국민연금 수령 시기 설계 (조기수령 vs 정상/연기수령)',
    description: '국민연금공단에서 예상 수령액 통지서가 도착했습니다. 만 60세부터 5년 일찍 받는 대신 감액(연 -6%)되는 조기노령연금과, 만 65세 이후 늦게 받는 대신 증액(연 +7.2%)되는 연기연금 중 고민합니다.',
    affectedAssets: ['pension', 'cash'],
    choices: [
      {
        text: '퇴직연금과 배당금으로 초기 은퇴 생활비를 충당하고, 국민연금은 정상/연기 수령하여 평생 수령액을 극대화한다.',
        resultDescription: '물가상승률이 100% 반영되는 국민연금의 특성을 활용해 평생 종신 연금액을 최대화하는 현명한 은퇴 설계를 마쳤습니다.',
        scoreChange: { decision: 20, longTerm: 20 }
      },
      {
        text: '국민연금 고갈 불안감에 당장 조기 수령을 신청하여 평생 30% 감액된 연금을 받기로 한다.',
        resultDescription: '당장 소액의 현금을 앞당겨 받았으나, 80~90대 초고령기까지 평생 지급되는 확정 연금액이 크게 깎이는 손실을 입었습니다.',
        scoreChange: { decision: -10, longTerm: -15 }
      }
    ],
    lesson: '국민연금은 매년 물가상승률을 그대로 반영해 주는 유일한 종신 연금입니다. 수령을 1년 늦출 때마다 연 7.2%씩 연금액이 늘어나므로, 개인연금이나 퇴직연금으로 은퇴 초기 소득 공백(소득 크레바스)을 메우고 국민연금을 최대한 늦게 받는 것이 장수 리스크에 유리합니다.',
    discussionQuestion: '100세 시대에 물가상승률이 100% 반영되는 국민연금의 가치는 왜 점점 더 중요해질까요?'
  },
  {
    id: 'retirement_franchise_temptation',
    minAge: 49,
    maxAge: 55,
    lifeStage: 'retirement_prep',
    title: '퇴직금으로 대박 프랜차이즈 창업의 유혹',
    description: '퇴직을 앞두고 옛 동료가 찾아와 "월 순익 1,000만 원 보장되는 인기 프랜차이즈 카페/치킨집을 같이 열자"며 퇴직금 8,000만 원 동업 투자를 권유합니다.',
    affectedAssets: ['cash', 'pension', 'deposit'],
    choices: [
      {
        text: '자영업 5년 내 폐업률(70% 이상)과 상권 위험을 고려하여 정중히 거절하고 안전한 배당·연금 소득을 지킨다.',
        resultDescription: '무리한 창업 위험을 피하고 소중한 은퇴 시드머니를 안전하게 보존하여 안정적인 노후 현금 흐름을 사수했습니다.',
        scoreChange: { decision: 20, longTerm: 15 }
      },
      {
        text: '남들도 다 하니 나도 잘되겠지라는 생각으로 퇴직금 8,000만 원을 프랜차이즈 창업에 올인한다.',
        resultDescription: '주변 과당경쟁과 높은 임대료, 인건비로 1년 만에 폐업하여 8,000만 원 중 6,000만 원의 막대한 원금 손실을 입었습니다.',
        cashChange: -6000,
        scoreChange: { decision: -35, longTerm: -30, emergency: -20 }
      }
    ],
    lesson: '은퇴 후 가장 조심해야 할 위험 중 하나가 "준비 없는 생계형 창업"입니다. 은퇴 자금은 다시 벌기 어려운 마지막 시드머니이므로, 고위험 자영업 올인보다 정기 배당과 연금 포트폴리오를 통해 월 현금 흐름을 만드는 것이 안전합니다.',
    discussionQuestion: '은퇴 후 자영업 창업이 금융 자산(배당/연금) 운용보다 훨씬 더 큰 위험을 갖는 이유는 무엇일까요?'
  },
  {
    id: 'real_estate_upgrade_or_payoff',
    minAge: 42,
    maxAge: 50,
    lifeStage: 'mid_career',
    title: '주택담보대출 조기상환 vs 무리한 상급지 갈아타기',
    description: '보유 중인 주택담보대출 잔액이 남아있는 가운데, 무리하게 대출을 더 내어 대형 평수로 갈아탈지, 아니면 대출 원금을 전액 조기상환해 빚 없는 내 집으로 은퇴할지 고민합니다.',
    affectedAssets: ['house', 'cash'],
    choices: [
      {
        text: '남은 대출 원금을 꾸준히 조기상환하여 은퇴 전 부채(이자) 지출을 0원으로 만드는 디레버리징을 선택한다.',
        resultDescription: '대출 이자 부담을 완전히 털어내고 은퇴 후 주거 안정과 고정 지출 절감을 완벽히 달성했습니다.',
        cashChange: -1000,
        loanChange: {
          mortgage: -1000
        },
        scoreChange: { decision: 20, longTerm: 20 }
      },
      {
        text: '부동산 불패를 맹신하여 은퇴 직전 무리하게 2억 원의 추가 대출을 내어 무리한 상급지로 갈아탄다.',
        resultDescription: '집은 넓어졌으나 매 반기 수백만 원의 대출 이자 상환 부담에 짓눌려 은퇴 후 생활비 부족 위험에 처했습니다.',
        loanChange: {
          mortgage: 20000
        },
        scoreChange: { decision: -15, longTerm: -20 }
      }
    ],
    lesson: '은퇴가 다가올수록 "빚(부채)을 줄이는 디레버리징(Deleveraging)"이 필수적입니다. 은퇴 후에는 근로 소득이 사라지므로 매달 나가는 대출 이자가 가계 재정을 파탄 낼 수 있습니다.',
    discussionQuestion: '은퇴 직전에 부동산 레버리지(대출)를 줄이고 빚 없는 내 집을 만들어야 하는 이유는 무엇일까요?'
  },
  {
    id: 'pension_annuity_start_prep',
    minAge: 51,
    maxAge: 55,
    lifeStage: 'retirement_prep',
    isMilestone: true,
    title: '연금저축/IRP 연금 수령 개시와 3.3~5.5% 절세 인출 플랜',
    description: '만 55세가 도래하여 그동안 세액공제를 받으며 모아온 연금저축과 IRP 계좌의 연금 수령이 가능해졌습니다. 세금을 가장 적게 내는 인출 방식을 선택해야 합니다.',
    affectedAssets: ['pension', 'cash'],
    choices: [
      {
        text: '연간 연금 수령 한도(연 1,500만 원 이하)를 지켜 10년 이상 장기 분할 수령하여 3.3%~5.5% 저율 과세 혜택을 받는다.',
        resultDescription: '연금 개시를 신청했습니다! 매 반기 200만 원의 안정적인 연금 현금이 계좌로 입금되며, 3.3%~5.5%의 최저 세금만 납부하는 절세 인출을 시작했습니다.',
        cashChange: 200,
        scoreChange: { decision: 25, longTerm: 25 }
      },
      {
        text: '목돈이 필요하다며 연금을 분할하지 않고 한 번에 전액 일시금으로 해지 수령한다.',
        resultDescription: '일시금 인출로 인해 16.5%의 기타소득세(징벌 과세)가 부과되어 수백만 원의 세금 폭탄을 맞았습니다.',
        cashChange: 500,
        impact: {
          pension: -0.30
        },
        scoreChange: { decision: -25, longTerm: -25 }
      }
    ],
    lesson: '연금저축과 IRP는 모을 때(세액공제)뿐만 아니라 찾을 때(연금 수령)도 절세 규칙이 있습니다. 만 55세 이후 10년 이상 분할 수령하면 3.3%~5.5%의 매우 낮은 연금소득세만 내지만, 일시금으로 해지하면 16.5%의 무거운 세금이 부과됩니다.',
    discussionQuestion: '연금 계좌에서 모은 돈을 일시금으로 찾지 않고 10년 이상 나누어 받아야 하는 세제상 이유는 무엇일까요?'
  },
  {
    id: 'midlife_burnout_sabbatical',
    minAge: 40,
    maxAge: 48,
    lifeStage: 'mid_career',
    title: '40대 중년의 직장 번아웃과 재충전',
    description: '20년 가까운 쉼 없는 직장 생활과 육아로 극심한 만성 피로와 번아웃이 찾아왔습니다. 커리어의 후반전을 위해 재충전 방식을 결정해야 합니다.',
    affectedAssets: ['cash', 'deposit'],
    choices: [
      {
        text: '모아둔 비상금을 활용해 1개월 안식월 휴가를 다녀오며 본업의 커리어와 소득 파이프라인을 유지한다.',
        resultDescription: '100만 원의 예산으로 알찬 휴식을 취하고 정신적 에너지를 회복하여 안정적인 소득 창출 능력을 이어갑니다.',
        cashChange: -100,
        scoreChange: { decision: 15, emergency: 10 }
      },
      {
        text: '감정을 주체하지 못하고 무계획으로 충동 사표를 내고 무소득 상태로 6개월간 고비용 해외 힐링 여행을 떠난다.',
        resultDescription: '여행비로 1,000만 원을 탕진하고 재취업이 늦어져 가계 경제에 심각한 소득 공백 위기가 발생했습니다.',
        cashChange: -1000,
        scoreChange: { decision: -20, longTerm: -20 }
      }
    ],
    lesson: '장기적인 자산 형성에서 "나 자신의 지속 가능한 근로 능력"은 가장 거대한 자산입니다. 번아웃이 올 때 충동적인 사직 대신 비상금을 활용한 스마트한 휴식과 자기 관리가 자산 훼손을 막아줍니다.',
    discussionQuestion: '직업적 번아웃이 왔을 때 재정적 안전망(비상금 등)이 왜 심리적 완충 장치가 되어줄까요?'
  },
  {
    id: 'family_impersonation_scam',
    minAge: 42,
    maxAge: 55,
    lifeStage: 'mid_career',
    title: '“엄마/아빠 나 폰 액정 깨졌어” 가족 사칭 메신저 피싱',
    description: '“엄마(아빠) 나 폰 액정이 깨져서 수리 맡겼어. 급하니까 이 링크 눌러서 앱 깔고 인증번호 좀 보내줘”라는 긴박한 문자가 도착했습니다.',
    affectedAssets: ['cash'],
    choices: [
      {
        text: '전형적인 가족 사칭 메신저 피싱 수법임을 인지하고 즉시 자녀에게 직접 전화 통화로 확인한다.',
        resultDescription: '침착하게 통화 확인을 거쳐 신종 금융 사기 수법을 완벽히 간파하고 자산을 지켜냈습니다.',
        scoreChange: { decision: 25, emergency: 15 }
      },
      {
        text: '자녀가 다급한 줄 알고 링크를 누르고 원격 제어 앱을 설치하여 금융 계좌 정보를 넘긴다.',
        resultDescription: '피싱범이 오픈뱅킹으로 계좌의 현금 500만 원을 탈취해 큰 금전 피해를 입었습니다.',
        cashChange: -500,
        scoreChange: { decision: -35, emergency: -25 }
      }
    ],
    lesson: '가족을 사칭해 휴대폰 파손, 상품권 구매, 원격 제어 앱 설치를 요구하는 메신저 피싱은 40~50대 중장년층을 노리는 대표적 범죄입니다. 가족이라도 돈이나 인증번호를 요구하면 반드시 직접 음성 통화로 확인해야 합니다.',
    discussionQuestion: '가족 사칭 피싱 문자를 받았을 때 절대 하지 말아야 할 행동과 즉시 취해야 할 조치는 무엇일까요?'
  }
];
