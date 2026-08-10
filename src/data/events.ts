import type { GameEvent } from '../types/finance';


export const EVENTS: GameEvent[] = [
  {
    id: 'rate_up',
    title: '한국은행 기준금리 인상!',
    description: '물가를 잡기 위해 한국은행이 기준금리를 연 1.0%p 전격 인상하였습니다. 시중 은행들의 예금 및 적금 금리도 연쇄적으로 인상되고 대출 금리도 오르고 있습니다.',
    affectedAssets: ['deposit', 'saving', 'bond', 'korea_etf', 'global_etf', 'house'],
    choices: [
      {
        text: '정기예금과 적금 비중을 늘려 안정적인 이자 수익을 노린다.',
        resultDescription: '예적금 자산 가치가 안정적으로 늘어나며, 금리 상승으로 인한 안전자산 선호가 반영됩니다. 한편, 금리 인상으로 주택담보대출 이자 부담이 커지면서 부동산 매수 심리가 얼어붙어 주택 가치가 하락했습니다.',
        impact: {
          deposit: 0.02,
          saving: 0.01,
          bond: -0.03, // 금리가 오르면 채권 가격은 단기적으로 하락
          korea_etf: -0.05, // 금리가 오르면 주식시장은 위축
          global_etf: -0.03,
          house: -0.05 // 금리 인상으로 주택 가격 하락
        },
        scoreChange: { decision: 10, diversification: 5 }
      },
      {
        text: '주식이 많이 떨어졌으니 주식 ETF를 더 저렴하게 추가 매수(물타기)한다.',
        resultDescription: '주식 비중을 강하게 유지합니다. 다만 금리 인상기에는 주식의 변동성이 한층 더 커지며, 부동산 시장 또한 대출 금리 부담으로 조정(하락)을 겪습니다.',
        impact: {
          bond: -0.03,
          korea_etf: -0.02,
          global_etf: -0.01,
          stock: -0.05,
          house: -0.06
        },
        scoreChange: { decision: 5, diversification: -5 }
      }
    ],
    lesson: '기준금리가 인상되면 은행 예적금의 매력이 높아지며, 돈이 안전자산으로 흘러갑니다. 반면, 이자 부담이 커지면서 기업의 투자가 위축되어 주식시장과 채권시장(기존 발행 채권)의 가격은 단기적으로 하락하는 경향이 있습니다.',
    discussionQuestion: '기준금리가 인상될 때 대출이 많은 사람과 저축이 많은 사람은 각각 어떻게 영향을 받을까요?'
  },
  {
    id: 'rate_down',
    title: '한국은행 기준금리 인하 발표',
    description: '경기를 활성화하기 위해 한국은행이 금리를 낮췄습니다. 예금 이자는 연 2%대로 낮아졌고 시중에 유동성(돈)이 풍부해지고 있습니다.',
    affectedAssets: ['deposit', 'saving', 'bond', 'korea_etf', 'global_etf', 'gold', 'house'],
    choices: [
      {
        text: '낮아진 예금 대신 주식형 ETF와 채권형 펀드로 자금을 이동시킨다.',
        resultDescription: '유동성 유입에 힘입어 주식형 ETF와 채권형 펀드의 평가액이 호조를 보입니다. 또한, 대출 금리가 인하됨에 따라 부동산 레버리지 수요가 늘어 소유한 주택 가치가 동반 상승했습니다.',
        impact: {
          bond: 0.04, // 금리가 내리면 채권 가격 상승
          korea_etf: 0.06,
          global_etf: 0.05,
          house: 0.08 // 금리 인하로 자산(부동산) 가격 상승
        },
        scoreChange: { decision: 10, diversification: 5 }
      },
      {
        text: '수익률이 낮아지더라도 원금이 보장되는 정기예금을 그대로 고수한다.',
        resultDescription: '원금은 절대적으로 안전하게 보전되었지만, 풍부해진 유동성으로 인해 부동산 가격이 크게 오르면서 자산 격차가 생길 수 있습니다.',
        impact: {
          deposit: 0.01,
          saving: 0.01,
          house: 0.05
        },
        scoreChange: { decision: 5, longTerm: -5 }
      }
    ],
    lesson: '금리가 인하되면 은행 예적금의 매력이 떨어지고, 자금이 주식, 채권, 부동산 등으로 이동하면서 자산 가격이 상승하기 쉽습니다. 특히 기존에 이자율을 확정해 둔 채권은 가치가 상승하게 됩니다.',
    discussionQuestion: '시중에 돈이 너무 많이 풀리면 물가와 화폐 가치에는 어떤 변화가 생길까요?'
  },
  {
    id: 'korea_bull',
    title: '국내 증시 대세 상승장 (코스피 3,000 돌파)',
    description: '국내 반도체 및 신산업의 수출 실적이 사상 최대를 기록하며 코스피 지수가 급등하고 있습니다. 뉴스에서는 온통 주식 이야기뿐입니다.',
    affectedAssets: ['korea_etf', 'stock_samsung', 'stock_skhynix', 'stock_hyundai'],
    choices: [
      {
        text: '상승세에 편승하여 국내 주식형 ETF와 국내 우량주에 자산을 집중한다.',
        resultDescription: '주식 가격이 크게 올라 즉각적인 대규모 평가 이익을 얻었지만, 포트폴리오의 편중 위험이 높아졌습니다.',
        impact: {
          korea_etf: 0.15,
          stock_samsung: 0.20,
          stock_skhynix: 0.28,
          stock_hyundai: 0.18
        },
        scoreChange: { decision: 5, diversification: -15 }
      },
      {
        text: '주가가 과열되었다고 판단하고 일부 주식을 팔아 안전한 정기예금과 금 비중을 늘린다 (리밸런싱).',
        resultDescription: '상승장에서 주식 수익률을 일부 확정하고 포트폴리오의 안정성을 다져놓았습니다.',
        impact: {
          korea_etf: 0.05,
          stock_samsung: 0.08,
          stock_skhynix: 0.10,
          deposit: 0.02,
          gold: 0.01
        },
        scoreChange: { decision: 15, diversification: 15, longTerm: 10 }
      }
    ],
    lesson: '자산 가격이 급등할 때 비중이 커진 위험자산을 일부 매도하고 원래 목표한 비중대로 안전자산을 다시 매수하는 것을 리밸런싱(자산 배분 재조정)이라고 합니다. 이는 욕심을 통제하고 변동성을 줄이는 훌륭한 전략입니다.',
    discussionQuestion: '주가가 계속 오를 때 주식을 더 사지 않고 오히려 파는 결정은 왜 어려울까요?'
  },
  {
    id: 'global_crash',
    title: '글로벌 증시 급락 및 패닉 셀 현상 발생',
    description: '미국의 급격한 인플레이션 우려와 지정학적 분쟁으로 전 세계 주식시장이 하루 만에 5% 넘게 하락하는 등 패닉 상태에 빠졌습니다.',
    affectedAssets: ['korea_etf', 'global_etf', 'stock_samsung', 'stock_apple', 'stock_nvidia', 'stock_tesla', 'house'],
    choices: [
      {
        text: '두렵지만 장기 투자의 원칙을 지키며 포트폴리오를 건드리지 않고 인내한다.',
        resultDescription: '단기적으로 자산 평가액이 쪼그라들었지만, 투매(패닉 셀)를 피해 손실을 확정 짓지 않았습니다. 글로벌 자산시장 폭락으로 실물 아파트 가격 또한 조정을 받아 하락했습니다.',
        impact: {
          korea_etf: -0.12,
          global_etf: -0.15,
          stock_samsung: -0.15,
          stock_apple: -0.12,
          stock_nvidia: -0.28,
          stock_tesla: -0.32,
          house: -0.05 // 부동산도 하락 조정
        },
        scoreChange: { longTerm: 15, decision: 10 }
      },
      {
        text: '불안감을 견디지 못하고 주식 자산을 모두 매도하여 현금화한다.',
        resultDescription: '큰 손실 상태에서 자산을 매도하여 손실이 확정되었습니다. 금융 위기 확산으로 대출 연체 리스크 및 자산 매각 수요가 늘면서 실물 주택 가치도 급락했습니다.',
        impact: {
          korea_etf: -0.20,
          global_etf: -0.22,
          stock_samsung: -0.25,
          stock_nvidia: -0.38,
          stock_tesla: -0.42,
          house: -0.08
        },
        scoreChange: { longTerm: -20, decision: -10 }
      }
    ],
    lesson: '시장이 급락할 때 공포에 질려 자산을 매도하는 것을 "패닉 셀(투매)"이라고 합니다. 장기적으로 우상향할 우량 자산이라면 일시적인 폭락장에서 손절하기보다 인내하며 장기적인 관점을 유지하는 것이 성공 확률을 높입니다.',
    discussionQuestion: '투자한 자산의 가격이 반토막이 났을 때, 뇌가 느끼는 심리적 압박을 어떻게 이겨낼 수 있을까요?'
  },
  {
    id: 'exchange_spike',
    title: '환율 급등 (원/달러 환율 1,450원 돌파)',
    description: '안전 자산인 달러 수요가 몰리면서 환율이 급격히 상승하고 있습니다. 수입 물가가 비상이며, 미국 주식을 가진 사람들은 환차익을 보고 있습니다.',
    affectedAssets: ['global_etf', 'korea_etf'],
    choices: [
      {
        text: '원화 가치가 낮아졌으므로 달러 자산인 글로벌 주식 ETF를 매도해 환차익을 실현한다.',
        resultDescription: '환율 상승으로 추가 이익을 더해 매도함으로써 좋은 현금 흐름을 창출했습니다.',
        impact: {
          global_etf: 0.12, // 환차익으로 가치 상승
          korea_etf: -0.03
        },
        scoreChange: { decision: 10, emergency: 5 }
      },
      {
        text: '환율은 돌고 도는 것이므로 매도하지 않고 글로벌 우량 주식을 계속 보유한다.',
        resultDescription: '자산 비중을 유지하며 지속적인 장기 성장을 추구합니다.',
        impact: {
          global_etf: 0.05,
          korea_etf: -0.02
        },
        scoreChange: { longTerm: 10, decision: 5 }
      }
    ],
    lesson: '해외 자산에 투자하면 해당 국가 통화의 가치(환율)에 영향을 받습니다. 원화 대비 달러 환율이 상승하면 해외 주식의 원화 환산 가치가 상승하여 추가적인 환차익을 얻을 수 있지만, 반대의 경우에는 환차손을 입을 수 있습니다.',
    discussionQuestion: '환율이 오르면 우리나라의 수출 기업과 수입 기업 중 어느 쪽이 유리할까요?'
  },
  {
    id: 'inflation_shock',
    title: '고물가 습격 (스태그플레이션 우려)',
    description: '원자재 가격과 유가가 급등하면서 외식비, 교통비 등 생활물가가 폭등하고 있습니다. 내가 받는 월급의 구매 가치가 떨어지고 있습니다.',
    affectedAssets: ['cash', 'deposit', 'saving', 'gold', 'house'],
    choices: [
      {
        text: '물가 방어력이 높은 대표적 원자자산인 금에 추가 배분(200만 원 매수)한다.',
        resultDescription: '현금 200만 원을 인출하여 대표적 실물 안전자산인 금 200만 원을 새로 매수·배분했습니다! 금 가격 상승 효과가 더해져 인플레이션 화폐 가치 하락을 효과적으로 방어합니다.',
        cashChange: -200,
        flatAssetChange: { gold: 200 },
        impact: {
          gold: 0.08,
          house: 0.04 // 인플레이션 헤지 역할로 부동산 가격 소폭 상승
        },
        scoreChange: { decision: 15, diversification: 10 }
      },
      {
        text: '생활비가 올라 불안하니 일단 투자금을 줄이고 입출금 통장에 현금을 쟁여둔다.',
        resultDescription: '심리적 안정은 얻었으나, 물가 상승률보다 현금 이율이 낮아 실질적인 구매력 손실을 입게 됩니다. 실물 자산인 부동산의 명목 가격은 오르지만 화폐 대비 자산 비중이 낮아 손해를 입습니다.',
        cashChange: 50,
        impact: {
          cash: -0.04,
          deposit: -0.02,
          gold: 0.02,
          house: 0.03
        },
        scoreChange: { decision: -5, longTerm: -5 }
      }
    ],
    lesson: '인플레이션(물가 상승) 시기에는 종이돈의 가치가 하락합니다. 은행 예적금 이율이 물가상승률보다 낮다면 실질적으로 손해를 보게 됩니다. 이 시기에는 실물 자산인 부동산, 금 또는 기업 이익이 반영되는 주식이 가치를 방어해 줍니다.',
    discussionQuestion: '매년 물가가 5%씩 오르는데 내 통장 이자가 2%라면, 내 자산의 실질 가치는 증가한 것일까요, 감소한 것일까요?'
  },
  {
    id: 'voice_phishing',
    title: '검사를 사칭한 보이스피싱 전화',
    description: '“당신의 계좌가 범죄에 연루되었습니다. 자산을 보호하려면 저희가 제공하는 보안 안전 계좌로 즉시 현금을 송금하십시오”라는 긴박한 전화를 받았습니다.',
    affectedAssets: ['cash'],
    choices: [
      {
        text: '의심스러운 전화이므로 즉시 전화를 끊고 112나 금융감독원에 확인 전화를 한다.',
        resultDescription: '피싱 범죄임을 간파하여 소중한 자산을 완벽하게 지켜냈습니다.',
        cashChange: 0,
        scoreChange: { decision: 20, emergency: 10 }
      },
      {
        text: '검사라니 덜컥 겁이 나서 지시하는 대로 확인차 소액을 송금한다.',
        resultDescription: '사기를 당해 300만 원의 큰 현금 손실이 발생하고 정신적 고통을 겪었습니다.',
        cashChange: -300,
        scoreChange: { decision: -30, emergency: -20 }
      }
    ],
    lesson: '경찰, 검찰, 금감원 등 공공기관은 절대로 전화상으로 돈을 이체하라고 요구하거나 개인정보·비밀번호를 묻지 않습니다. 의심스러운 연락을 받으면 절대 이체하지 말고 즉시 전화를 끊고 신고해야 합니다.',
    discussionQuestion: '보이스피싱 피해를 당하지 않기 위해 일상에서 실천할 수 있는 가장 확실한 행동 요령은 무엇일까요?'
  },
  {
    id: 'scam_offer',
    title: '“원금 보장, 월 10% 확정 수익!” 사기 유혹',
    description: '아는 선배가 다가와 최근 대박 난 사설 투자 플랫폼이 있다며, 원금을 100% 보장하면서 매월 10%의 확정 이자를 준다고 투자를 권유합니다. 한정된 사람만 가입할 수 있다고 합니다.',
    affectedAssets: ['cash'],
    choices: [
      {
        text: '“세상에 공짜 점심은 없다” 원금 보장과 초고수익이 동시에 존재하는 투자는 사기이므로 거절한다.',
        resultDescription: '현명한 판단으로 유사수신 투자 사기 피해를 원천 차단했습니다.',
        scoreChange: { decision: 20, longTerm: 10 }
      },
      {
        text: '선배가 실제로 돈 벌어 호강하는 모습을 보고 혹하여 현금 500만 원을 빌려 투자해 본다.',
        resultDescription: '투자금은 물론 선배까지 연락이 두절되었습니다. 전형적인 폰지 사기(다단계 금융 사기)에 당해 500만 원을 모두 날렸습니다.',
        cashChange: -500,
        scoreChange: { decision: -40, longTerm: -20 }
      }
    ],
    lesson: '원금이 절대 보장되면서도 은행 이자보다 몇 배 높은 확정 고수익을 주는 상품은 99.9% 금융 사기(유사수신 또는 폰지 사기)입니다. 하이 리스크-하이 리턴(고위험-고수익) 원칙은 금융 시장의 절대 법칙입니다.',
    discussionQuestion: '신규 가입자의 돈으로 기존 가입자에게 이자를 주는 폰지 사기는 왜 결국 무너질 수밖에 없을까요?'
  },
  {
    id: 'theme_stock',
    title: '친구의 특급 비밀 “대박 초전도체 테마주” 추천',
    description: '단짝 친구가 “이건 진짜 비공개 정부 프로젝트 소스인데, 곧 공시 뜨면 10배 간다”라며 최근 뉴스에 매일 나오는 급등 테마주 매수를 강하게 권합니다.',
    affectedAssets: ['stock_samsung', 'stock_skhynix', 'stock_nvidia', 'stock_tesla', 'cash'],
    choices: [
      {
        text: '이유 불문하고 뜬소문이나 루머에 기반한 투자는 투기일 뿐이므로 내 원칙대로 건전한 ETF와 우량주 투자를 유지한다.',
        resultDescription: '뇌동매매를 삼가고 자신의 투자 원칙을 견고히 지켰습니다.',
        scoreChange: { decision: 15, longTerm: 15 }
      },
      {
        text: '인생 한 방이다! 기회를 놓치면 나만 벼락거지가 될 것 같아 현금의 대부분을 고위험 개별 주식에 쏟아붓는다.',
        resultDescription: '매수 직후 뉴스가 허위로 밝혀지며 주가가 하한가를 쳤습니다. 고위험 개별 주식 자산이 크게 폭락하는 아픔을 겪습니다.',
        impact: {
          stock_skhynix: -0.30,
          stock_nvidia: -0.40,
          stock_tesla: -0.45
        },
        scoreChange: { decision: -25, diversification: -20, longTerm: -15 }
      }
    ],
    lesson: '신뢰할 수 없는 정보나 루머에 흔들려 남을 따라 사는 매매 행동을 "뇌동매매"라고 합니다. 테마주는 급격히 오르는 만큼 순식간에 폭락하여 막대한 원금 손실을 유발하므로 철저한 경계가 필요합니다.',
    discussionQuestion: '내가 사지 않은 주식이 급등할 때 느끼는 소외감(FOMO, 포모)을 극복하려면 어떤 마음가짐이 필요할까요?'
  },
  {
    id: 'medical_emergency',
    title: '갑작스러운 사고로 인한 수술 및 병원비 지출',
    description: '빗길에 미끄러져 뼈가 부러지는 사고를 당했습니다. 급하게 수술을 받고 입원 치료를 하느라 큰 병원비 청구서를 받았습니다.',
    affectedAssets: ['cash', 'deposit', 'pension'],
    choices: [
      {
        text: '미리 모아둔 입출금 통장의 비상금으로 병원비를 바로 지불한다.',
        resultDescription: '비상금 통장 덕분에 다른 정기예금이나 투자 자산을 깨지 않고 위기를 모면했습니다. 비상금의 효용을 절감합니다.',
        cashChange: -150,
        scoreChange: { emergency: 20, decision: 10 }
      },
      {
        text: '모아둔 현금이 부족하여 가입해 둔 정기예금이나 연금저축을 중도 해지하여 수령한다.',
        resultDescription: '예적금 중도해지 페널티를 물고 아까운 세액공제 반환 세금까지 지불하며 수술비를 마련해 손해를 봅니다.',
        cashChange: -150,
        impact: {
          deposit: -0.10,
          pension: -0.15
        },
        scoreChange: { emergency: -15, decision: -10 }
      }
    ],
    lesson: '현금 자산이나 비상금 통장이 왜 중요한지 보여주는 대표적인 사례입니다. 충분한 비상금이 없으면 위기 시 복리 혜택을 받으며 불어나고 있던 장기 적금이나 연금, 주식을 강제로 깨서 손해를 감수해야 합니다.',
    discussionQuestion: '비상금은 총자산의 몇 % 정도로 유지하는 것이 합리적일까요?'
  },
  {
    id: 'lease_raise',
    title: '전세 보증금 인상 요구',
    description: '살고 있는 집의 임대인이 물가 상승과 주변 전세 시세를 이유로 보증금을 1,000만 원 인상해 달라고 요구했습니다. 이사 가기엔 비용과 시간이 너무 많이 듭니다.',
    affectedAssets: ['cash', 'deposit', 'korea_etf', 'rent_deposit'],
    choices: [
      {
        text: '모아둔 현금과 예금 만기금을 활용해 보증금 인상분을 조달한다.',
        resultDescription: '비상금 통장에서 1,000만 원을 인출하여 집주인에게 지불했습니다. 이 1,000만 원은 지출로 사라진 것이 아니라, 귀하의 부동산 임차보증금 자산으로 안전하게 보전 및 증액되었습니다.',
        cashChange: -1000,
        flatAssetChange: { rent_deposit: 1000 },
        scoreChange: { emergency: 5, decision: 10 }
      },
      {
        text: '손실이 난 주식을 손절하여 부족한 보증금을 채운다.',
        resultDescription: '원치 않는 타이밍에 주식을 손절해 손실을 확정지으며 보증금을 인상했습니다. 부동산 임차보증금 자산은 1,000만 원 증액되었으나, 투자 손실이 확정되었습니다.',
        impact: {
          korea_etf: -0.10
        },
        cashChange: -800,
        flatAssetChange: { rent_deposit: 1000 },
        scoreChange: { emergency: -10, decision: -5 }
      }
    ],
    lesson: '주거비나 전세금 등 부동산 관련 지출은 가계 재정에 아주 큰 충격을 주는 유동성 리스크입니다. 보증금은 언젠가 돌려받는 자산이지만, 장기 계약으로 묶여 있어 투자금으로 돌릴 수 없으므로 만기 구조와 유동성을 잘 설계해야 합니다.',
    discussionQuestion: '유동성(언제든 현금으로 바꿀 수 있는 정도)이 낮은 부동산과 유동성이 높은 주식의 장단점은 무엇일까요?'
  },
  {
    id: 'buy_car',
    title: '멋진 신차 구입의 유혹',
    description: '주변 직장 동료들이 하나둘씩 할부로 신형 하이브리드 자동차를 사기 시작합니다. 대중교통 이용이 슬슬 피곤하게 느껴지고, "젊을 때 차 한 대 타야지" 하는 유혹이 밀려옵니다.',
    affectedAssets: ['cash'],
    choices: [
      {
        text: '아직 자산 형성기이므로 대중교통을 이용하고, 차량 살 돈으로 장기 우량 자산 투자를 늘린다.',
        resultDescription: '일시적 불편함을 감수하고 자산을 빠르게 증식시킬 기회비용을 아꼈습니다.',
        scoreChange: { longTerm: 20, decision: 15 }
      },
      {
        text: '현금 일부를 내고 잔액은 할부로 국산 소형 SUV를 즉시 계약한다.',
        resultDescription: '차를 얻어 삶은 편해졌으나 매달 차량 유지비, 보험료, 세금, 할부금이 나가며 투자 여력이 크게 감소합니다.',
        cashChange: -600,
        scoreChange: { longTerm: -15, decision: -10 }
      }
    ],
    lesson: '자동차는 구매하자마자 감가상각(시간이 갈수록 가치가 떨어지는 것)이 일어나는 소비재입니다. 특히 자산 형성 초기 단계에 자동차를 할부로 구입하면 매달 내야 하는 고정비가 늘어나 저축과 투자의 스노볼 효과(복리 효과)를 가로막습니다.',
    discussionQuestion: '감가상각 자산(자동차 등)과 가치 상승 자산(부동산, 주식 등)의 결정적인 차이는 무엇일까요?'
  },
  {
    id: 'independent_living',
    title: '부모님으로부터의 독립 및 자취 시작',
    description: '회사와의 통근 거리가 너무 멀어 직장 근처에 원룸을 얻어 독립하기로 결심했습니다. 보증금과 월세, 가구 구입비 등 꽤 큰돈이 한 번에 들어가게 됩니다.',
    affectedAssets: ['cash', 'housing', 'rent_deposit'],
    choices: [
      {
        text: '주거 독립은 가치 있는 투자이다. 비용 절약을 위해 중고 가구를 사며 최대한 예산을 아껴 독립한다.',
        resultDescription: '독립을 감행했습니다. 총 400만 원의 예산 지출 중 보증금 300만 원은 부동산(임차보증금) 자산으로 취득·보전되었으며, 가구 구매 및 이사 경비로 100만 원이 소모 지출되었습니다.',
        cashChange: -400,
        flatAssetChange: { rent_deposit: 300 },
        scoreChange: { decision: 10, emergency: 5 }
      },
      {
        text: '평생 한 번뿐인 내 첫 집 독립인데, 가구와 가전 모두 최고급 새 상품으로 채운다.',
        resultDescription: '독립하며 화려하게 가구를 세팅했습니다. 보증금 300만 원은 부동산(임차보증금) 자산으로 취득·보전되었으나, 최고급 가구 소모품 지출로 500만 원이 소모 차감되었습니다. (총 800만 원 지출)',
        cashChange: -800,
        flatAssetChange: { rent_deposit: 300 },
        scoreChange: { decision: -10, emergency: -15 }
      }
    ],
    lesson: '독립은 삶의 주도성을 갖게 하지만, 주거비와 공과금, 생활비 등 매달 나가는 "숨만 쉬어도 나가는 돈(고정 지출)"을 급격히 증가시킵니다. 독립을 결정하기 전 철저한 월간 예산 시뮬레이션이 필수적입니다.',
    discussionQuestion: '자취를 시작할 때 월세 외에 매달 추가로 생각해야 하는 지출 항목에는 어떤 것들이 있을까요?'
  },
  {
    id: 'patience_test',
    title: '지루한 횡보장, 장기투자 인내심 테스트',
    description: '주식시장이 오르지도 내리지도 않고 수개월째 제자리걸음입니다. 주변에서는 코인이나 급등주로 며칠 만에 돈을 벌었다는 무용담이 가득 흘러나옵니다.',
    affectedAssets: ['korea_etf', 'global_etf', 'stock_samsung', 'stock_apple', 'stock_nvidia'],
    choices: [
      {
        text: '장기 투자의 핵심은 인내다. 시장 흐름에 흔들리지 않고 매월 정기적인 적립식 매수를 고수한다.',
        resultDescription: '시장의 바닥 구간에서 꾸준히 주식 수를 늘렸으며, 이는 향후 상승장에 큰 열매가 됩니다.',
        impact: {
          korea_etf: 0.02,
          global_etf: 0.03,
          stock_samsung: 0.03
        },
        scoreChange: { longTerm: 20, decision: 10 }
      },
      {
        text: '기다리는 것이 너무 지루하다. 주식을 정리하고 변동성이 매우 큰 고위험 개별주로 몰빵 이직한다.',
        resultDescription: '시장의 급등락에 하루하루 심장이 뛰고 불면증에 시달립니다. 잦은 매매로 수수료만 지출됩니다.',
        impact: {
          stock_nvidia: -0.20,
          stock_tesla: -0.25
        },
        scoreChange: { longTerm: -20, decision: -15, diversification: -10 }
      }
    ],
    lesson: '주식 투자에서 가장 큰 적인 지루함과 단기적 조급증입니다. 역사적으로 시장은 상승과 하락, 그리고 긴 횡보 기간을 거칩니다. 적립식 투자는 횡보 기간에 평균 매수 단가를 낮춰 장기 수익률을 극대화하는 안전판 역할을 합니다.',
    discussionQuestion: '매년 조금씩 우상향하는 자산과 매일 급등락하지만 장기적으로 제자리인 자산 중 어느 쪽이 마음 편한 투자일까요?'
  },
  {
    id: 'housing_subscription_chance',
    title: '신도시 아파트 청약 당첨!',
    description: '축하합니다! 꾸준히 저축해 오신 주택청약 종합저축 점수와 가입 요건이 충족되어 신도시 아파트 청약에 최종 당첨되었습니다! 계약금과 잔금을 조달하여 내 집 마련을 달성할 기회입니다. 아래 지역 중 어느 곳의 아파트를 분양받으시겠습니까?',
    affectedAssets: ['housing', 'cash', 'house', 'rent_deposit'],
    choices: [
      {
        text: '[서울 강남] 분양가 8억 원 (담보대출 5.6억 + 신용대출 1.6억 실행)',
        resultDescription: '대한민국 부동산의 핵심, 서울 강남의 분양권을 취득했습니다! 분양가 8억 원 중 주택청약 통장과 전세금을 깬 현금을 보태고 주택담보대출 5억 6,000만 원, 신용대출 1억 6,000만 원을 동원했습니다. 강남 지역은 연 +1.6%의 시세 성장 보너스가 주어지지만, 대출 원금이 많아 매 턴 상당한 이자가 빠져나갑니다. (이후 청약 저축은 자동 해지 상태가 됩니다)',
        flatAssetChange: {
          house: 80000,
          rent_deposit: -99999,
          housing: -99999
        },
        loanChange: {
          mortgage: 56000,
          credit: 16000
        },
        houseRegion: 'gangnam',
        scoreChange: { decision: 25, longTerm: 20 }
      },
      {
        text: '[서울 마포] 분양가 5억 원 (담보대출 3.5억 + 신용대출 1.0억 실행)',
        resultDescription: '도심 접근성이 뛰어난 서울 마포 아파트를 취득했습니다! 분양가 5억 원 중 청약저축과 전세금을 뺀 현금을 내고 주택담보대출 3억 5,000만 원, 신용대출 1억 원을 동원했습니다. 마포 지역은 연 +0.8%의 시세 성장 보너스가 적용됩니다. (이후 청약 저축은 자동 해지 상태가 됩니다)',
        flatAssetChange: {
          house: 50000,
          rent_deposit: -99999,
          housing: -99999
        },
        loanChange: {
          mortgage: 35000,
          credit: 10000
        },
        houseRegion: 'mapo',
        scoreChange: { decision: 20, longTerm: 15 }
      },
      {
        text: '[경기 분당] 분양가 3.5억 원 (담보대출 2.45억 + 신용대출 7,000만 실행)',
        resultDescription: '주거 만족도가 높은 1기 신도시 경기 분당 아파트를 취득했습니다! 분양가 3억 5,000만 원 중 청약저축과 전세금을 뺀 현금을 내고 주택담보대출 2억 4,500만 원, 신용대출 7,000만 원을 동원했습니다. 분당은 표준적인 주택 시장의 가치 변동이 적용됩니다. (이후 청약 저축은 자동 해지 상태가 됩니다)',
        flatAssetChange: {
          house: 35000,
          rent_deposit: -99999,
          housing: -99999
        },
        loanChange: {
          mortgage: 24500,
          credit: 7000
        },
        houseRegion: 'bundang',
        scoreChange: { decision: 15, longTerm: 10 }
      },
      {
        text: '[경기 외곽] 분양가 2억 원 (담보대출 1.4억 + 신용대출 4,000만 실행)',
        resultDescription: '자금 부담이 덜한 경기 외곽 아파트를 취득했습니다! 분양가 2억 원 중 청약저축과 전세금을 뺀 현금을 내고 주택담보대출 1억 4,000만 원, 신용대출 4,000만 원을 동원했습니다. 빚 상환 이자 부담은 가장 작으나, 부동산 입지 특성상 장기적으로 시세 성장률은 연 -0.8%의 페널티를 보일 수 있습니다. (이후 청약 저축은 자동 해지 상태가 됩니다)',
        flatAssetChange: {
          house: 20000,
          rent_deposit: -99999,
          housing: -99999
        },
        loanChange: {
          mortgage: 14000,
          credit: 4000
        },
        houseRegion: 'gyeonggi_outer',
        scoreChange: { decision: 10, longTerm: 5 }
      },
      {
        text: '대출 이자 부담과 자금 여력이 불안하므로 이번 청약 기회를 포기한다.',
        resultDescription: '청약 당첨 기회를 아쉽게 포기했습니다. 청약 통장 잔액과 가입 기간은 그대로 보전되나, 이번 당첨 권리는 소멸되었습니다.',
        scoreChange: { decision: 5, longTerm: -5 }
      }
    ],
    lesson: '주택청약은 단순한 저축을 넘어 무주택 서민에게 아파트 분양 우선권을 주는 한국 특유의 혜택입니다. 청약에 당첨되면 입지와 매매가에 따른 주택담보대출(LTV)과 신용대출을 결합한 정밀한 자금 조달 계획(레버리지 설계)을 세워야 합니다.',
    discussionQuestion: '자산을 모으는 목적 중에 "내 집 마련"이 갖는 장기적인 재정적·심리적 의미는 무엇일까요?'
  },
  {
    id: 'buy_house_opportunity',
    title: '내 집 마련 (구축 아파트 직접 매입) 기회',
    description: '전세 계약 만료 시점에 맞춰 구축 아파트 매입 기회가 찾아왔습니다. 전세를 연장할지, 혹은 주택담보대출을 융통하여 내 집을 장만할지 선택하십시오. 어느 지역의 구축 아파트를 매입하시겠습니까?',
    affectedAssets: ['cash', 'house', 'rent_deposit'],
    choices: [
      {
        text: '[서울 강남] 매매가 7.5억 원 (담보대출 5.25억 + 신용대출 1.2억 실행)',
        resultDescription: '서울 강남 구축 아파트를 매입했습니다! 매매가 7.5억 원 중 기존 전세보증금 회수금과 현금, 그리고 주택담보대출 5억 2,500만 원과 신용대출 1억 2,000만 원을 동원해 대금을 완납했습니다. 강남 부동산은 장기 우상향 프리미엄(연 +1.6%)을 지니지만 이자 고정 지출이 상당하므로 예산 관리가 중요합니다.',
        flatAssetChange: {
          house: 75000,
          rent_deposit: -99999
        },
        loanChange: {
          mortgage: 52500,
          credit: 12000
        },
        houseRegion: 'gangnam',
        scoreChange: { decision: 25, longTerm: 20 }
      },
      {
        text: '[서울 마포] 매매가 4.5억 원 (담보대출 3.15억 + 신용대출 5,000만 실행)',
        resultDescription: '서울 마포 구축 아파트를 매입했습니다! 매매가 4.5억 원 중 전세금 회수액과 현금, 그리고 주택담보대출 3억 1,500만 원과 신용대출 5,000만 원을 결합했습니다. 마포 지역의 안정적인 시세 차익(연 +0.8% 프리미엄)을 기대할 수 있습니다.',
        flatAssetChange: {
          house: 45000,
          rent_deposit: -99999
        },
        loanChange: {
          mortgage: 31500,
          credit: 5000
        },
        houseRegion: 'mapo',
        scoreChange: { decision: 20, longTerm: 15 }
      },
      {
        text: '[경기 분당] 매매가 3.2억 원 (담보대출 2.24억 실행)',
        resultDescription: '경기 분당 구축 아파트를 매입했습니다! 매매가 3.2억 원 중 전세금 회수액과 현금을 보태고 주택담보대출 2억 2,400만 원을 융통하여 잔금을 납부했습니다. 주거 만족도가 높고 안정적인 부동산 가치 흐름을 지닙니다.',
        flatAssetChange: {
          house: 32000,
          rent_deposit: -99999
        },
        loanChange: {
          mortgage: 22400
        },
        houseRegion: 'bundang',
        scoreChange: { decision: 15, longTerm: 10 }
      },
      {
        text: '[경기 외곽] 매매가 1.8억 원 (담보대출 1.26억 실행)',
        resultDescription: '경기 외곽 구축 아파트를 매입했습니다! 매매가 1.8억 원 중 전세금과 현금, 그리고 주택담보대출 1억 2,600만 원을 동원했습니다. 빚 상환 부담은 가장 적으나, 부동산 가격의 장기 성장은 연 -0.8%의 페널티를 받아 둔화될 수 있습니다.',
        flatAssetChange: {
          house: 18000,
          rent_deposit: -99999
        },
        loanChange: {
          mortgage: 12600
        },
        houseRegion: 'gyeonggi_outer',
        scoreChange: { decision: 10, longTerm: 5 }
      },
      {
        text: '대출 이자 부담으로 매입을 보류하고 전세 계약을 연장한다.',
        resultDescription: '무리한 빚을 내어 실물 주택을 구매하기보다, 현재의 전세 거주 형태를 유지하면서 금융 자산 위주로 투자를 지속하기로 결정했습니다.',
        scoreChange: { decision: 10, longTerm: 5 }
      }
    ],
    lesson: '주택 매입 시 자기자본(Equity)과 타인자본(Debt)의 비율을 적절히 조절하는 LTV(주택담보대출비율) 관리가 대단히 중요합니다. 무리한 영끌은 금리 변동에 노출되어 가계 재정에 큰 리스크를 가할 수 있으므로 상환 능력을 면밀히 따져야 합니다.',
    discussionQuestion: '내 집을 매입하여 대출 원리금을 갚는 것과 전세로 거주하며 투자 기회를 잡는 것 중 어느 쪽이 나에게 맞을까요?'
  },
  {
    id: 'pension_tax_refund',
    title: '연말정산 13월의 월급 환급 기간',
    description: '연말정산 시즌이 다가왔습니다. 세무서에서 연금저축/IRP 가입자 등에게 납입액의 최대 16.5%를 세액공제로 돌려준다고 공고했습니다.',
    affectedAssets: ['pension', 'cash'],
    choices: [
      {
        text: '세액공제 한도를 꽉 채워 연금저축에 납입하고 두둑한 세금 환급을 챙긴다.',
        resultDescription: '납입 즉시 13%~16.5%의 확실한 세금 절약 효과를 보고, 돌려받은 세금으로 재투자합니다.',
        cashChange: 66, // 환급액 즉각 입금
        scoreChange: { decision: 15, longTerm: 15 }
      },
      {
        text: '연금저축은 돈이 평생 묶여서 싫으니 세금 혜택을 포기하고 현금으로 쇼핑을 즐긴다.',
        resultDescription: '달콤한 소비를 누렸으나, 매년 챙길 수 있는 연말정산 절세 혜택을 허공으로 날려 보냈습니다.',
        scoreChange: { decision: -5, longTerm: -10 }
      }
    ],
    lesson: '세금을 아끼는 절세(Tax Saving)는 자산관리에서 최고의 투자 수익률과 같은 효과를 냅니다. 연금저축과 IRP에 납입한 금액은 매년 연말정산 시 세액공제 혜택을 주어 사실상 확정 고수익을 올리는 것과 다름없습니다.',
    discussionQuestion: '왜 국가는 국민들에게 세금을 깎아주면서까지 연금저축 가입을 권장하고 유도할까요?'
  },
  {
    id: 'job_promotion',
    title: '우수 사원 선정 및 급여 인상!',
    description: '회사에서 성과를 인정받아 급여가 영구적으로 인상되었습니다. 매 분기 들어오는 고정 소득이 늘어나 투자 여력이 크게 확장되었습니다.',
    affectedAssets: ['cash'],
    choices: [
      {
        text: '증가한 소득의 70%는 눈감고 바로 저축 및 정기 투자금으로 자동 이체 설정한다.',
        resultDescription: '늘어난 소득이 소비로 이어지지 않고 고스란히 자산 불리기의 시드머니로 연결되어 스노볼이 굴러갑니다.',
        cashChange: 200,
        scoreChange: { decision: 15, longTerm: 15 }
      },
      {
        text: '고생한 나를 위한 보상! 명품 가방을 사고 매달 외식비를 늘려 품위 유지를 한다.',
        resultDescription: '일시적인 짜릿함은 있었으나 소비 기준이 한 단계 높아져 저축액은 급여 인상 전과 거의 동일해졌습니다.',
        cashChange: 50,
        scoreChange: { decision: -10, longTerm: -10 }
      }
    ],
    lesson: '소득이 늘어남에 따라 소비 수준도 같이 높이는 현상을 "라이프스타일 인플레이션"이라고 합니다. 소비 수준을 통제하고 증가한 소득 대부분을 투자로 직행시키는 것이 자산 형성 속도를 몇 배로 빠르게 만드는 비결입니다.',
    discussionQuestion: '소득이 올라갔을 때 생활 수준을 그대로 유지하는 것은 왜 극도로 어려울까요?'
  },
  {
    id: 'gold_rush',
    title: '글로벌 무역 분쟁으로 금값 최고치 돌파',
    description: '세계 강대국 간 무역 마찰과 전쟁 우려로 국제 불안 심리가 퍼지며 안전 자산인 금값이 연일 고공행진을 하고 있습니다.',
    affectedAssets: ['gold', 'korea_etf'],
    choices: [
      {
        text: '금값이 많이 올랐으므로 분산해 둔 금의 일부를 매도해 차익을 실현한다.',
        resultDescription: '위기 시 빛을 발한 금 덕분에 수익을 확정하고 포트폴리오를 다변화했습니다.',
        impact: {
          gold: 0.12,
          korea_etf: -0.02
        },
        scoreChange: { decision: 10, diversification: 10 }
      },
      {
        text: '금값이 계속 치솟을 것 같으니 현금을 동원해 금에 적극 투자(300만 원 매수)한다.',
        resultDescription: '현금 300만 원을 동원하여 실물 자산인 금 300만 원을 대량 신규 매수·배분했습니다! 다만 상승의 끝자락에서 과도한 추격 매수를 단행하여 상투를 잡을 위험이 급상승합니다.',
        cashChange: -300,
        flatAssetChange: { gold: 300 },
        impact: {
          gold: 0.05
        },
        scoreChange: { decision: -10, diversification: -15 }
      }
    ],
    lesson: '금은 경제가 불안할 때 다른 위험자산(주식 등)과 반대로 움직이는 경향이 있는 헤지(Hedge) 자산입니다. 한 자산이 급등했을 때 이를 더 추격 매수하기보다는 일부 팔아 비중을 원래대로 맞추는 냉정함이 필요합니다.',
    discussionQuestion: '금은 이자나 배당을 주지 않는 자산인데도 사람들이 가치 있는 자산으로 인정하는 이유는 무엇일까요?'
  },
  {
    id: 'stock_crash_one',
    title: '보유 개별 우량주 악재 발생 및 주가 폭락',
    description: '투자한 개별 기업의 1대 주주 횡령 혐의 수사와 제품 결함 뉴스 보도로 주가가 하루 만에 -25% 폭락하며 거래정지 위기에 놓였습니다.',
    affectedAssets: ['stock_samsung', 'stock_skhynix', 'stock_nvidia'],
    choices: [
      {
        text: '원금 손실의 뼈아픈 교훈을 얻고, 개별 기업 투자 비중을 낮춰 시장 ETF 비중을 강화하기 위해 일부 손절한다.',
        resultDescription: '손실을 인정하고 리스크 관리를 위해 보다 안전한 시장 평균 ETF로 분산 이동했습니다.',
        impact: {
          stock_samsung: -0.25,
          stock_skhynix: -0.25
        },
        scoreChange: { decision: 15, diversification: 20 }
      },
      {
        text: '인정할 수 없다! 복구될 때까지 기다린다며 남은 비상금(200만 원)까지 영끌하여 바닥에서 추가 매수(물타기)를 한다.',
        resultDescription: '비상금 200만 원을 인출해 주식을 200만 원 추가 매수했으나, 악재 보도로 주가가 40% 추가 폭락하여 포트폴리오 파산 위험이 매우 커졌습니다.',
        cashChange: -200,
        flatAssetChange: { stock_samsung: 200 },
        impact: {
          stock_samsung: -0.40
        },
        scoreChange: { decision: -25, diversification: -20, longTerm: -15 }
      }
    ],
    lesson: '개별 기업에만 투자할 경우, 회사 내부의 횡령, 배임, 제품 불량 등 예상치 못한 "비체계적 위험(Unsystematic Risk)"에 노출됩니다. 이를 피하는 가장 확실한 방법은 여러 업종과 시장 지수(ETF)에 나누어 담아 위험을 분산하는 것입니다.',
    discussionQuestion: '비체계적 위험(개별 기업 위험)과 체계적 위험(시장 전체 위험)의 차이점은 무엇일까요?'
  },
  {
    id: 'crypto_craze',
    title: '가상자산 광풍과 주변 친구들의 수익 자랑',
    description: '새로운 가상자산이 한 달 만에 500% 급등하며 뉴스 헤드라인을 장식하고 있습니다. 동창 단톡방에는 몇천 만원을 벌어 퇴사한다는 인증샷이 계속 올라옵니다.',
    affectedAssets: ['cash', 'deposit', 'saving'],
    choices: [
      {
        text: '가상자산은 내재가치 평가가 어렵고 변동성이 지나치게 높으므로 호기심용 극소액만 맛보기로 경험하고 건전한 투자 자산을 유지한다.',
        resultDescription: '포모(FOMO)를 현명하게 이겨내고 전체 투자 뼈대의 안정성을 훌륭하게 사수했습니다.',
        scoreChange: { decision: 20, longTerm: 15 }
      },
      {
        text: '저축이고 뭐고 이 기회에 나도 벼락부자가 되겠다는 일념으로 예금과 적금을 깨서 가상자산 해외 거래소로 송금한다.',
        resultDescription: '정기예금 100만 원과 적금 100만 원을 중도해지하여 총 200만 원을 송금했습니다. 송금 직후 규제 뉴스가 발표되며 가상자산이 폭락하기 시작하여 저축 원금이 사라졌습니다.',
        cashChange: -200,
        flatAssetChange: { deposit: -100, saving: -100 },
        scoreChange: { decision: -30, longTerm: -20, emergency: -15 }
      }
    ],
    lesson: '투자와 투기의 경계선은 "내재 가치를 분석하고 장기적으로 가치가 성장하는가"에 있습니다. 다른 사람의 대박 소식에 휩쓸려 잘 알지 못하는 초고위험 변동성 자산에 전 재산을 넣는 행동은 자산 형성에 가장 해롭습니다.',
    discussionQuestion: '주식의 배당금이나 예금의 이자처럼 고정 수입이 나오지 않는 가상자산의 적정 가격은 어떻게 결정될까요?'
  },
  {
    id: 'tax_reform',
    title: '연금저축 및 저축성 보험 세제 혜택 대폭 축소 개정',
    description: '세법 개정안 발표로 장기 저축성 보험의 비과세 요건이 까다로워지고 연금저축의 한도 혜택이 일부 변경된다는 뉴스가 나왔습니다. 금융 제도 변화에 민감해져야 합니다.',
    affectedAssets: ['pension'],
    choices: [
      {
        text: '세무 전문가들의 가이드를 정독하고 변경된 세제 한도에 맞춰 내 저축 비중을 미세 조정한다.',
        resultDescription: '변화하는 세법과 세제에 대응하여 불필요한 과세를 피하는 현명한 재무 대처 능력을 길렀습니다.',
        scoreChange: { decision: 15, longTerm: 10 }
      },
      {
        text: '복잡한 세법 뉴스는 읽기 싫고 골치 아프니 그냥 신경 끄고 가만히 있는다.',
        resultDescription: '제도 변화에 무관심하여 향후 연금 인출 시 내지 않아도 될 초과 세금을 부담할 위험에 노출되었습니다.',
        scoreChange: { decision: -5, longTerm: -5 }
      }
    ],
    lesson: '자산관리는 시장뿐 아니라 정부의 세금 정책(세법)과 금융 제도 변화에도 큰 영향을 받습니다. 절세 혜택을 놓치지 않기 위해 매년 업데이트되는 연말정산 가이드와 저축 과세 혜택 정보를 확인하는 태도가 필요합니다.',
    discussionQuestion: '실제 주식 거래나 예금 이자 수령 시 차감되는 세금(소득세 등)에는 어떤 것들이 있을까요?'
  }
];
