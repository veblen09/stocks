import type { GameEvent } from '../types/finance';
import { MIDLIFE_AND_RETIREMENT_EVENTS } from './midlifeEvents';

const RAW_BASE_EVENTS: GameEvent[] = [
  {
    id: 'rate_up',
    title: '한국은행 기준금리 인상!',
    description: '물가를 잡기 위해 한국은행이 기준금리를 연 1.0%p 전격 인상하였습니다. 시중 은행들의 예금 및 적금 금리도 연쇄적으로 인상되고 대출 금리도 오르고 있습니다.',
    affectedAssets: ['deposit', 'saving', 'bond', 'korea_etf', 'global_etf', 'house'],
    choices: [
      {
        text: '정기예금과 적금 비중을 늘려 안정적인 이자 수익을 노린다.',
        resultDescription: '투자 자산 및 현금의 30%를 정기예금(60%)과 적금(40%)으로 안전하게 이동시켰습니다. 금리 상승에 따라 예적금 자산 가치가 안정적으로 늘어나며 안전자산 비중을 확충했습니다.',
        transferAllocation: {
          from: ['cash', 'korea_etf', 'global_etf', 'bond'],
          to: { deposit: 0.6, saving: 0.4 },
          ratio: 0.3
        },
        impact: {
          deposit: 0.02,
          saving: 0.01,
          bond: -0.03, // 금리가 오르면 채권 가격은 단기적으로 하락
          korea_etf: -0.05, // 금리가 오르면 주식시장은 위축
          global_etf: -0.03,
          house: -0.05 // 금리 인상으로 주택 가격 하락
        },
        scoreChange: { decision: 10, diversification: 10 }
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
        resultDescription: '예적금 및 유휴 현금 자산의 50%를 국내 ETF(40%), 글로벌 ETF(40%), 채권형 펀드(20%)로 이동하여 분산 매수했습니다. 유동성 유입에 힘입어 주식형 ETF와 채권형 펀드의 평가액이 호조를 보이며, 대출 금리 인하로 소유한 주택 가치도 동반 상승했습니다.',
        transferAllocation: {
          from: ['deposit', 'saving', 'cash'],
          to: { korea_etf: 0.4, global_etf: 0.4, bond: 0.2 },
          ratio: 0.5
        },
        impact: {
          bond: 0.04, // 금리가 내리면 채권 가격 상승
          korea_etf: 0.06,
          global_etf: 0.05,
          house: 0.08 // 금리 인하로 자산(부동산) 가격 상승
        },
        scoreChange: { decision: 10, diversification: 15 }
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
        resultDescription: '큰 손실 상태에서 보유 주식과 ETF를 모두 매도(손절)하여 손실이 확정되었고, 매도 대금은 비상금/현금 통장으로 이체되었습니다. 금융 위기 확산으로 대출 연체 리스크 및 자산 매각 수요가 늘면서 실물 주택 가치도 급락했습니다.',
        impact: {
          korea_etf: -0.20,
          global_etf: -0.22,
          stock_samsung: -0.25,
          stock_nvidia: -0.38,
          stock_tesla: -0.42,
          stock_apple: -0.20,
          stock_hyundai: -0.20,
          stock_skhynix: -0.30,
          house: -0.08
        },
        liquidateCategory: 'equity',
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
        resultDescription: '현금 300만 원을 털어 급등 테마주를 무리하게 매수했으나, 매수 직후 뉴스가 허위로 밝혀지며 주가가 하한가를 쳐 투자금(-300만 원)을 고스란히 날렸습니다. 또한 고위험 개별 기술주 자산들도 동반 급락하는 큰 타격을 입었습니다.',
        cashChange: -300,
        impact: {
          stock_skhynix: -0.30,
          stock_nvidia: -0.40,
          stock_tesla: -0.45
        },
        scoreChange: { decision: -25, diversification: -20, longTerm: -15, emergency: -10 }
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
        text: '기다리는 것이 너무 지루하다. 우량주를 정리하고 변동성이 매우 큰 고위험 개별주로 전액 갈아탄다.',
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
    title: '신규 분양 아파트 청약 당첨 및 계약 기회',
    description: '그동안 집을 소유하지 않고 무주택 기간과 부양가족 가점을 유지하며, 주택청약종합저축 통장을 꾸준히 납입해 온 결과 신규 아파트 청약에 최종 당첨되었습니다! 분양가와 주변 시세, 본인의 대출 상환 여력을 종합적으로 고려하여 분양 계약을 체결할 지역을 선택하십시오.',
    affectedAssets: ['housing', 'cash', 'house', 'rent_deposit'],
    choices: [
      {
        text: '[서울 강남권 분양] 분양가 6.0억 원 (주변 시세 8.5억 원 수준)',
        resultDescription: '서울 강남권 분양권을 취득했습니다. 분양가 6.0억 원으로 매입하여 입주 권리를 확보했습니다. (주택청약 통장은 자동 해지되어 본금 전액이 계약금에 충당되었으며, 주택담보대출 4.2억, 신용대출 1.0억이 실행되었습니다)',
        flatAssetChange: {
          house: 85000,
          rent_deposit: -99999,
          housing: -99999
        },
        loanChange: {
          mortgage: 42000,
          credit: 10000
        },
        houseRegion: 'gangnam',
        scoreChange: { decision: 30, longTerm: 25 }
      },
      {
        text: '[서울 마포/성동 분양] 분양가 3.8억 원 (주변 시세 5.2억 원 수준)',
        resultDescription: '서울 마포/성동 아파트 분양권을 취득했습니다. 분양가 3.8억 원으로 매입하여 도심권 내 집 마련을 달성했습니다. (주택청약 통장은 해지 후 자금에 충당되었으며, 주택담보대출 2.6억, 신용대출 6,000만 원이 실행되었습니다)',
        flatAssetChange: {
          house: 52000,
          rent_deposit: -99999,
          housing: -99999
        },
        loanChange: {
          mortgage: 26000,
          credit: 6000
        },
        houseRegion: 'mapo',
        scoreChange: { decision: 25, longTerm: 20 }
      },
      {
        text: '[경기 1기 신도시 (분당/판교)] 분양가 2.6억 원 (주변 시세 3.6억 원 수준)',
        resultDescription: '경기 분당/판교 아파트 분양권을 취득했습니다. 분양가 2.6억 원으로 신도시 내 집 마련에 성공했습니다. (주택청약 통장은 해지 후 자금에 충당되었으며, 주택담보대출 1.8억, 신용대출 4,000만 원이 실행되었습니다)',
        flatAssetChange: {
          house: 36000,
          rent_deposit: -99999,
          housing: -99999
        },
        loanChange: {
          mortgage: 18000,
          credit: 4000
        },
        houseRegion: 'bundang',
        scoreChange: { decision: 20, longTerm: 15 }
      },
      {
        text: '[수도권 3기 신도시 공공분양] 분양가 1.5억 원 (주변 시세 2.0억 원 수준)',
        resultDescription: '수도권 3기 신도시 공공분양 아파트를 취득했습니다. 분양가 1.5억 원으로 안정적인 보금자리를 마련했습니다. (주택청약 통장은 해지 후 자금에 충당되었으며, 주택담보대출 1.0억, 신용대출 2,000만 원이 실행되었습니다)',
        flatAssetChange: {
          house: 20000,
          rent_deposit: -99999,
          housing: -99999
        },
        loanChange: {
          mortgage: 10000,
          credit: 2000
        },
        houseRegion: 'gyeonggi_outer',
        scoreChange: { decision: 15, longTerm: 10 }
      },
      {
        text: '대출 이자 부담과 자금 여력을 고려하여 이번 청약 당첨을 포기한다.',
        resultDescription: '대출 상환 부담을 고려하여 이번 청약 당첨을 포기하고 기존 저축·투자 상태를 유지합니다.',
        scoreChange: { decision: 5, longTerm: -5 }
      }
    ],
    lesson: '주택청약 종합저축은 무주택자에게 시세 대비 경쟁력 있는 분양가로 새 아파트를 우선 분양받을 수 있도록 돕는 대한민국 고유의 내 집 마련 제도입니다. 무주택 기간, 납입 횟수, 부양가족 수 등에 따라 가점이 산정되며, 분양 당첨 시 자기자본과 대출 상환 여력을 신중히 계산하여 계약을 결정해야 합니다.',
    discussionQuestion: '무주택 기간과 부양가족 수에 따라 청약 가점을 부여하는 한국의 주택청약 제도는 가계 안정에 어떤 의미가 있을까요?'
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
    title: '우수 사원 선정 및 특별 성과급(보너스) 지급!',
    description: '회사에서 뛰어난 업무 성과를 인정받아 특별 인센티브 성과급 200만 원이 지급되었습니다! 뜻밖의 보너스 목돈이 생겼을 때, 이 자금을 어떻게 활용하시겠습니까?',
    affectedAssets: ['cash'],
    choices: [
      {
        text: '성과급 200만 원 전액을 소비하지 않고 시드머니(비상금/투자금)로 고스란히 저축·투자한다.',
        resultDescription: '특별 성과급 200만 원이 비상금 통장으로 전액 입금되었습니다. 라이프스타일 인플레이션(소비 팽창)을 억제하고 자산 스노볼을 굴리는 훌륭한 결정을 내렸습니다.',
        cashChange: 200,
        scoreChange: { decision: 15, longTerm: 15 }
      },
      {
        text: '고생한 나를 위한 보상! 명품 구매와 외식비로 150만 원을 소비하고 남은 50만 원만 입금한다.',
        resultDescription: '성과급 200만 원 중 150만 원을 소비하여 일시적 만족을 누렸으나, 자산을 불릴 소중한 시드머니 기회를 소진했습니다. (50만 원만 비상금 입금)',
        cashChange: 50,
        scoreChange: { decision: -10, longTerm: -10 }
      }
    ],
    lesson: '성과급이나 보너스 같은 비정기적 특별 소득이 생겼을 때, 이를 곧바로 소비 수준을 높이는 데 쓰지 않고 자산 증식의 시드머니로 활용하는 규율이 부의 축적 속도를 결정합니다. (라이프스타일 인플레이션 방지)',
    discussionQuestion: '보너스나 성과급 같은 목돈이 생겼을 때 소비 충동을 통제하는 가장 좋은 방법은 무엇일까요?'
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
  },
  {
    id: 'tech_disruption_crash',
    title: '기술 패러다임 전환과 1위 개별 기업의 몰락 위기',
    description: '스마트폰 등장과 생태계 지각변동으로 한때 전 세계 1위였던 대표 휴대폰 테크 기업이 혁신에 실패하며 실적이 붕괴되고 주가가 상장폐지 위기(-80%)까지 고꾸라집니다.',
    affectedAssets: ['stock_nokia', 'stock_blackberry', 'korea_etf', 'global_etf'],
    choices: [
      {
        text: '개별 기업의 비체계적 위험을 인정하고, 몰락하는 기업 주식을 즉시 과감히 전액 손절하여 시장 ETF 및 안전자산으로 리밸런싱한다.',
        resultDescription: '기술 도태 기업의 추가 폭락(-95%) 전 손실을 고통스럽게 확정 짓고, 남은 시드머니를 글로벌 ETF로 분산 이동하여 지켰습니다.',
        impact: {
          stock_nokia: -0.60,
          stock_blackberry: -0.65,
          global_etf: 0.05
        },
        transferAllocation: {
          from: ['stock_nokia', 'stock_blackberry'],
          to: { global_etf: 0.7, korea_etf: 0.3 },
          ratio: 1.0
        },
        liquidateAssets: ['stock_nokia', 'stock_blackberry'],
        scoreChange: { decision: 20, diversification: 25, longTerm: 15 }
      },
      {
        text: '“한때 전 세계 1위 기업인데 설마 진짜 망하겠어?”라며 존버(원금 회복 대기)를 고수한다.',
        resultDescription: '혁신에 뒤처진 기업의 주가가 -85% 추가 폭락하여 휴지조각이 되었습니다. 개별주 올인 투자의 극단적 위험을 체감합니다.',
        impact: {
          stock_nokia: -0.85,
          stock_blackberry: -0.90
        },
        scoreChange: { decision: -30, diversification: -25, longTerm: -20 }
      }
    ],
    lesson: 'ETF(시장 지수 펀드)는 망해가는 기업을 지수에서 탈락시키고 새로 떠오르는 1위 기업을 자동 교체해주므로 상장폐지 위험이 없습니다. 그러나 개별 기업 올인 투자는 아무리 영원할 것 같은 1위 대기업이라도 0원으로 상장폐지될 수 있는 비체계적 위험(Unsystematic Risk)이 존재합니다.',
    discussionQuestion: '전 세계 1위였던 대표 테크 기업들이 기술 패러다임 변화(스마트폰 등장 등) 이후 수년 만에 무너진 이유는 무엇일까요?'
  },
  {
    id: 'ai_revolution',
    title: 'AI 혁명과 반도체 슈퍼사이클',
    description: '생성형 AI 및 차세대 AI 가속기 칩 수요가 전 세계적으로 폭증하면서 글로벌 AI 테크 주식과 메모리 반도체 주가가 급등하고 있습니다.',
    affectedAssets: ['stock_nvidia', 'stock_skhynix', 'global_etf', 'stock_apple', 'korea_etf'],
    choices: [
      {
        text: '포트폴리오의 분산 투자 원칙을 유지하며 글로벌 ETF와 반도체 우량주 비중을 차분히 운용한다.',
        resultDescription: '기술 혁신의 결실을 안전하게 공유하면서 포트폴리오의 위험을 적절히 제어했습니다.',
        impact: {
          stock_nvidia: 0.25,
          stock_skhynix: 0.20,
          global_etf: 0.10,
          stock_apple: 0.08,
          korea_etf: 0.06
        },
        scoreChange: { decision: 15, diversification: 15, longTerm: 15 }
      },
      {
        text: '이 기회에 상투를 잡더라도 한 방에 가자며 AI 개별주에 전 재산 영끌 올인을 감행한다.',
        resultDescription: '단기 평가이익은 급증했으나 특정 개별주 변동성 노출이 극심해져 향후 조정장 시 막대한 손실 리스크를 안게 되었습니다.',
        impact: {
          stock_nvidia: 0.35,
          stock_skhynix: 0.28
        },
        scoreChange: { decision: -15, diversification: -25, longTerm: -10 }
      }
    ],
    lesson: '기술 혁신 초기에는 특정 주식이 폭등하지만, 변동성 또한 극심합니다. 시장 전체에 투자하는 글로벌 ETF나 우량 분산 포트폴리오를 활용하면 기술 성장 결실과 리스크 관리를 동시에 잡을 수 있습니다.',
    discussionQuestion: '특정 산업이나 종목이 급등할 때 전 재산을 올인하는 투자가 위험한 이유는 무엇일까요?'
  },
  {
    id: 'dividend_payout',
    title: '결산 배당금 특별 입금',
    description: '보유 중인 주식 및 ETF 기업들로부터 반기 결산 배당금 150만 원이 계좌로 현금 입금되었습니다.',
    affectedAssets: ['cash', 'korea_etf', 'global_etf', 'stock_samsung', 'stock_apple'],
    choices: [
      {
        text: '배당금 150만 원 전액을 우량 자산에 재투자하여 복리 스노볼 효과를 높인다.',
        resultDescription: '배당금을 재투자하여 자산 수량을 늘림으로써 복리 효과의 엔진을 더욱 가속화했습니다.',
        cashChange: -150,
        flatAssetChange: { global_etf: 150 },
        scoreChange: { decision: 20, longTerm: 20 }
      },
      {
        text: '공돈이 생긴 느낌이므로 현금 150만 원으로 최고급 호텔 뷔페와 쇼핑을 즐긴다.',
        resultDescription: '단기적 즐거움을 누렸으나 자산을 불릴 수 있는 중요한 복리 재투자 기회를 흘려보냈습니다.',
        cashChange: 150,
        scoreChange: { decision: -10, longTerm: -15 }
      }
    ],
    lesson: '배당금(Dividend)은 기업이 올린 이익을 주주에게 현금으로 나누어 주는 것입니다. 배당금을 쓰지 않고 다시 투자(배당 재투자)하면 시간이 지남에 따라 자산이 기하급수적으로 늘어나는 복리 효과를 누릴 수 있습니다.',
    discussionQuestion: '배당금을 받아 바로 소비하는 것과 재투자하는 것은 10년 후 자산 규모에 어떤 차이를 만들까요?'
  },
  {
    id: 'side_hustle_success',
    title: '퇴근 후 부업/N잡 성공과 추가 소득 창출',
    description: '퇴근 후 꾸준히 준비해 온 온라인 지식 콘텐츠 판매와 부업이 히트를 치며 200만 원의 추가 현금 소득이 발생했습니다.',
    affectedAssets: ['cash', 'deposit', 'saving'],
    choices: [
      {
        text: '부업 소득 200만 원 전액을 비상금 통장과 적금에 이체하여 종잣돈 형성을 앞당긴다.',
        resultDescription: '소득 증가를 소비로 돌리지 않고 자산 형성의 시드머니로 곧바로 연계하는 훌륭한 재무 습관을 보여주었습니다.',
        cashChange: 200,
        scoreChange: { decision: 20, emergency: 15, longTerm: 15 }
      },
      {
        text: '고생한 나를 위한 보상으로 최신 프리미엄 스마트폰을 일시불로 구입한다.',
        resultDescription: '기분은 좋아졌지만 추가 소득이 자산으로 축적되지 않고 일시적 소비재 구매로 사라졌습니다.',
        cashChange: 50,
        scoreChange: { decision: -10, longTerm: -10 }
      }
    ],
    lesson: '본업 소득 외에 추가 소득(N잡, 부업 등)이 생겼을 때 이를 소비로 소비해 버리지 않고 투자 시드머니로 직행시키는 행동은 자산 형성 속도를 획기적으로 끌어올립니다.',
    discussionQuestion: '소득이 늘었을 때 소비를 늘리지 않고 투자를 늘리는 습관을 유지하려면 어떤 노력이 필요할까요?'
  },
  {
    id: 'jeonse_fraud_prevention',
    title: '역전세 및 전세 보증금 불안 경보',
    description: '주변 아파트 매매 시세 하락으로 집주인이 만기 때 보증금을 돌려주기 어렵다는 뉴스(역전세)가 흘러나옵니다.',
    affectedAssets: ['cash', 'rent_deposit'],
    choices: [
      {
        text: 'HUG 전세보증금 반환보증 보험에 신속히 가입(소액 보증료 지출)하고 집주인과 사전 확인을 진행한다.',
        resultDescription: '소액의 보증료(30만 원) 지출로 소중한 전세 보증금 전액을 확실하게 지켜내는 리스크 관리를 성취했습니다.',
        cashChange: -30,
        scoreChange: { decision: 20, emergency: 15 }
      },
      {
        text: '설마 내 집주인이 돈을 안 주겠어 하며 아무런 대비 없이 방치한다.',
        resultDescription: '만기 시 보증금 반환이 지연되어 이사 일정에 차질이 생기고 법적 분쟁 리스크에 노출되는 불안을 겪습니다.',
        scoreChange: { decision: -15, emergency: -20 }
      }
    ],
    lesson: '전세 보증금은 개인 자산 중 가장 큰 비중을 차지합니다. 역전세나 전세 사기 위험에 대비해 전세보증금 반환보증 보험 가입 등 선제적인 금융 안전장치를 마련하는 것이 필수적입니다.',
    discussionQuestion: '큰 자산이 묶여 있는 전세 계약 시 세입자가 확인할 수 있는 안전 대책에는 무엇이 있을까요?'
  },
  {
    id: 'bank_failure_panic',
    title: '해외 중소형 은행 부실 뱅크런 사태',
    description: '해외 중소형 은행의 갑작스러운 파산 뉴스에 금융 시장 전반에 불안 심리가 확산되며 글로벌 증시가 휘청입니다.',
    affectedAssets: ['deposit', 'bond', 'gold', 'korea_etf', 'global_etf'],
    choices: [
      {
        text: '예금자보호제도(5천만 원)와 안전자산의 역할을 신뢰하고 동요 없이 기존 포트폴리오를 사수한다.',
        resultDescription: '시장 일시적 패닉에 흔들리지 않고 원칙을 지켜내어 금융 시장 안정 후 수익 회복을 누리게 되었습니다.',
        impact: {
          bond: 0.03,
          gold: 0.05,
          korea_etf: -0.05,
          global_etf: -0.04
        },
        scoreChange: { decision: 15, longTerm: 15 }
      },
      {
        text: '불안감에 휩싸여 정기예금과 주식 자산을 모두 중도 해지/손절하고 현금으로 인출한다.',
        resultDescription: '손실을 확정 짓고 아까운 예금이자를 포기하여 공포에 의한 실수를 저질렀습니다. 해지금 및 매도 대금은 비상금/현금 통장으로 이체되었습니다.',
        impact: {
          korea_etf: -0.12,
          global_etf: -0.10
        },
        liquidateCategory: 'equity',
        liquidateAssets: ['deposit'],
        cashChange: -100, // 중도해지 페널티
        scoreChange: { decision: -20, longTerm: -15 }
      }
    ],
    lesson: '뱅크런(대규모 예금 인출 사태)이나 시스템 불안 소식이 들릴 때 예금자보호제도 등 제도적 안전장치를 이해하고 공포에 질린 패닉 셀을 삼가는 금융 지능이 중요합니다.',
    discussionQuestion: '은행이 위기에 처했을 때 국가가 예금자를 보호해 주는 예금자보호제도의 한도와 역할은 무엇일까요?'
  },
  {
    id: 'marriage_expense',
    title: '결혼 및 신혼 가계 형성',
    description: '인생의 새로운 출발인 결혼을 맞이하게 되었습니다. 예식 비용, 신혼 살림 및 축의금 정산 이슈가 발생합니다.',
    affectedAssets: ['cash', 'rent_deposit'],
    choices: [
      {
        text: '실속 있는 스몰 웨딩과 합리적인 가전 구성으로 예산을 절약하고 남은 자금을 자산 형성에 집중한다.',
        resultDescription: '결혼식 비용 300만 원 지출에 그치고, 남은 시드머니를 주거 및 자산 투자로 연결했습니다.',
        cashChange: -300,
        scoreChange: { decision: 15, longTerm: 15 }
      },
      {
        text: '일생에 한 번뿐인 결혼식이라며 최고급 호텔 예식과 프리미엄 명품 가전에 900만 원을 지출한다.',
        resultDescription: '화려한 성파티를 즐겼으나 시드머니 900만 원이 소모 지출되어 향후 투자 및 내 집 마련 기회비용이 감소했습니다.',
        cashChange: -900,
        scoreChange: { decision: -15, emergency: -15 }
      }
    ],
    lesson: '결혼은 자산 형성기 초반에 일어나는 가장 큰 재무 이벤트 중 하나입니다. 남들에게 보여주기 위한 과소비를 줄이고 실속 있게 예산을 관리해야 신혼기 자산 스노볼 효과를 이어나갈 수 있습니다.',
    discussionQuestion: '인생의 대형 이벤트(결혼, 이사 등)에서 예산 한도를 정하고 지키는 것은 왜 중요할까요?'
  },
  {
    id: 'unlisted_stock_scam',
    title: '“상장 직전 5배 대박 확정!” 비상장주 투자 사기',
    description: '소셜 미디어와 브로커를 통해 "3개월 뒤 코스닥 상장이 확정된 바이오 벤처 비상장 주식이다. 지금 사면 최소 5배"라는 밀실 권유가 들어옵니다.',
    affectedAssets: ['cash'],
    choices: [
      {
        text: '비상장주 허위 상장 사기의 전형적 수법임을 직시하고 단칼에 거절한다.',
        resultDescription: '금융 사기 세력의 달콤한 유혹을 물리치고 귀중한 현금 자산을 완벽하게 사수했습니다.',
        scoreChange: { decision: 20, longTerm: 10 }
      },
      {
        text: '상장 대박으로 인생을 바꿀 수 있다는 일확천금의 욕심에 현금 400만 원을 송금해 주식을 산다.',
        resultDescription: '해당 기업은 페이퍼 컴퍼니였으며 브로커는 잠적했습니다. 400만 원을 전액 사기당해 날렸습니다.',
        cashChange: -400,
        scoreChange: { decision: -30, longTerm: -20 }
      }
    ],
    lesson: '상장 직전 며칠 만에 몇 배의 수익을 보장한다는 비상장주 투자 권유는 대부분 원금 전부를 노리는 금융 사기입니다. 정보가 검증되지 않은 시장 투자는 극도로 위험합니다.',
    discussionQuestion: '비공개 정보나 대박을 약속하는 비공식 투자 권유를 받았을 때 철저히 의심해야 하는 이유는 무엇일까요?'
  },
  {
    id: 'isa_tax_exemption',
    title: 'ISA(개인자산관리계좌) 3년 만기 세제 혜택',
    description: '3년간 꾸준히 모아온 만능 통장 ISA 계좌가 만기되어 배당 및 이자 소득세 비과세 절세 혜택 100만 원을 챙겼습니다.',
    affectedAssets: ['cash', 'pension', 'deposit'],
    choices: [
      {
        text: 'ISA 만기 자금 중 100만 원을 연금저축/IRP 계좌로 이전하여 추가 세액공제 절세 혜택을 챙긴다.',
        resultDescription: '절세 통장의 만기 혜택을 연금 계좌로 연계하여 추가 16.5% 세금 환급까지 챙기는 최고 수준의 절세 전략을 펼쳤습니다.',
        cashChange: 100,
        scoreChange: { decision: 20, longTerm: 15 }
      },
      {
        text: '절세로 돌려받은 현금을 모두 통장에서 꺼내 고급 명품 옷과 쇼핑에 사용한다.',
        resultDescription: '소소한 쇼핑을 누렸지만 절세 자금을 재투자하여 더 큰 혜택을 만드는 연계 재무 전략을 놓쳤습니다.',
        cashChange: 100,
        scoreChange: { decision: -5, longTerm: -10 }
      }
    ],
    lesson: 'ISA(개인자산관리계좌)는 이자와 배당 소득세를 덜어주는 절세 필수 통장입니다. ISA 만기 해지금을 연금 계좌로 이전하면 추가 세액공제까지 받을 수 있는 "절세의 콤보 효과"가 발생합니다.',
    discussionQuestion: '정부가 마련한 다양한 절세 계좌(ISA, 연금저축 등)를 적극 활용하면 투자 수익률에 어떤 이점이 생길까요?'
  },
  {
    id: 'oil_price_surge',
    title: '국제 유가 폭등과 원자재 쇼크',
    description: '중동 분쟁으로 국제 유가가 배럴당 120달러를 넘어서며 기업들의 제조·물류 원가 부담이 가중되고 증시가 하락 압력을 받습니다.',
    affectedAssets: ['gold', 'korea_etf', 'stock_hyundai', 'cash'],
    choices: [
      {
        text: '인플레이션 방어력이 뛰어난 금과 원자재 비중을 확인하고 섣부른 주식 투매를 자제한다.',
        resultDescription: '원자재 쇼크 속에서도 금 가격 상승으로 포트폴리오 충격을 이겨내고 시장 복원력을 기다렸습니다.',
        impact: {
          gold: 0.10,
          korea_etf: -0.06,
          stock_hyundai: -0.08
        },
        scoreChange: { decision: 15, diversification: 15 }
      },
      {
        text: '유가 폭등으로 경제가 망할 것 같다는 뉴스 보도에 주식을 헐값에 모두 손절 매도한다.',
        resultDescription: '원자재 파동의 일시적 충격을 견디지 못하고 손실을 최고조에서 확정 짓는 우를 범했습니다. 매도된 주식 자금은 비상금/현금 통장으로 이체되었습니다.',
        impact: {
          korea_etf: -0.15,
          stock_hyundai: -0.18
        },
        liquidateCategory: 'equity',
        scoreChange: { decision: -15, longTerm: -15 }
      }
    ],
    lesson: '유가 등 원자재 가격 폭등은 기업 이익을 악화시켜 주가를 누르지만, 금과 같은 실물 자산은 가치가 오르는 경향이 있습니다. 자산 배분이 잘된 포트폴리오는 원자재 쇼크를 견뎌냅니다.',
    discussionQuestion: '유가가 오르면 전반적인 물가와 주식 시장에는 어떤 영향을 미치게 될까요?'
  },
  {
    id: 'mortgage_refinancing_chance',
    title: '주택담보대출 고금리 갈아타기 (대환대출)',
    description: '정부의 원스톱 대환대출 서비스 출시로 기존 연 5.5%의 주택담보대출을 연 3.8% 저금리 대출로 갈아탈 수 있는 기회가 생겼습니다.',
    affectedAssets: ['house', 'cash'],
    choices: [
      {
        text: '온라인 이자 비교 앱을 이용해 즉시 저금리 대출로 대환 신청을 완료한다.',
        resultDescription: '대출 이자 부담이 획기적으로 줄어들어 매 반기 현금 흐름 100만 원의 절감 이익을 획득했습니다.',
        cashChange: 100,
        scoreChange: { decision: 20, longTerm: 10 }
      },
      {
        text: '서류 준비가 귀찮고 복잡하다며 기존 고금리 대출을 그대로 방치한다.',
        resultDescription: '앉은 자리에서 아낄 수 있는 수백만 원의 대출 이자를 허공으로 날려 보냈습니다.',
        scoreChange: { decision: -15, longTerm: -15 }
      }
    ],
    lesson: '대출 이자는 자산 형성의 가장 큰 적입니다. 금리 변동기나 정책 금융 서비스가 출시되었을 때 신속하게 저금리 대출로 갈아타는(대환) 적극성이 가계 재정을 지킵니다.',
    discussionQuestion: '대출 금리를 1%p 낮추었을 때 억 단위 대출에서 절약되는 이자는 어느 정도일까요?'
  },
  {
    id: 'overseas_stock_tax_notice',
    title: '해외주식 양도소득세 과세 통지',
    description: '지난해 해외주식 및 글로벌 ETF 매도로 발생한 수익이 연간 기본공제 250만 원을 초과하여 22% 양도소득세 통지서가 발송되었습니다.',
    affectedAssets: ['global_etf', 'stock_apple', 'stock_nvidia', 'cash'],
    choices: [
      {
        text: '연말 손익 통산(손실 종목 사전 매도) 기법을 숙지하고 정해진 기한 내에 성실하게 납부한다.',
        resultDescription: '해외 투자 세법 규칙을 이해하고 성실히 세금을 납부하여 건전한 금융 상식을 갖추었습니다.',
        cashChange: -50,
        scoreChange: { decision: 20, longTerm: 10 }
      },
      {
        text: '세금이 아깝다며 납부를 미루다가 징벌적 가산세까지 추가로 부담하게 된다.',
        resultDescription: '세금 납부 지연으로 불필요한 가산세 80만 원이 추가 지출되어 큰 손해를 입었습니다.',
        cashChange: -80,
        scoreChange: { decision: -20, emergency: -10 }
      }
    ],
    lesson: '해외주식은 수익 중 연 250만 원을 초과하는 금액에 대해 22%의 양도소득세가 부과됩니다. 매년 이익과 손실을 상계하는 손익 통산 절세 전략을 활용하면 세금 부담을 합리적으로 줄일 수 있습니다.',
    discussionQuestion: '해외 주식 투자 시 국내 주식과 달리 고려해야 하는 세금(양도소득세, 환율)에는 어떤 것들이 있을까요?'
  },
  {
    id: 'appliance_breakdown',
    title: '갑작스러운 가전 고장 및 누수 수리비 청구',
    description: '여름철 냉장고와 에어컨이 동시에 고장 나고 욕실 누수 수리로 인해 200만 원의 급작스러운 지출이 발생했습니다.',
    affectedAssets: ['cash', 'deposit', 'saving'],
    choices: [
      {
        text: '입출금 통장에 마련해 둔 비상금 200만 원으로 수리비를 즉시 충당한다.',
        resultDescription: '든든하게 모아둔 비상금 덕분에 가입 중인 정기예적금이나 주식을 해지하지 않고 위기를 말끔히 넘겼습니다.',
        cashChange: -200,
        scoreChange: { emergency: 20, decision: 10 }
      },
      {
        text: '비상금이 없어 눈물을 머금고 만기가 얼마 안 남은 정기적금을 중도 해지한다.',
        resultDescription: '적금을 깨면서 중도해지 이율 페널티를 물고 그동안 쌓아온 이자를 크게 손해 보았습니다.',
        cashChange: -200,
        impact: {
          saving: -0.10
        },
        scoreChange: { emergency: -15, decision: -15 }
      }
    ],
    lesson: '살다 보면 예치하지 못한 가전 고장, 누수, 사고 등 급전 지출이 발생합니다. 비상금(Cash)이 구축되어 있어야만 소중한 장기 적금이나 투자를 깨지 않고 수비할 수 있습니다.',
    discussionQuestion: '갑작스러운 200만 원 지출 상황에서 비상금이 있는 사람과 없는 사람의 대처 차이는 무엇일까요?'
  },
  {
    id: 'child_education_planning',
    title: '자녀 성장에 따른 교육비 지출 증가',
    description: '자녀가 성장함에 따라 학원비 및 교재비 등 월 고정 지출 부담이 크게 늘어나기 시작합니다.',
    affectedAssets: ['cash', 'saving', 'pension'],
    choices: [
      {
        text: '지출 예산을 재조정하여 불필요한 외식 소비를 줄이고 자동 연금과 저축 납입을 포기하지 않고 사수한다.',
        resultDescription: '소비 지출을 효율화하여 자녀 교육 지원과 부모의 장기 노후 대비 투자를 동시에 훌륭하게 밸런스 잡았습니다.',
        cashChange: -100,
        scoreChange: { decision: 15, longTerm: 15 }
      },
      {
        text: '교육비 충당을 핑계로 가입되어 있던 장기 연금저축 통장을 해지하여 전액 소비해 버린다.',
        resultDescription: '세제 혜택받은 금액을 다시 뱉어내며 연금을 해지하여 장기 노후 자산에 큰 구멍이 뚫렸습니다.',
        cashChange: -100,
        impact: {
          pension: -0.15
        },
        scoreChange: { longTerm: -20, decision: -15 }
      }
    ],
    lesson: '자녀 교육비는 자산 형성기에 다가오는 거대한 고정 지출입니다. 교육비 지출을 위해 노후 대비 연금을 깨기보다는 평소 생활비 소비를 줄이고 장기 저축 구조를 지켜내는 재무 밸런스가 절실합니다.',
    discussionQuestion: '자녀 교육비 지출과 부모의 노후 준비 연금 투자 간의 균형은 어떻게 잡아야 할까요?'
  },
  {
    id: 'semiconductor_downcycle',
    title: '반도체 빙하기와 업황 다운사이클',
    description: '글로벌 IT 기기 수요 둔화로 메모리 반도체 재고가 쌓이고 가격이 급락하면서 보유 중인 반도체 우량주 주가가 하락 조정받습니다.',
    affectedAssets: ['stock_samsung', 'stock_skhynix', 'korea_etf'],
    choices: [
      {
        text: '반도체 산업의 업황 사이클(다운사이클 후 회복)을 이해하고 적립식 투자를 유지하며 바닥을 인내한다.',
        resultDescription: '주기적 사이클 산업의 본질을 파악하고 최저점 투매를 피해 훗날 업턴(상승장) 시 큰 수익을 거둘 기반을 지켰습니다.',
        impact: {
          stock_samsung: -0.10,
          stock_skhynix: -0.15,
          korea_etf: -0.05
        },
        scoreChange: { longTerm: 15, decision: 10 }
      },
      {
        text: '주가가 계속 떨어질 것 같은 공포에 견디지 못하고 최저점 구간에서 손절매를 단행한다.',
        resultDescription: '공포심에 반도체 주식을 최저점에서 전량 매도(손절)하여 매도 대금이 비상금/현금 통장으로 이체되었습니다. 향후 업황 회복 시 다가올 상승 혜택을 스스로 포기했습니다.',
        impact: {
          stock_samsung: -0.18,
          stock_skhynix: -0.25
        },
        liquidateAssets: ['stock_samsung', 'stock_skhynix'],
        scoreChange: { longTerm: -20, decision: -15 }
      }
    ],
    lesson: '반도체 등 사이클 산업은 불황과 호황이 번갈아 찾아옵니다. 다운사이클(불황)의 바닥에서 공포를 견디지 못하고 투매하면 손실이 확정되므로 사이클을 이해하는 긴 호흡이 필수적입니다.',
    discussionQuestion: '경기 사이클을 타는 산업(반도체, 자동차 등)에 투자할 때 주가 하락기에 지켜야 할 마음가짐은 무엇일까요?'
  },
  {
    id: 'sns_fomo_luxury',
    title: 'SNS 명품 및 럭셔리 여행 허세의 유혹',
    description: 'SNS에서 동창들이 화려한 명품 시계와 유럽 럭셔리 여행 사진을 자랑하는 것을 보고 깊은 소외감(FOMO)과 소비욕을 느낍니다.',
    affectedAssets: ['cash'],
    choices: [
      {
        text: '남과의 비교는 자산 형성의 가장 큰 적임을 상각하고 나만의 복리 자산 성장 목표에 주체적으로 집중한다.',
        resultDescription: '단기적 과시 욕구를 성공적으로 제어하고 장기 자산가의 단단한 심리를 증명해 보였습니다.',
        scoreChange: { decision: 20, longTerm: 15 }
      },
      {
        text: '남들에게 질 수 없다며 즉흥적으로 6개월 할부로 300만 원짜리 명품 시계를 구매한다.',
        resultDescription: '일시적 허세는 챙겼으나 매달 할부금이 나가며 시드머니를 모을 저축 여력이 크게 감축되었습니다.',
        cashChange: -300,
        scoreChange: { decision: -20, longTerm: -15 }
      }
    ],
    lesson: '남들과 나를 비교하며 소비하는 "체면 소비"와 "포모(FOMO)"는 복리 자산 형성을 막는 최고의 장애물입니다. 소비 통제력이 뛰어난 사람만이 진정한 재정적 자유를 얻을 수 있습니다.',
    discussionQuestion: 'SNS 과시 문화 속에서 타인과의 비교에 흔들리지 않고 나의 소비 원칙을 지키는 방법은 무엇일까요?'
  }
];

const BASE_EVENT_METADATA: { [id: string]: Partial<GameEvent> } = {
  rate_up: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  rate_down: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  korea_bull: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  global_crash: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  exchange_spike: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  inflation_shock: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  voice_phishing: { minAge: 25, maxAge: 35, lifeStage: 'early_career' },
  scam_offer: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  theme_stock: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  medical_emergency: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  lease_raise: { minAge: 25, maxAge: 40, lifeStage: 'early_career' },
  buy_car: { minAge: 25.5, maxAge: 33, lifeStage: 'early_career' },
  independent_living: { minAge: 25, maxAge: 29.5, lifeStage: 'early_career', isMilestone: true },
  patience_test: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  housing_subscription_chance: { minAge: 31, maxAge: 44, lifeStage: 'marriage', isMilestone: true },
  buy_house_opportunity: { minAge: 30, maxAge: 45, lifeStage: 'marriage' },
  pension_tax_refund: { minAge: 26, maxAge: 52, lifeStage: 'early_career' },
  job_promotion: { minAge: 26.5, maxAge: 48, lifeStage: 'early_career' },
  gold_rush: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  stock_crash_one: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  crypto_craze: { minAge: 25, maxAge: 45, lifeStage: 'general' },
  tax_reform: { minAge: 28, maxAge: 55, lifeStage: 'general' },
  tech_disruption_crash: { minAge: 26, maxAge: 55, lifeStage: 'general' },
  ai_revolution: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  dividend_payout: { minAge: 27, maxAge: 55, lifeStage: 'general' },
  side_hustle_success: { minAge: 26, maxAge: 46, lifeStage: 'early_career' },
  jeonse_fraud_prevention: { minAge: 26.5, maxAge: 40, lifeStage: 'early_career' },
  bank_failure_panic: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  marriage_expense: { minAge: 29, maxAge: 34.5, lifeStage: 'marriage', isMilestone: true },
  unlisted_stock_scam: { minAge: 26.5, maxAge: 55, lifeStage: 'general' },
  isa_tax_exemption: { minAge: 28, maxAge: 50, lifeStage: 'early_career' },
  oil_price_surge: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  mortgage_refinancing_chance: { minAge: 31, maxAge: 55, lifeStage: 'general' },
  overseas_stock_tax_notice: { minAge: 27.5, maxAge: 55, lifeStage: 'general' },
  appliance_breakdown: { minAge: 26, maxAge: 55, lifeStage: 'general' },
  child_education_planning: { minAge: 35, maxAge: 46, lifeStage: 'child_care', isMilestone: true },
  semiconductor_downcycle: { minAge: 25, maxAge: 55, lifeStage: 'general' },
  sns_fomo_luxury: { minAge: 25, maxAge: 34, lifeStage: 'early_career' }
};

const ENRICHED_BASE_EVENTS: GameEvent[] = RAW_BASE_EVENTS.map(event => ({
  ...event,
  ...(BASE_EVENT_METADATA[event.id] || { minAge: 25, maxAge: 55, lifeStage: 'general' })
}));

export const EVENTS: GameEvent[] = [
  ...ENRICHED_BASE_EVENTS,
  ...MIDLIFE_AND_RETIREMENT_EVENTS
];


