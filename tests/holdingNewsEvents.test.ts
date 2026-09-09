import { describe, it, expect } from 'vitest';
import {
  HISTORICAL_NEWS,
  getHoldingCompanyEventsForYear,
  getAvailableNewsForYear,
  getYearRetrospectiveNews,
} from '../src/engine/newsEngine';

describe('보유 종목 개별 사건(Individual Company Events) & 팝업 시스템 검증 테스트', () => {

  it('1. 2017년 삼성전자(KR_005930) 보유 시 이재용 부회장 구속 & 반도체 슈퍼사이클 이벤트가 정상 반환되어야 함', () => {
    const events = getHoldingCompanyEventsForYear(2017, ['KR_005930']);
    expect(events.length).toBeGreaterThanOrEqual(1);

    const leeEvent = events.find(e => e.titleKo.includes('이재용') || e.summaryKo.includes('이재용'));
    expect(leeEvent).toBeDefined();
    expect(leeEvent?.canonicalCompanyIds).toContain('KR_005930');
    expect(leeEvent?.publishedAt.startsWith('2017')).toBe(true);
    expect(leeEvent?.neutralAnalysis).toBeDefined();
    expect(leeEvent?.neutralAnalysis.verifiedFacts).toBeTruthy();
    expect(leeEvent?.neutralAnalysis.positiveInterpretation).toBeTruthy();
    expect(leeEvent?.neutralAnalysis.negativeInterpretation).toBeTruthy();
  });

  it('2. 2023년 엔비디아(US_NVDA) 보유 시 H100 AI 가속기 및 시가총액 1조달러 돌파 이벤트가 정상 반환되어야 함', () => {
    const events = getHoldingCompanyEventsForYear(2023, ['US_NVDA']);
    expect(events.length).toBeGreaterThanOrEqual(1);

    const nvdaEvent = events.find(e => e.titleKo.includes('H100') || e.summaryKo.includes('생성형 AI'));
    expect(nvdaEvent).toBeDefined();
    expect(nvdaEvent?.canonicalCompanyIds).toContain('US_NVDA');
    expect(nvdaEvent?.publishedAt.startsWith('2023')).toBe(true);
  });

  it('3. 2024년 엔비디아(US_NVDA) 보유 시 블랙웰(Blackwell B200) 및 전 세계 시총 1위 이벤트가 정상 반환되어야 함', () => {
    const events = getHoldingCompanyEventsForYear(2024, ['US_NVDA']);
    expect(events.length).toBeGreaterThanOrEqual(1);

    const b200Event = events.find(e => e.titleKo.includes('블랙웰') || e.titleKo.includes('Blackwell') || e.summaryKo.includes('B200'));
    expect(b200Event).toBeDefined();
    expect(b200Event?.canonicalCompanyIds).toContain('US_NVDA');
  });

  it('4. 2007년 애플(US_AAPL) 보유 시 스티브 잡스 아이폰(iPhone) 최초 공개 이벤트가 정상 반환되어야 함', () => {
    const events = getHoldingCompanyEventsForYear(2007, ['US_AAPL']);
    expect(events.length).toBeGreaterThanOrEqual(1);

    const iphoneEvent = events.find(e => e.titleKo.includes('아이폰') || e.titleKo.includes('iPhone'));
    expect(iphoneEvent).toBeDefined();
    expect(iphoneEvent?.canonicalCompanyIds).toContain('US_AAPL');
  });

  it('5. 1999년 엔비디아(US_NVDA) 보유 시 세계 최초 GPU GeForce 256 출시 이벤트가 정상 반환되어야 함', () => {
    const events = getHoldingCompanyEventsForYear(1999, ['US_NVDA']);
    expect(events.length).toBeGreaterThanOrEqual(1);

    const geforceEvent = events.find(e => e.titleKo.includes('GeForce') || e.titleKo.includes('GPU'));
    expect(geforceEvent).toBeDefined();
    expect(geforceEvent?.canonicalCompanyIds).toContain('US_NVDA');
  });

  it('6. 2023년 SK하이닉스(KR_000660) 보유 시 HBM3E 독점 공급 이벤트가 정상 반환되어야 함', () => {
    const events = getHoldingCompanyEventsForYear(2023, ['KR_000660']);
    expect(events.length).toBeGreaterThanOrEqual(1);

    const hbmEvent = events.find(e => e.titleKo.includes('HBM') || e.summaryKo.includes('HBM'));
    expect(hbmEvent).toBeDefined();
    expect(hbmEvent?.canonicalCompanyIds).toContain('KR_000660');
  });

  it('7. 미보유 종목에 대한 이벤트는 필터링되어 반환되지 않아야 함 (엄격한 보유자 타겟팅)', () => {
    // 2023년에 현대차(KR_005380)만 보유하고 엔비디아는 보유하지 않은 경우
    const events = getHoldingCompanyEventsForYear(2023, ['KR_005380']);
    const nvdaEvents = events.filter(e => e.canonicalCompanyIds.includes('US_NVDA'));
    expect(nvdaEvents.length).toBe(0);
  });

  it('8. 복수 종목(삼성전자 + 애플) 동시 보유 시 당해 연도 양사 이벤트가 모두 취합되어야 함', () => {
    // 2010년: 삼성전자 갤럭시S 출시 + 애플 아이패드 출시
    const events2010 = getHoldingCompanyEventsForYear(2010, ['KR_005930', 'US_AAPL']);
    expect(events2010.length).toBeGreaterThanOrEqual(2);

    const hasSamsung = events2010.some(e => e.canonicalCompanyIds.includes('KR_005930'));
    const hasApple = events2010.some(e => e.canonicalCompanyIds.includes('US_AAPL'));
    expect(hasSamsung).toBe(true);
    expect(hasApple).toBe(true);
  });

  it('9. 당해 연도 이외의 사건은 엄격히 배제되어야 함 (시간적 경계성)', () => {
    // 2017년 삼성전자 조회 시 2016년 갤럭시 노트7 리콜이나 2023년 감산 뉴스가 섞이지 않아야 함
    const events2017 = getHoldingCompanyEventsForYear(2017, ['KR_005930']);
    for (const ev of events2017) {
      expect(ev.publishedAt.startsWith('2017')).toBe(true);
    }
  });

  it('10. 보유 종목이 빈 배열이거나 매칭 이벤트가 없을 경우 빈 배열을 안전하게 반환해야 함', () => {
    expect(getHoldingCompanyEventsForYear(2020, [])).toEqual([]);
    expect(getHoldingCompanyEventsForYear(1980, ['NON_EXISTING_STOCK'])).toEqual([]);
  });

  it('11. 모든 개별 종목 이벤트는 3방향 중립 분석 데이터(neutralAnalysis)를 완전하게 갖추어야 함', () => {
    const companyEvents = HISTORICAL_NEWS.filter(n => n.scope === 'COMPANY' && n.canonicalCompanyIds.length > 0);
    expect(companyEvents.length).toBeGreaterThanOrEqual(30);

    for (const ev of companyEvents) {
      expect(ev.neutralAnalysis).toBeDefined();
      expect(ev.neutralAnalysis.verifiedFacts.length).toBeGreaterThan(5);
      expect(ev.neutralAnalysis.positiveInterpretation.length).toBeGreaterThan(5);
      expect(ev.neutralAnalysis.negativeInterpretation.length).toBeGreaterThan(5);
    }
  });
});
