import type { HistoricalChapter } from '../../types/chapter';

export const HISTORICAL_CHAPTERS: HistoricalChapter[] = [
  {
    id: 'chapter_1',
    chapterNumber: 1,
    startYear: 1980,
    endYear: 1985,
    titleKo: '고물가와 긴축의 시대',
    eraNameKo: '1980년대 초반: 제2차 오일쇼크 여파와 볼커의 초고금리 긴축',
    
    startContext: {
      knownAsOf: '1980년 초',
      descriptionKo: '제2차 석유파동의 여파로 미국 연준 폴 볼커 의장은 인플레이션 억제를 위해 기준금리를 최고 20%까지 인상하며 강력한 긴축에 돌입했습니다. 한국 경제는 중화학공업 투자조정과 강력한 물가안정화 정책을 겪으며 산업 체질을 개선하고 있습니다.',
      keyObservationVariables: [
        { name: '미국 연준 기준금리', description: '인플레이션 파이터 폴 볼커의 초고금리 긴축 강도' },
        { name: '국제 유가 (WTI)', description: '오일쇼크 진정 및 원자재 가격 안정 추이' },
        { name: '한국 수출액 성장률', description: '중화학공업 구조조정 후 대외 경쟁력 회복 속도' }
      ]
    },

    retrospective: {
      revealedAfterCompletion: true,
      descriptionKo: '연 15~20%에 달하는 초고금리와 저성장의 스태그플레이션을 통과하며 미국은 레이거노믹스 감세와 물가 안정을 이뤄냈고, 한국은 반도체와 자동차 등 수출 제조 강국으로의 도약을 시작했습니다.',
      majorEvents: [
        { year: 1981, titleKo: '연준 초고금리 정점', summaryKo: '폴 볼커의 20% 긴축으로 인플레이션 진정 시작' },
        { year: 1982, titleKo: '멕시코 외채위기 및 금리 인하', summaryKo: '남미 부채위기 대응을 위한 금리 완화' },
        { year: 1983, titleKo: '삼성전자 64K D램 개발 선언', summaryKo: '한국 첨단 반도체 신화의 첫 출발' },
        { year: 1985, titleKo: '플라자 합의(Plaza Accord)', summaryKo: '미국·일본·독일 등 5개국 환율 조정으로 엔고 시작' }
      ]
    },

    // Compatibility fields
    descriptionKo: '제2차 석유파동의 여파로 미국 연준 폴 볼커 의장은 기준금리를 최고 20%까지 인상하여 인플레이션 억제에 돌입했습니다. 한국 경제는 중화학공업 투자조정과 강력한 물가안정화 정책을 겪으며 산업 체질을 개선하던 시기입니다.',
    historicalContext: '당시 투자자들은 연 15~20%에 달하는 고금리 예금과 주식 시장의 저평가 사이에서 자산 배분을 고뇌했습니다.',
    keyObservationVariables: [
      { name: '미국 연준 기준금리', description: '인플레이션 파이터 폴 볼커의 초고금리 긴축 강도' },
      { name: '국제 유가 (WTI)', description: '오일쇼크 진정 및 원자재 가격 안정 추이' },
      { name: '한국 수출액 성장률', description: '중화학공업 구조조정 후 대외 경쟁력 회복 속도' }
    ],

    suggestedGoals: [
      { id: 'goal_c1_balance', titleKo: '한·미 글로벌 분산 (주식 30% 이상 분산)', descriptionKo: '한국과 미국 자산에 균형 있게 분산하여 통화 리스크를 분산합니다.', targetType: 'ASSET_ALLOCATION', targetValue: 30 },
      { id: 'goal_c1_filings', titleKo: '공시 및 뉴스 확인 (3건 이상)', descriptionKo: '당시 발표된 거시 경제 뉴스와 기업 실적을 꼼꼼히 확인합니다.', targetType: 'FILINGS_COUNT', targetValue: 3 },
      { id: 'goal_c1_cost', titleKo: '비용 통제 (수수료 절약)', descriptionKo: '불필요한 과잉 매매를 줄이고 장기 보유 관점으로 접근합니다.', targetType: 'COST_SAVING', targetValue: 1 }
    ],

    suggestedRiskMissions: [
      { id: 'risk_c1_mdd', titleKo: '최대낙폭(MDD) -30% 이내 방어', descriptionKo: '고금리 긴축 충격 속에서 포트폴리오 낙폭을 -30% 이내로 통제합니다.', missionType: 'MAX_DRAWDOWN', targetValue: 0.30 },
      { id: 'risk_c1_cap', titleKo: '단일 종목 최대 비중 35% 이하 유지', descriptionKo: '특정 1개 종목에 대한 과도한 집중위험을 제한합니다.', missionType: 'MAX_STOCK_WEIGHT', targetValue: 0.35 },
      { id: 'risk_c1_cash', titleKo: '현금 비중 최소 10% 이상 보유', descriptionKo: '고금리 시기 유동성 안전판(현금 10% 이상)을 확보합니다.', missionType: 'MIN_CASH_BUFFER', targetValue: 0.10 },
      { id: 'risk_c1_fees', titleKo: '누적 거래비용 0.8% 이하 절감', descriptionKo: '잦은 매매로 인한 자산 갉아먹기를 방지합니다.', missionType: 'MAX_FEES_RATIO', targetValue: 0.008 }
    ]
  },
  {
    id: 'chapter_2',
    chapterNumber: 2,
    startYear: 1986,
    endYear: 1990,
    titleKo: '3저 호황과 자산시장 팽창',
    eraNameKo: '1980년대 후반: 플라자 합의, 3저 호황과 대외 변동성',
    
    startContext: {
      knownAsOf: '1986년 초',
      descriptionKo: '1985년 플라자 합의 이후 저유가·저금리·저달러(엔고)의 3저 호황 기대감이 커지고 있습니다. 일본 엔화 강세로 한국 수출 기업들의 대외 가격 경쟁력이 급상승하고 있으며, 글로벌 자산시장에 유동성이 유입되고 있습니다.',
      keyObservationVariables: [
        { name: '엔/달러 환율 (엔고 강도)', description: '플라자 합의 이후 일본 엔화 강세에 따른 한국 수출 반사이익' },
        { name: '한국 경상수지 흑자 규모', description: '사상 첫 무역 흑자 전환 및 기업 수익성 개선' },
        { name: '미국 증시 밸류에이션', description: '장기 강세장에 따른 주가 멀티플 확장과 변동성' }
      ]
    },

    retrospective: {
      revealedAfterCompletion: true,
      descriptionKo: '한국 경제는 사상 최초의 경상수지 흑자를 기록하며 종합주가지수 1,000p를 돌파하는 대호황을 누렸습니다. 그러나 미국 증시는 1987년 10월 19일 컴퓨터 프로그램 매매로 사상 최대의 단일 낙폭인 블랙 먼데이(-22.6%) 폭락을 겪었습니다.',
      majorEvents: [
        { year: 1986, titleKo: '3저 호황 및 무역수지 흑자', summaryKo: '한국 경제 건국 이래 첫 경상수지 흑자 달성' },
        { year: 1987, titleKo: '10월 블랙 먼데이 폭락', summaryKo: '뉴욕 다우지수 하루 만에 -22.6% 사상 최대 폭락' },
        { year: 1988, titleKo: '서울올림픽과 국민주 보급', summaryKo: '포항제철 등 국민주 공모와 증시 대중화' },
        { year: 1989, titleKo: '코스피 1,000포인트 돌파', summaryKo: '종합주가지수 사상 최초 네 자릿수 안착' }
      ]
    },

    descriptionKo: '1985년 플라자 합의 이후 저유가·저금리·저달러(엔고)의 3저 호황에 힘입어 한국 경제는 사상 최초의 경상수지 흑자를 기록하고 종합주가지수 1,000포인트를 돌파했습니다. 미국은 1987년 10월 19일 사상 최대의 단일 낙폭인 블랙 먼데이 폭락을 경험했습니다.',
    historicalContext: '한국 증시의 트로이카 열풍과 함께 국민주 보급이 이뤄졌으며, 88 서울올림픽 전후로 자산시장이 폭발적으로 팽창했습니다.',
    keyObservationVariables: [
      { name: '엔/달러 환율 (엔고 강도)', description: '플라자 합의 이후 일본 엔화 강세에 따른 한국 수출 반사이익' },
      { name: '한국 경상수지 흑자 규모', description: '사상 첫 무역 흑자 전환과 외채 상환' },
      { name: 'S&P 500 일간 변동성', description: '1987년 블랙먼데이 전후의 급격한 변동성 충격' }
    ],

    suggestedGoals: [
      { id: 'goal_c2_cap', titleKo: '단일 종목 집중 방지 (최대 35% 이하)', descriptionKo: '호황장에서도 특정 인기 테마주에 몰빵하지 않고 비중을 제한합니다.', targetType: 'MAX_WEIGHT_CAP', targetValue: 35 },
      { id: 'goal_c2_thesis', titleKo: '투자 가설 기록 (2회 이상)', descriptionKo: '과열된 증시에서 매수 이유와 예상 시나리오를 명문화합니다.', targetType: 'THESIS_COUNT', targetValue: 2 },
      { id: 'goal_c2_rebalance', titleKo: '원칙 기반 리밸런싱 유지', descriptionKo: '급등한 자산을 일부 실현하고 현금 또는 저평가 자산으로 재배분합니다.', targetType: 'REBALANCE_DISCIPLINE', targetValue: 1 }
    ],

    suggestedRiskMissions: [
      { id: 'risk_c2_mdd', titleKo: '블랙먼데이 충격 속 MDD -30% 이내', descriptionKo: '1987년 글로벌 폭락 충격 속에서도 낙폭을 -30% 이내로 방어합니다.', missionType: 'MAX_DRAWDOWN', targetValue: 0.30 },
      { id: 'risk_c2_cap', titleKo: '단일 종목 최대 비중 30% 이하', descriptionKo: '특정 인기 종목 과열 시에도 비중 30% 이하 원칙을 지킵니다.', missionType: 'MAX_STOCK_WEIGHT', targetValue: 0.30 },
      { id: 'risk_c2_sectors', titleKo: '최소 3개 이상 섹터 분산', descriptionKo: '제조, 금융, 소비재 등 3개 이상 업종에 분산 투자합니다.', missionType: 'MIN_SECTOR_COUNT', targetValue: 3 },
      { id: 'risk_c2_crisis_thesis', titleKo: '위기 발생 시 투자 가설 기록', descriptionKo: '시장 충격 시 패닉하지 않고 투자 판단 근거를 기록합니다.', missionType: 'RECORD_CRISIS_THESIS', targetValue: 1 }
    ]
  },
  {
    id: 'chapter_3',
    chapterNumber: 3,
    startYear: 1991,
    endYear: 1995,
    titleKo: '세계화와 PC 혁명',
    eraNameKo: '1990년대 초중반: 자본시장 개방과 PC·소프트웨어 기술 태동',
    
    startContext: {
      knownAsOf: '1991년 초',
      descriptionKo: '냉전 종식과 함께 세계무역기구(WTO) 중심의 글로벌 자유무역 체제가 가시화되고 있습니다. 한국은 외국인 직접투자 허용을 앞두고 자본시장 개방 준비에 착수했으며, 미국에서는 개인용 컴퓨터(PC)와 마이크로소프트의 소프트웨어 혁신이 시작되고 있습니다.',
      keyObservationVariables: [
        { name: '외국인 주식시장 개방 일정', description: '한국 자본시장 개방에 따른 외국인 자금 유입 기대' },
        { name: 'D램 메모리 수출 가격', description: '삼성전자 등 한국 반도체 산업의 글로벌 사이클' },
        { name: '미국 테크 기업 Capex', description: 'PC 및 소프트웨어 보급에 따른 기업 IT 투자 추이' }
      ]
    },

    retrospective: {
      revealedAfterCompletion: true,
      descriptionKo: '1992년 한국 증시가 사상 최초로 외국인에게 개방되며 저PER 혁명이 일어났고, 삼성전자가 64M D램을 세계 최초로 개발하며 반도체 강국으로 올라섰습니다. 미국은 Windows 95 출시와 인텔 펜티엄 보급으로 PC 시대를 확고히 열었습니다.',
      majorEvents: [
        { year: 1992, titleKo: '한국 증시 외국인 직접투자 개방', summaryKo: '외국인 한도 10% 설정 및 가치주 재평가 랠리' },
        { year: 1992, titleKo: '삼성전자 세계 최초 64M D램 개발', summaryKo: '메모리 반도체 세계 1위 등극' },
        { year: 1994, titleKo: '연준 긴축과 채권시장 대학살', summaryKo: '미 연준 기준금리 급인상으로 신흥국 환율 압박' },
        { year: 1995, titleKo: 'Windows 95 출시 및 WTO 출범', summaryKo: 'PC GUI 대중화와 전 세계 무역 장벽 철폐' }
      ]
    },

    descriptionKo: '1992년 한국 증시가 외국인 투자자에게 사상 최초로 직접 개방되며 저PER 혁명이 일어났고, 삼성전자의 64M D램 세계 최초 개발로 반도체 신화가 시작되었습니다.',
    historicalContext: '글로벌 무역기구(WTO) 출범과 함께 세계화 물결이 거세졌으며, 한국 기업들은 글로벌 메모리 반도체 1위로 도약했습니다.',
    keyObservationVariables: [
      { name: '외국인 주식 순매수 규모', description: '한국 자본시장 개방 이후 외국인 자금 유입과 밸류에이션 재평가' },
      { name: 'D램 메모리 수출 가격', description: '삼성전자 등 한국 반도체 산업의 글로벌 사이클' },
      { name: '미국 테크 기업 설비투자(Capex)', description: 'PC 및 소프트웨어 보급에 따른 기업 IT 투자 확대' }
    ],

    suggestedGoals: [
      { id: 'goal_c3_filings', titleKo: '기업 공시 및 제품 혁신 확인 (4건 이상)', descriptionKo: '반도체, PC 등 첨단 산업의 기술 혁신 공시를 직접 읽어봅니다.', targetType: 'FILINGS_COUNT', targetValue: 4 },
      { id: 'goal_c3_balance', titleKo: '미국 테크주와 한국 제조업 분산', descriptionKo: '기술 혁신을 주도하는 미국과 제조 경쟁력을 갖춘 한국에 분산합니다.', targetType: 'ASSET_ALLOCATION', targetValue: 40 },
      { id: 'goal_c3_cost', titleKo: '장기 복리 투자 원칙 고수', descriptionKo: '잦은 교체매매 없이 혁신 기업의 장기 성장에 동참합니다.', targetType: 'COST_SAVING', targetValue: 1 }
    ],

    suggestedRiskMissions: [
      { id: 'risk_c3_mdd', titleKo: '최대낙폭(MDD) -25% 이내 관리', descriptionKo: '금리 변동기에도 안정적인 자산배분으로 낙폭을 방어합니다.', missionType: 'MAX_DRAWDOWN', targetValue: 0.25 },
      { id: 'risk_c3_cap', titleKo: '단일 종목 최대 비중 35% 이하', descriptionKo: '특정 반도체/PC 주도주 쏠림을 방지합니다.', missionType: 'MAX_STOCK_WEIGHT', targetValue: 0.35 },
      { id: 'risk_c3_cash', titleKo: '현금 비중 최소 5% 유지', descriptionKo: '유동성 안전마진을 확보합니다.', missionType: 'MIN_CASH_BUFFER', targetValue: 0.05 },
      { id: 'risk_c3_fees', titleKo: '누적 거래비용 0.6% 이하 절감', descriptionKo: '장기 복리 효율성을 극대화합니다.', missionType: 'MAX_FEES_RATIO', targetValue: 0.006 }
    ]
  },
  {
    id: 'chapter_4',
    chapterNumber: 4,
    startYear: 1996,
    endYear: 2000,
    titleKo: '외환위기와 닷컴 열풍',
    eraNameKo: '1990년대 후반: 대외건전성 압박과 인터넷 신경제 태동',
    
    startContext: {
      knownAsOf: '1996년 초',
      descriptionKo: '한국에서는 OECD 가입과 함께 자본 자유화가 확대되고 있으나, 반도체 가격 급락과 경상수지 적자 누적으로 대기업 차입 경영에 대한 경계감이 커지고 있습니다. 미국에서는 월드와이드웹(WWW) 인터넷 보급과 함께 정보통신 산업에 대한 투자 열기가 고조되고 있습니다.',
      keyObservationVariables: [
        { name: '원/달러 환율 및 외환보유액', description: '한국 경상수지 적자와 단기 대외부채 만기 연장 여부' },
        { name: '한국 대기업 부채비율', description: '재벌 그룹의 과잉 중복 투자와 금융권 여신 건전성' },
        { name: '미국 나스닥 밸류에이션 (PER)', description: '인터넷 기업들의 주가 멀티플 확장과 실적 지속성' }
      ]
    },

    retrospective: {
      revealedAfterCompletion: true,
      descriptionKo: '1997년 한국은 외환보유액 고갈로 IMF 구제금융을 신청하며 환율 폭등(2,000원)과 대기업 연쇄부도의 고통을 겪었습니다. 반면 미국에서는 실리콘밸리 닷컴 버블로 나스닥이 5,000p를 돌파했으나 2000년 봄 실체 없는 기술주들이 급격히 붕괴하기 시작했습니다.',
      majorEvents: [
        { year: 1997, titleKo: '한보철강·기아 부도 및 IMF 구제금융', summaryKo: '외환보유액 고갈로 11월 IMF 긴급 자금 지원 신청' },
        { year: 1998, titleKo: '한국 금모으기 운동 및 고강도 구조조정', summaryKo: '부실 금융기관 퇴출과 기업 체질 개선' },
        { year: 1999, titleKo: '닷컴 버블 광풍과 한국 V자 반등', summaryKo: '인터넷 테마주 폭등과 코스피 1,000선 조기 회복' },
        { year: 2000, titleKo: '나스닥 5,000p 정점 및 버블 붕괴', summaryKo: '적자 기술주 주가 급락과 IT 거품 해소 시작' }
      ]
    },

    descriptionKo: '1990년대 후반 한국과 미국 시장은 각기 다른 형태의 극단적 변동성을 경험했습니다. 한국은 대외 충격과 구조조정을 겪었고, 미국은 인터넷 혁신과 버블의 정점을 통과했습니다.',
    historicalContext: '한국은 IMF 체제 속 대규모 구조조정을 거쳐 회복했고, 미국은 실리콘밸리 닷컴 열풍 후 버블 붕괴를 맞았습니다.',
    keyObservationVariables: [
      { name: '원/달러 환율', description: '외환시장 변동성과 달러 자산 가치' },
      { name: '한국 단기금리(CD/콜금리)', description: '고금리 처방에 따른 기업 생존 압박' },
      { name: '나스닥/S&P 500 밸류에이션 (PER)', description: '인터넷 버블의 극단적 멀티플 확장과 이후 급락' }
    ],

    suggestedGoals: [
      { id: 'goal_c4_survive', titleKo: '위기 속 현금 및 FX 분산 유지', descriptionKo: '원화 약세 국면에서 달러 자산과 안전마진(현금) 비중을 지킵니다.', targetType: 'ASSET_ALLOCATION', targetValue: 30 },
      { id: 'goal_c4_cap', titleKo: '버블 광풍 속 집중위험 통제 (최대 30% 이하)', descriptionKo: '닷컴 테마주에 뇌동매매 몰빵하지 않고 분산 원칙을 지킵니다.', targetType: 'MAX_WEIGHT_CAP', targetValue: 30 },
      { id: 'goal_c4_thesis', titleKo: '위기 분석 가설 기록 (3회 이상)', descriptionKo: '공포와 탐욕의 극단에서 이성적인 판단 근거를 메모로 남깁니다.', targetType: 'THESIS_COUNT', targetValue: 3 }
    ],

    suggestedRiskMissions: [
      { id: 'risk_c4_mdd', titleKo: '외환위기/닷컴폭락 속 MDD -40% 이내 방어', descriptionKo: '사상 초유의 40% 이상 폭락장 속에서 낙폭을 -40% 이내로 통제합니다.', missionType: 'MAX_DRAWDOWN', targetValue: 0.40 },
      { id: 'risk_c4_cap', titleKo: '단일 종목 최대 비중 30% 이하 유지', descriptionKo: '특정 닷컴/구조조정 종목에 대한 몰빵을 엄격히 금지합니다.', missionType: 'MAX_STOCK_WEIGHT', targetValue: 0.30 },
      { id: 'risk_c4_cash', titleKo: '위기 구간 현금 비중 10% 이상 유지', descriptionKo: '안전마진 현금을 확보하여 생존력을 유지합니다.', missionType: 'MIN_CASH_BUFFER', targetValue: 0.10 },
      { id: 'risk_c4_crisis_thesis', titleKo: '위기 대응 가설/메모 기록', descriptionKo: '1997년 외환위기 및 2000년 닷컴 충격 시 투자 가설을 기록합니다.', missionType: 'RECORD_CRISIS_THESIS', targetValue: 1 }
    ]
  },
  {
    id: 'chapter_5',
    chapterNumber: 5,
    startYear: 2001,
    endYear: 2005,
    titleKo: '버블 붕괴와 중국 성장',
    eraNameKo: '2000년대 초반: IT 버블 후유증과 중국 WTO 가입',
    
    startContext: {
      knownAsOf: '2001년 초',
      descriptionKo: '닷컴 버블 붕괴의 여파로 미국 기술주 침체가 이어지는 가운데 미 연준은 금리 인하로 경기 부양에 나섰습니다. 한국은 IT 벤처 열풍 조정과 카드사 연체율 증가를 주시하고 있으며, 중국의 WTO(세계무역기구) 가입으로 아시아 제조업 지형이 재편되고 있습니다.',
      keyObservationVariables: [
        { name: '중국 경제성장률 및 무역량', description: '세계의 공장으로 부상한 중국의 두 자릿수 경제성장 추이' },
        { name: '미국 연준 기준금리 인하 속도', description: 'IT 버블 붕괴와 경기 침체 대응을 위한 초저금리 완화 기조' },
        { name: '한국 가계부채 및 연체율', description: '신용카드 발급 남발에 따른 내수 금융 건전성' }
      ]
    },

    retrospective: {
      revealedAfterCompletion: true,
      descriptionKo: '2001년 9·11 테러와 2003년 카드채 대란의 시련을 겪었으나, 중국의 폭발적인 인프라 투자로 철강·화학·조선·해운의 원자재 슈퍼사이클이 열렸습니다. 한국은 적립식 펀드 붐과 기업 지배구조 개선으로 코스피 1,000 시대를 확고히 안착시켰습니다.',
      majorEvents: [
        { year: 2001, titleKo: '9·11 테러와 증시 일시 거래정지', summaryKo: '미국 본토 테러 충격과 긴급 0.50%p 금리 인하' },
        { year: 2001, titleKo: '중국 WTO 공식 가입', summaryKo: '글로벌 원자재 및 중간재 수요 폭발의 서막' },
        { year: 2003, titleKo: '한국 신용카드 대란', summaryKo: '가계 연체율 급등과 카드사 구조조정 단행' },
        { year: 2005, titleKo: '적립식 펀드 열풍과 코스피 1,000 안착', summaryKo: '개인 간접투자 붐으로 16년 만에 사상 최고치 경신' }
      ]
    },

    descriptionKo: '2001년 9·11 테러와 닷컴 버블의 긴 여파로 글로벌 증시가 침체에 빠졌고, 한국은 2003년 카드채 대란을 겪었습니다. 그러나 중국의 WTO 가입 이후 거대한 인프라 투자가 시작되며 차화정 슈퍼사이클이 열렸습니다.',
    historicalContext: '미국 연준은 저금리 기조로 부동산 시장 붐을 촉발했고, 한국은 적립식 펀드 열풍으로 코스피 1,000 시대를 안착시켰습니다.',
    keyObservationVariables: [
      { name: '중국 경제성장률 (GDP)', description: '세계의 공장으로 부상한 중국의 두 자릿수 성장률' },
      { name: 'BDI(발틱운임지수) 및 철강/유가', description: '글로벌 원자재 슈퍼사이클과 해상 물동량 급증' },
      { name: '한국 가계부채 및 연체율', description: '카드사 구조조정과 내수 소비 회복 속도' }
    ],

    suggestedGoals: [
      { id: 'goal_c5_discipline', titleKo: '적립식 분할매수 및 리밸런싱 유지', descriptionKo: '시장 변동성에 흔들리지 않고 매년 정해진 규칙대로 리밸런싱합니다.', targetType: 'REBALANCE_DISCIPLINE', targetValue: 1 },
      { id: 'goal_c5_filings', titleKo: '기업 턴어라운드 공시 확인 (3건 이상)', descriptionKo: '구조조정을 마치고 흑자 전환한 기업들의 재무제표를 점검합니다.', targetType: 'FILINGS_COUNT', targetValue: 3 },
      { id: 'goal_c5_diversify', titleKo: '업종 분산 (제조업 + IT + 금융)', descriptionKo: '중국 수혜 산업과 글로벌 기술주에 골고루 자산을 배분합니다.', targetType: 'ASSET_ALLOCATION', targetValue: 35 }
    ],

    suggestedRiskMissions: [
      { id: 'risk_c5_mdd', titleKo: '최대낙폭(MDD) -25% 이내 관리', descriptionKo: '9·11 충격과 카드사 위기 속에서 낙폭을 -25% 이내로 통제합니다.', missionType: 'MAX_DRAWDOWN', targetValue: 0.25 },
      { id: 'risk_c5_cap', titleKo: '단일 종목 최대 비중 35% 이하', descriptionKo: '중국 특수 수혜주 과열 속에서도 비중 상한을 준수합니다.', missionType: 'MAX_STOCK_WEIGHT', targetValue: 0.35 },
      { id: 'risk_c5_sectors', titleKo: '최소 3개 이상 섹터 유지', descriptionKo: '원자재, IT, 소비재 등 포트폴리오를 분산합니다.', missionType: 'MIN_SECTOR_COUNT', targetValue: 3 },
      { id: 'risk_c5_fees', titleKo: '누적 거래비용 0.7% 이하 절감', descriptionKo: '장기 분할매수 원칙을 지킵니다.', missionType: 'MAX_FEES_RATIO', targetValue: 0.007 }
    ]
  },
  {
    id: 'chapter_6',
    chapterNumber: 6,
    startYear: 2006,
    endYear: 2010,
    titleKo: '금융위기와 대규모 부양',
    eraNameKo: '2000년대 후반: 유동성 팽창과 서브프라임 부실 우려',
    
    startContext: {
      knownAsOf: '2006년 초',
      descriptionKo: '한국 증시가 1,400p를 돌파하고 글로벌 자산시장이 호황을 누리고 있으나, 미국 부동산 시장의 과열과 서브프라임(비우량) 주택담보대출 부실 조짐이 서서히 포착되고 있습니다. 국제 유가가 70달러를 돌파하며 인플레이션 압력이 높아지고 있습니다.',
      keyObservationVariables: [
        { name: '미국 케이스-실러 주택가격지수', description: '서브프라임 모기지 연체율과 미국 부동산 가격 정점 통과 여부' },
        { name: '글로벌 신용 스프레드 (TED)', description: '은행 간 단기 자금조달 시장의 유동성 및 신용 경색 위험' },
        { name: '국제 유가 (WTI) 및 원자재', description: '신흥국 수요 폭발과 원자재 가격 상승 추이' }
      ]
    },

    retrospective: {
      revealedAfterCompletion: true,
      descriptionKo: '2007년 코스피 2,000p 돌파의 환희 뒤로, 2008년 9월 158년 전통의 리먼 브라더스가 파산하며 대공황 이후 최악의 글로벌 금융위기가 발생했습니다. 미국 연준의 제로금리와 무제한 양적완화(QE), 한·미 통화스왑에 힘입어 2009~2010년 V자 반등에 성공했습니다.',
      majorEvents: [
        { year: 2007, titleKo: '아이폰 발표 및 코스피 2,000p 돌파', summaryKo: '스마트폰 혁명의 서막과 해외 펀드 광풍' },
        { year: 2008, titleKo: '리먼 브라더스 파산과 글로벌 금융위기', summaryKo: '글로벌 신용경색, 코스피 -40.7%, S&P 500 -38.5%' },
        { year: 2008, titleKo: '한·미 300억 달러 통화스왑 체결', summaryKo: '외환시장 안정화 및 금융 안전판 확보' },
        { year: 2009, titleKo: '연준 양적완화(QE) 및 차·화·정 랠리', summaryKo: '글로벌 유동성 공급과 한국 제조업의 강력한 반등' }
      ]
    },

    descriptionKo: '2007년 코스피 2,000을 돌파하며 호황을 누렸으나, 2008년 9월 미국 서브프라임 모기지 부실로 리먼 브라더스가 파산하며 글로벌 금융위기가 발생했습니다.',
    historicalContext: '전 세계 주식시장이 고점 대비 반토막 나는 패닉 속에서도, 위기를 견뎌낸 우량 기업들은 2009~2010년 V자로 반등했습니다.',
    keyObservationVariables: [
      { name: '미국 케이스-실러 주택가격지수', description: '서브프라임 모기지 부실과 미국 주택 가격 급락' },
      { name: 'TED 스프레드 & VIX 지수', description: '글로벌 단기 신용경색과 시장 공포 지수의 폭등' },
      { name: '연준 대차대조표 (양적완화 자산)', description: '역사상 전례 없는 중앙은행의 대규모 유동성 공급' }
    ],

    suggestedGoals: [
      { id: 'goal_c6_crisis', titleKo: '금융위기 속 패닉셀 금지 (원칙 유지)', descriptionKo: '공포에 휩쓸려 최저점에서 투매하지 않고 장기 자산배분을 유지합니다.', targetType: 'REBALANCE_DISCIPLINE', targetValue: 1 },
      { id: 'goal_c6_filings', titleKo: '위기 극복 공시 및 통화스왑 뉴스 확인 (4건 이상)', descriptionKo: '정부 구제금융과 중앙은행 통화스왑 등 핵심 안전장치를 확인합니다.', targetType: 'FILINGS_COUNT', targetValue: 4 },
      { id: 'goal_c6_cap', titleKo: '단일 종목 집중 한도 준수 (최대 30% 이하)', descriptionKo: '아무리 거대한 대마불사 기업이라도 단일 종목 과점 위험을 통제합니다.', targetType: 'MAX_WEIGHT_CAP', targetValue: 30 }
    ],

    suggestedRiskMissions: [
      { id: 'risk_c6_mdd', titleKo: '2008 금융위기 속 MDD -45% 이내 방어', descriptionKo: '반토막 폭락장(-50% 이상) 속에서 포트폴리오 낙폭을 -45% 이내로 방어합니다.', missionType: 'MAX_DRAWDOWN', targetValue: 0.45 },
      { id: 'risk_c6_cap', titleKo: '단일 종목 최대 비중 30% 이하 준수', descriptionKo: '금융/제조 대형주라도 단일 종목 30% 이하 원칙을 지킵니다.', missionType: 'MAX_STOCK_WEIGHT', targetValue: 0.30 },
      { id: 'risk_c6_cash', titleKo: '위기 전후 현금 비중 10% 이상 보유', descriptionKo: '유동성 위기에 대비한 현금 쿠션을 확보합니다.', missionType: 'MIN_CASH_BUFFER', targetValue: 0.10 },
      { id: 'risk_c6_crisis_thesis', titleKo: '2008 리먼 파산 시 위기 대응 가설 기록', descriptionKo: '공포에 굴복하지 않고 객관적 위기 대응 원칙을 기록합니다.', missionType: 'RECORD_CRISIS_THESIS', targetValue: 1 }
    ]
  },
  {
    id: 'chapter_7',
    chapterNumber: 7,
    startYear: 2011,
    endYear: 2015,
    titleKo: '저금리와 모바일 전환',
    eraNameKo: '2010년대 전반: 남유럽 재정위기 우려와 스마트폰 혁명',
    
    startContext: {
      knownAsOf: '2011년 초',
      descriptionKo: '글로벌 금융위기 극복 후 코스피가 사상 최고치를 경신했으나, 그리스·포르투갈 등 남유럽 국가들의 막대한 재정적자와 부채 문제가 수면 위로 떠오르고 있습니다. 동시에 애플 아이폰과 삼성 갤럭시를 필두로 모바일 스마트폰 혁명이 급격히 확산되고 있습니다.',
      keyObservationVariables: [
        { name: '남유럽 국채 금리 스프레드', description: '그리스·이탈리아 등 유로존 국가들의 디폴트 위험' },
        { name: '글로벌 스마트폰 출하량', description: '피처폰에서 스마트폰으로의 모바일 생태계 전환 속도' },
        { name: '미국 국채 10년물 금리', description: '장기 저금리(Low-for-Long) 환경과 기술주 밸류에이션' }
      ]
    },

    retrospective: {
      revealedAfterCompletion: true,
      descriptionKo: '2011년 8월 S&P의 사상 첫 미국 국가신용등급 강등(AAA->AA+)과 남유럽 재정위기로 큰 조정을 겪었으나, 모바일 인터넷 생태계가 폭발했습니다. 한국 증시는 1,800~2,100선의 기나긴 박스피에 갇혔지만 미국 빅테크(FAANG)는 세계 시총 최상위로 도약했습니다.',
      majorEvents: [
        { year: 2011, titleKo: '미국 신용등급 강등 및 유럽 재정위기', summaryKo: 'S&P 사상 첫 미국 등급 강등과 8월 글로벌 증시 폭락' },
        { year: 2012, titleKo: '드라기 총재의 "Whatever it takes"', summaryKo: 'ECB의 유로존 수호 선언으로 유럽 위기 진정' },
        { year: 2013, titleKo: '버냉키 테이퍼 텐트럼(긴축 발작)', summaryKo: '양적완화 축소 시사로 신흥국 통화가치 급락' },
        { year: 2014, titleKo: '국제 유가 대폭락(-50%)', summaryKo: '미국 셰일 혁명과 사우디 치킨게임으로 유가 급락' }
      ]
    },

    descriptionKo: '남유럽 재정위기와 미국의 국가신용등급 강등으로 글로벌 증시가 흔들렸으나, 스마트폰 혁명과 함께 모바일 생태계가 폭발했습니다.',
    historicalContext: '미국 빅테크가 시가총액 상위를 장악하기 시작했고, 저금리 환경 속에서 고성장 기술주 프리미엄이 확대되었습니다.',
    keyObservationVariables: [
      { name: '글로벌 스마트폰 출하량', description: '피처폰에서 스마트폰으로의 모바일 패러다임 전환' },
      { name: '미국 국채 10년물 금리', description: '장기 저금리 환경과 기술주 멀티플 확장' },
      { name: '한국 상장사 영업이익률', description: '박스피 국면에서 제조업 마진과 반도체 쏠림 현상' }
    ],

    suggestedGoals: [
      { id: 'goal_c7_balance', titleKo: '미국 빅테크와 한국 우량주 균형 배분', descriptionKo: '박스피에 갇힌 국내 시장을 넘어 미국 글로벌 혁신주로 포트폴리오를 확장합니다.', targetType: 'ASSET_ALLOCATION', targetValue: 45 },
      { id: 'goal_c7_filings', titleKo: '스마트폰/모바일 신제품 공시 분석 (3건 이상)', descriptionKo: '모바일 생태계 관련 기업들의 특허, 신제품, 분기 실적을 분석합니다.', targetType: 'FILINGS_COUNT', targetValue: 3 },
      { id: 'goal_c7_cost', titleKo: '저변동성 박스권 비용 절약', descriptionKo: '답답한 횡보장에서도 잦은 단타 매매 없이 수수료를 통제합니다.', targetType: 'COST_SAVING', targetValue: 1 }
    ],

    suggestedRiskMissions: [
      { id: 'risk_c7_mdd', titleKo: '최대낙폭(MDD) -20% 이내 통제', descriptionKo: '2011년 미국 등급 강등 충격 속에서도 낙폭을 -20% 이내로 방어합니다.', missionType: 'MAX_DRAWDOWN', targetValue: 0.20 },
      { id: 'risk_c7_cap', titleKo: '단일 종목 최대 비중 35% 이하', descriptionKo: '모바일 승자 독식 종목이라도 비중 35% 이하를 유지합니다.', missionType: 'MAX_STOCK_WEIGHT', targetValue: 0.35 },
      { id: 'risk_c7_sectors', titleKo: '최소 3개 이상 섹터 분산', descriptionKo: '테크, 헬스케어, 소비재 등 포트폴리오를 고르게 분산합니다.', missionType: 'MIN_SECTOR_COUNT', targetValue: 3 },
      { id: 'risk_c7_fees', titleKo: '누적 거래비용 0.5% 이하 절감', descriptionKo: '박스권 잦은 뇌동매매를 방지합니다.', missionType: 'MAX_FEES_RATIO', targetValue: 0.005 }
    ]
  },
  {
    id: 'chapter_8',
    chapterNumber: 8,
    startYear: 2016,
    endYear: 2020,
    titleKo: '무역분쟁과 팬데믹',
    eraNameKo: '2010년대 후반: 보호무역주의 대두와 글로벌 공급망 재편',
    
    startContext: {
      knownAsOf: '2016년 초',
      descriptionKo: '영국의 브렉시트(EU 탈퇴) 논쟁과 미국 대선 등 글로벌 정치적 지형 변화가 시작되고 있습니다. 클라우드와 반도체 수요가 증가하고 있으나, 대형국 간의 무역 갈등 가능성과 연준의 점진적 금리 인상 사이클 재개가 관찰 대상입니다.',
      keyObservationVariables: [
        { name: '미·중 무역 관세 및 통상 마찰', description: '보호무역주의 강화와 글로벌 공급망 교란 위험' },
        { name: '미국 연준 기준금리 인상 속도', description: '양적완화 종료 후 중립금리 도달 여부' },
        { name: '메모리 반도체 서버 수요', description: '클라우드 데이터센터 증설에 따른 반도체 슈퍼사이클' }
      ]
    },

    retrospective: {
      revealedAfterCompletion: true,
      descriptionKo: '2018년 미·중 무역전쟁으로 전 세계 증시가 큰 조정을 받았고, 2020년 초에는 코로나19 팬데믹으로 사상 유례없는 글로벌 셧다운과 폭락을 겪었습니다. 그러나 초유의 제로금리와 재정부양책, 동학개미운동에 힘입어 코스피 3,000을 돌파하는 대반등을 이뤄냈습니다.',
      majorEvents: [
        { year: 2016, titleKo: '브렉시트 가결 및 트럼프 대통령 당선', summaryKo: '보호무역주의와 친기업 감세 정책 기대 교차' },
        { year: 2017, titleKo: '반도체 슈퍼사이클과 코스피 2,500 돌파', summaryKo: '삼성전자·하이닉스 사상 최대 실적 경신' },
        { year: 2018, titleKo: '미·중 무역전쟁 및 4차례 금리인상', summaryKo: '관세 폭탄과 긴축 발작으로 글로벌 증시 하락' },
        { year: 2020, titleKo: '코로나19 팬데믹과 동학개미운동', summaryKo: '3월 서킷브레이커 폭락 후 무제한 유동성으로 역사적 급등' }
      ]
    },

    descriptionKo: '2018년 트럼프 행정부의 미·중 무역전쟁과 2020년 코로나19 팬데믹으로 글로벌 시장은 거대한 충격과 반등을 연이어 통과했습니다.',
    historicalContext: '비대면, 전자상거래, 클라우드, 반도체 슈퍼사이클이 맞물리며 디지털 전환이 급속히 앞당겨졌습니다.',
    keyObservationVariables: [
      { name: '글로벌 코로나19 확진자 및 봉쇄 지수', description: '팬데믹 초기 경제 셧다운과 이후 리오프닝' },
      { name: '미국 M2 통화량 증가율', description: '사상 최대 규모의 재정 부양책과 유동성 팽창' },
      { name: '한국 개인투자자 순매수(동학개미)', description: '사상 최대 규모의 개인 자금 증시 유입' }
    ],

    suggestedGoals: [
      { id: 'goal_c8_crisis', titleKo: '2020년 3월 팬데믹 패닉 극복', descriptionKo: '서킷브레이커가 발동되는 극단적 공포 속에서도 원칙대로 리밸런싱합니다.', targetType: 'REBALANCE_DISCIPLINE', targetValue: 1 },
      { id: 'goal_c8_thesis', titleKo: '팬데믹 구조변화 가설 작성 (3회 이상)', descriptionKo: '언택트와 반도체 공급망 변화에 대한 투자 아이디어를 기록합니다.', targetType: 'THESIS_COUNT', targetValue: 3 },
      { id: 'goal_c8_cap', titleKo: '과열 국면 비중 상한 관리 (최대 30% 이하)', descriptionKo: '초저금리 유동성 파티 속에서도 특정 테마주 과열 위험을 관리합니다.', targetType: 'MAX_WEIGHT_CAP', targetValue: 30 }
    ],

    suggestedRiskMissions: [
      { id: 'risk_c8_mdd', titleKo: '2020 팬데믹 폭락 속 MDD -35% 이내 방어', descriptionKo: '서킷브레이커 폭락 국면에서 포트폴리오 낙폭을 -35% 이내로 통제합니다.', missionType: 'MAX_DRAWDOWN', targetValue: 0.35 },
      { id: 'risk_c8_cap', titleKo: '단일 종목 최대 비중 30% 이하 유지', descriptionKo: '급등 테마주에 뇌동매매 쏠림을 방지합니다.', missionType: 'MAX_STOCK_WEIGHT', targetValue: 0.30 },
      { id: 'risk_c8_cash', titleKo: '위기 구간 현금 비중 10% 이상 보유', descriptionKo: '시장 급변에 대응할 현금 유동성을 확보합니다.', missionType: 'MIN_CASH_BUFFER', targetValue: 0.10 },
      { id: 'risk_c8_crisis_thesis', titleKo: '팬데믹 폭락 시 위기 대응 가설 작성', descriptionKo: '공포 속에서도 합리적인 투자 가설을 기록합니다.', missionType: 'RECORD_CRISIS_THESIS', targetValue: 1 }
    ]
  },
  {
    id: 'chapter_9',
    chapterNumber: 9,
    startYear: 2021,
    endYear: 2025,
    titleKo: '고금리와 생성형 AI',
    eraNameKo: '2020년대 전반: 유동성 파티 종료와 새로운 AI 패러다임',
    
    startContext: {
      knownAsOf: '2021년 초',
      descriptionKo: '코스피 3,000 돌파와 글로벌 자산시장 활황이 이어지는 가운데, 글로벌 공급망 병목과 원자재 가격 상승으로 인플레이션 압력이 서서히 고개를 들고 있습니다. 백신 보급과 함께 중앙은행의 통화정책 정상화(테이퍼링 및 금리 인상) 일정이 핵심 변수로 부상하고 있습니다.',
      keyObservationVariables: [
        { name: '미국 소비자물가지수 (CPI)', description: '40년 만의 인플레이션 부활 및 지속 기간' },
        { name: '연준 기준금리 인상 속도', description: '물가 억제를 위한 긴축 강도와 경기 침체 위험' },
        { name: '빅테크 Capex 및 혁신 기술', description: '인플레이션 둔화 이후 새로운 성장 동력 출현 여부' }
      ]
    },

    retrospective: {
      revealedAfterCompletion: true,
      descriptionKo: '2022년 러시아-우크라이나 전쟁과 40년 만의 최고 인플레이션(미국 CPI 9.1%)으로 연준이 4연속 자이언트 스텝(0.75%p 인상)을 밟으며 주식과 채권이 동반 폭락했습니다. 그러나 2023년 ChatGPT가 촉발한 생성형 AI 붐과 엔비디아의 폭발적 성장으로 글로벌 기술주가 역사적 신고가를 경신하며 45년 대장정을 완성했습니다.',
      majorEvents: [
        { year: 2021, titleKo: '코스피 3,300p 사상 최고치 경신', summaryKo: '유동성 장세의 정점과 인플레이션 조짐' },
        { year: 2022, titleKo: '러-우 전쟁과 연준 4연속 자이언트 스텝', summaryKo: '미국 CPI 9.1% 폭등과 기술주 혹독한 조정' },
        { year: 2023, titleKo: '생성형 AI 혁명(ChatGPT)과 엔비디아 랠리', summaryKo: 'AI 반도체 수요 폭발과 S&P 500 반등' },
        { year: 2024, titleKo: '연준 금리인하 피벗(0.50%p 빅컷)', summaryKo: '글로벌 완화 사이클 복귀와 45년 완주' }
      ]
    },

    descriptionKo: '팬데믹 이후 인플레이션과 초고속 금리 인상을 거쳐 생성형 AI 혁명으로 이어지는 2020년대 전반기의 거대한 시장 전환기입니다.',
    historicalContext: '고금리 압박 속에서도 AI 인프라 투자와 HBM 반도체 사이클이 시장을 주도했습니다.',
    keyObservationVariables: [
      { name: '미국 소비자물가지수 (CPI)', description: '40년 만의 인플레이션 정점 및 둔화 추이' },
      { name: '연준 기준금리 (5.25~5.50%)', description: '초고속 긴축과 글로벌 유동성 축소 충격' },
      { name: 'AI 데이터센터 GPU/HBM 수요', description: '생성형 AI 생태계 구축을 위한 빅테크 Capex 경쟁' }
    ],

    suggestedGoals: [
      { id: 'goal_c9_discipline', titleKo: '45년 완주 및 원칙 준수', descriptionKo: '고금리와 AI 격변기를 지나 45년간의 대장정을 성공적으로 완주합니다.', targetType: 'REBALANCE_DISCIPLINE', targetValue: 1 },
      { id: 'goal_c9_filings', titleKo: '생성형 AI 및 차세대 반도체 공시 점검 (4건 이상)', descriptionKo: 'HBM, AI 가속기 등 최신 기업들의 공시와 재무 상태를 확인합니다.', targetType: 'FILINGS_COUNT', targetValue: 4 },
      { id: 'goal_c9_balance', titleKo: '최종 포트폴리오 자산배분 안정화', descriptionKo: '주식과 현금의 최적 균형을 유지하며 45년 투자 실험실을 마무리합니다.', targetType: 'ASSET_ALLOCATION', targetValue: 40 }
    ],

    suggestedRiskMissions: [
      { id: 'risk_c9_mdd', titleKo: '2022 긴축 충격 속 MDD -25% 이내 방어', descriptionKo: '금리 급등과 기술주 조정 국면에서 낙폭을 -25% 이내로 통제합니다.', missionType: 'MAX_DRAWDOWN', targetValue: 0.25 },
      { id: 'risk_c9_cap', titleKo: '단일 종목 최대 비중 30% 이하 유지', descriptionKo: 'AI 테마 쏠림 속에서도 단일 종목 집중도를 30% 이하로 관리합니다.', missionType: 'MAX_STOCK_WEIGHT', targetValue: 0.30 },
      { id: 'risk_c9_sectors', titleKo: '최소 3개 이상 섹터 유지', descriptionKo: '반도체 외 금융, 헬스케어, 소비재에 분산합니다.', missionType: 'MIN_SECTOR_COUNT', targetValue: 3 },
      { id: 'risk_c9_crisis_thesis', titleKo: '2022 고금리 위기 시 투자 가설 기록', descriptionKo: '자산시장 재조정 국면에서 가설을 남깁니다.', missionType: 'RECORD_CRISIS_THESIS', targetValue: 1 }
    ]
  }
];

export function getChapterById(id: string): HistoricalChapter | undefined {
  return HISTORICAL_CHAPTERS.find(c => c.id === id);
}

export function getChapterByYear(year: number): HistoricalChapter | undefined {
  return HISTORICAL_CHAPTERS.find(c => year >= c.startYear && year <= c.endYear);
}
