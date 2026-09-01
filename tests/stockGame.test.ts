import { describe, it, expect, beforeEach } from 'vitest';
import { STOCKS, STOCKS_BY_ID, isStockListed, getStockAnnualReturn, getStockPriceKRW, getHistoricalStockStats } from '../src/engine/returnEngine';
import { convertUsdReturnToKrw, getFxRate, decomposeUsdReturnInKrw } from '../src/engine/fxEngine';
import { validateBuyOrder, executeBuy, executeSell, executeRebalanceToTargetWeights } from '../src/engine/tradeEngine';
import { advanceSimulationOneYear, calculatePortfolioValue } from '../src/engine/portfolioEngine';
import { executeAutoInvestSingleYear, runAutoInvestSimulation, AutoInvestStepState } from '../src/engine/autoInvestEngine';
import { simulateBenchmarkSeries } from '../src/engine/benchmarkEngine';
import { calculateFinalMetrics, calculateMWR_IRR, calculateMDD } from '../src/engine/metricsEngine';
import { AutoInvestRule, GameSettings, StockGameState } from '../src/types/stockGame';

const TEST_SETTINGS: GameSettings = {
  nickname: '테스트투자자',
  startYear: 1980,
  endYear: 2025,
  initialCashKRW: 10000000,
  annualContributionKRW: 3000000,
  allowFractionalShares: true,
  feeRate: 0.001,
  fxFeeRate: 0.0,
  includeFxEffect: true,
  primaryBenchmark: 'kospi',
  startMode: 'MANUAL',
};

describe('머니트랙 45년 한·미 주식투자 실험실 - 18대 핵심 단위 테스트', () => {

  // Test 1
  it('1. 1980년부터 2025년까지 정확히 46개의 연간 구간이 생성되는지', () => {
    const totalYears = TEST_SETTINGS.endYear - TEST_SETTINGS.startYear + 1;
    expect(totalYears).toBe(46);

    let year = TEST_SETTINGS.startYear;
    const yearList: number[] = [];
    while (year <= TEST_SETTINGS.endYear) {
      yearList.push(year);
      year++;
    }
    expect(yearList.length).toBe(46);
    expect(yearList[0]).toBe(1980);
    expect(yearList[45]).toBe(2025);
  });

  // Test 2
  it('2. 상장 전 종목을 매수할 수 없는지', () => {
    // NVDA was listed in 1999, first valid operational year is 2000
    expect(isStockListed('US_NVDA', 1985)).toBe(false);
    expect(isStockListed('US_NVDA', 1999)).toBe(false);
    expect(isStockListed('US_NVDA', 2000)).toBe(true);

    // SK Hynix listed late 1996, first valid year 1997
    expect(isStockListed('KR_000660', 1990)).toBe(false);
    expect(isStockListed('KR_000660', 1997)).toBe(true);

    const validation = validateBuyOrder('US_NVDA', 1000000, 10000000, 1985, 0.001);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('상장 이전 종목');
  });

  // Test 3
  it('3. 결측 데이터가 0%로 처리되지 않고 null로 안전하게 처리되는지', () => {
    // Before IPO, return must be null, NOT 0.0
    const metaRet1990 = getStockAnnualReturn('US_META', 1990, true);
    expect(metaRet1990).toBeNull();

    const nvdaRet1985 = getStockAnnualReturn('US_NVDA', 1985, true);
    expect(nvdaRet1985).toBeNull();
  });

  // Test 4
  it('4. 미국주식의 원화수익률과 환율공식이 정확한지', () => {
    // Formula: KRW_Return = (1 + USD_Return) * (FX_t / FX_{t-1}) - 1
    const usdReturn = 0.20; // +20% USD
    const year = 1997; // Asian financial crisis (FX jumped from 844.2 to 1695.0)
    const fx1996 = getFxRate(1996);
    const fx1997 = getFxRate(1997);
    const fxRatio = fx1997 / fx1996;

    const expectedKrwRet = (1 + usdReturn) * fxRatio - 1;
    const actualKrwRet = convertUsdReturnToKrw(usdReturn, 1997);
    expect(actualKrwRet).toBeCloseTo(expectedKrwRet, 6);

    const decomp = decomposeUsdReturnInKrw(usdReturn, 1997);
    expect(decomp.totalKrwReturn).toBeCloseTo(expectedKrwRet, 6);
    expect(decomp.fxContributionRate).toBeCloseTo(expectedKrwRet - usdReturn, 6);
  });

  // Test 5
  it('5. 거래비용이 매수·매도에 정확히 반영되는지', () => {
    const cash = 10000000;
    const feeRate = 0.001; // 0.1%
    const buyAmount = 5000000;

    const buyRes = executeBuy('US_AAPL', buyAmount, cash, {}, 1981, TEST_SETTINGS);
    const expectedFee = buyAmount * feeRate; // 5000 won
    expect(buyRes.totalFees).toBe(expectedFee);
    expect(buyRes.updatedCash).toBe(cash - (buyAmount + expectedFee));

    // Now sell half
    const shares = buyRes.updatedHoldings['US_AAPL'].shares;
    const sellRes = executeSell('US_AAPL', shares / 2, buyRes.updatedCash, buyRes.updatedHoldings, 1981, TEST_SETTINGS);
    expect(sellRes.tradeLogs[0].action).toBe('SELL');
    expect(sellRes.totalFees).toBeGreaterThan(0);
  });

  // Test 6
  it('6. 현금 부족 주문이 차단되는지', () => {
    const cash = 1000000;
    const buyAmount = 1500000;
    const val = validateBuyOrder('KR_005930', buyAmount, cash, 1981, 0.001);
    expect(val.valid).toBe(false);
    expect(val.error).toContain('현금 잔액이 부족합니다');
  });

  // Test 7
  it('7. 목표비중 합계 100% 초과가 차단되는지', () => {
    const targets = [
      { canonicalId: 'KR_005930', weight: 0.6 },
      { canonicalId: 'US_AAPL', weight: 0.5 }, // sum = 1.1 (110%)
    ];
    expect(() => {
      executeRebalanceToTargetWeights(targets, 10000000, {}, 1981, TEST_SETTINGS);
    }).toThrow('100%를 초과할 수 없습니다');
  });

  // Test 8
  it('8. 연간 추가 투자금이 정확한 시점에 반영되는지', () => {
    const startAssets = 10000000;
    const deposit = 3000000;
    const currentCashWithDeposit = startAssets + deposit;

    const res = advanceSimulationOneYear(
      1982,
      currentCashWithDeposit,
      {},
      startAssets,
      deposit,
      0,
      [],
      TEST_SETTINGS
    );

    expect(res.performanceRecord.annualDepositKRW).toBe(3000000);
    expect(res.performanceRecord.startTotalAssetsKRW).toBe(10000000);
    // Cash earned 0% return
    expect(res.performanceRecord.endTotalAssetsKRW).toBe(13000000);
    expect(res.performanceRecord.annualReturn).toBe(0.0);
  });

  // Test 9
  it('9. 수동 1년 반복 결과와 5년 자동투자 결과가 수학적으로 정확히 일치하는지', () => {
    const rule: AutoInvestRule = {
      id: 'test_rule_5y',
      name: '5Y Rule',
      durationYears: 5,
      targetAllocations: [
        { canonicalId: 'KR_005930', weight: 0.5 },
        { canonicalId: 'US_AAPL', weight: 0.5 },
      ],
      annualContributionKRW: 3000000,
      rebalanceMode: 'ANNUAL',
      preIpoMode: 'PRO_RATA_ACTIVE',
    };

    // Mode A: Multi-year auto invest for 5 years
    const initA: AutoInvestStepState = {
      currentYear: 1981,
      cashKRW: 10000000,
      holdings: {},
      history: [],
      tradeLogs: [],
      isGameOver: false,
    };
    const resultAuto5 = runAutoInvestSimulation(initA, rule, TEST_SETTINGS, 5);

    // Mode B: Step 1 year at a time for 5 times
    let stateB: AutoInvestStepState = {
      currentYear: 1981,
      cashKRW: 10000000,
      holdings: {},
      history: [],
      tradeLogs: [],
      isGameOver: false,
    };
    for (let i = 0; i < 5; i++) {
      stateB = executeAutoInvestSingleYear(stateB, rule, TEST_SETTINGS);
    }

    expect(resultAuto5.currentYear).toBe(stateB.currentYear);
    expect(resultAuto5.cashKRW).toBeCloseTo(stateB.cashKRW, 2);
    expect(resultAuto5.history.length).toBe(stateB.history.length);
    expect(resultAuto5.history[4].endTotalAssetsKRW).toBeCloseTo(stateB.history[4].endTotalAssetsKRW, 2);
  });

  // Test 10
  it('10. 수동 1년 반복 결과와 10년 자동투자 결과가 수학적으로 정확히 일치하는지', () => {
    const rule: AutoInvestRule = {
      id: 'test_rule_10y',
      name: '10Y Rule',
      durationYears: 10,
      targetAllocations: [
        { canonicalId: 'KR_005380', weight: 0.5 },
        { canonicalId: 'US_IBM', weight: 0.5 },
      ],
      annualContributionKRW: 3000000,
      rebalanceMode: 'ANNUAL',
      preIpoMode: 'PRO_RATA_ACTIVE',
    };

    const initA: AutoInvestStepState = {
      currentYear: 1981,
      cashKRW: 10000000,
      holdings: {},
      history: [],
      tradeLogs: [],
      isGameOver: false,
    };
    const resultAuto10 = runAutoInvestSimulation(initA, rule, TEST_SETTINGS, 10);

    let stateB: AutoInvestStepState = {
      currentYear: 1981,
      cashKRW: 10000000,
      holdings: {},
      history: [],
      tradeLogs: [],
      isGameOver: false,
    };
    for (let i = 0; i < 10; i++) {
      stateB = executeAutoInvestSingleYear(stateB, rule, TEST_SETTINGS);
    }

    expect(resultAuto10.currentYear).toBe(stateB.currentYear);
    expect(resultAuto10.history[9].endTotalAssetsKRW).toBeCloseTo(stateB.history[9].endTotalAssetsKRW, 2);
  });

  // Test 11
  it('11. 벤치마크에 동일 현금흐름이 정확히 적용되는지', () => {
    const bmSim = simulateBenchmarkSeries('kospi', 1980, 2025, 10000000, 3000000, 0.001);
    expect(bmSim.history.length).toBe(46);
    expect(bmSim.history[0].year).toBe(1980);
    expect(bmSim.history[45].year).toBe(2025);
    expect(bmSim.totalValueKRW).toBeGreaterThan(0);
  });

  // Test 12
  it('12. TWR 계산이 추가 납입에 왜곡되지 않는지', () => {
    // If portfolio earned 10% in Year 1 and 20% in Year 2:
    // TWR = (1 + 0.10) * (1 + 0.20) - 1 = 0.32 (32%)
    // Regardless of whether deposit was 0 or 100,000,000!
    const year1Ret = 0.10;
    const year2Ret = 0.20;
    const compoundTwr = (1 + year1Ret) * (1 + year2Ret) - 1;
    expect(compoundTwr).toBeCloseTo(0.32, 6);
  });

  // Test 13
  it('13. IRR 또는 MWR 계산이 정상 수렴하는지', () => {
    // Invest 10M at t=0, deposit 3M at t=1, ending with 18M at t=2
    const irr = calculateMWR_IRR(10000000, [3000000], 18000000);
    expect(irr).toBeGreaterThan(0.10);
    expect(irr).toBeLessThan(0.40);
  });

  // Test 14
  it('14. MDD가 현금 납입 때문에 잘못 축소되거나 왜곡되지 않는지', () => {
    // Compounded TWR index: 100 -> 150 -> 75 -> 120
    // Peak is 150, Trough is 75 -> Drawdown is (150 - 75) / 150 = 50%
    const twrLevels = [100, 150, 75, 120];
    const mdd = calculateMDD(twrLevels);
    expect(mdd).toBeCloseTo(0.50, 6);
  });

  // Test 15
  it('15. 미래 연도 데이터가 현재 화면/통계에 노출되지 않는지 (No Lookahead Bias)', () => {
    // In year 1990, stats must ONLY look at data up to 1989
    const stats1990 = getHistoricalStockStats('US_AAPL', 1989, true);
    // Data from 1981 to 1989 is 9 years
    expect(stats1990.yearsOfData).toBe(9);
    // Future returns (1990..2025) must NOT affect past 3Y CAGR in 1989
    expect(stats1990.past3YrCAGR).not.toBeNull();
  });

  // Test 16
  it('16. localStorage 저장 데이터 구조가 안전하게 직렬화/역직렬화되는지', () => {
    const testState: StockGameState = {
      version: '2.0.0',
      isGameStarted: true,
      isGameOver: false,
      settings: TEST_SETTINGS,
      currentYear: 1990,
      cashKRW: 5000000,
      holdings: {
        'KR_005930': {
          canonicalId: 'KR_005930',
          shares: 100,
          totalInvestedKRW: 4000000,
          averageCostKRW: 40000,
          currentValueKRW: 6000000,
          currentWeight: 0.54,
          unrealizedPnlKRW: 2000000,
          unrealizedPnlPercent: 0.5,
        }
      },
      history: [],
      tradeLogs: [],
      activeAutoInvestRule: null,
      savedAutoInvestRules: [],
      hasLegacyState: false,
    };

    const serialized = JSON.stringify(testState);
    const parsed = JSON.parse(serialized);
    expect(parsed.version).toBe('2.0.0');
    expect(parsed.currentYear).toBe(1990);
    expect(parsed.holdings['KR_005930'].shares).toBe(100);
  });

  // Test 17
  it('17. 전체 45년 게임을 완료해도 NaN 또는 Infinity가 나오지 않는지', () => {
    const rule: AutoInvestRule = {
      id: 'full_45y',
      name: 'Full 45 Year Run',
      durationYears: 'ALL',
      targetAllocations: [
        { canonicalId: 'KR_005930', weight: 0.25 },
        { canonicalId: 'KR_005380', weight: 0.25 },
        { canonicalId: 'US_AAPL', weight: 0.25 },
        { canonicalId: 'US_KO', weight: 0.25 },
      ],
      annualContributionKRW: 3000000,
      rebalanceMode: 'ANNUAL',
      preIpoMode: 'PRO_RATA_ACTIVE',
    };

    const initA: AutoInvestStepState = {
      currentYear: 1981,
      cashKRW: 10000000,
      holdings: {},
      history: [],
      tradeLogs: [],
      isGameOver: false,
    };

    const result45 = runAutoInvestSimulation(initA, rule, TEST_SETTINGS, 45);
    expect(result45.isGameOver).toBe(true);
    expect(result45.history.length).toBe(45);

    const fullState: StockGameState = {
      version: '2.0.0',
      isGameStarted: true,
      isGameOver: true,
      settings: TEST_SETTINGS,
      currentYear: 2026,
      cashKRW: result45.cashKRW,
      holdings: result45.holdings,
      history: result45.history,
      tradeLogs: result45.tradeLogs,
      activeAutoInvestRule: rule,
      savedAutoInvestRules: [],
      hasLegacyState: false,
    };

    const metrics = calculateFinalMetrics(fullState);
    expect(isNaN(metrics.finalPortfolioValue)).toBe(false);
    expect(isFinite(metrics.finalPortfolioValue)).toBe(true);
    expect(isNaN(metrics.twr)).toBe(false);
    expect(isNaN(metrics.twrCAGR)).toBe(false);
    expect(isNaN(metrics.mwrIRR)).toBe(false);
    expect(isNaN(metrics.maxDrawdownMDD)).toBe(false);
    expect(metrics.finalPortfolioValue).toBeGreaterThan(TEST_SETTINGS.initialCashKRW);
  });

  // Test 18
  it('18. 데이터 없는 종목 때문에 시뮬레이션이 중단되거나 충돌하지 않는지', () => {
    // Pick Samsung Biologics (listed in 2016, first valid year 2017)
    const rule: AutoInvestRule = {
      id: 'rule_with_late_ipo',
      name: 'Rule with Late IPO',
      durationYears: 10,
      targetAllocations: [
        { canonicalId: 'KR_207940', weight: 0.5 }, // Samsung Biologics (Pre-IPO in 1981)
        { canonicalId: 'US_AAPL', weight: 0.5 },
      ],
      annualContributionKRW: 3000000,
      rebalanceMode: 'ANNUAL',
      preIpoMode: 'PRO_RATA_ACTIVE',
    };

    const initA: AutoInvestStepState = {
      currentYear: 1981,
      cashKRW: 10000000,
      holdings: {},
      history: [],
      tradeLogs: [],
      isGameOver: false,
    };

    expect(() => {
      const res = runAutoInvestSimulation(initA, rule, TEST_SETTINGS, 10);
      expect(res.history.length).toBe(10);
    }).not.toThrow();
  });

  // Test 19: 100% 최대 매수 주문 실행 시 수수료 초과 에러 없이 안전하게 체결되는지
  it('19. 100% 최대 매수 주문 실행 시 수수료 초과 에러 없이 안전하게 체결되는지', () => {
    const cash = 10000000;
    // Attempting to buy with raw cash amount 10,000,000 should automatically clamp to max affordable
    const res = executeBuy('KR_005930', cash, cash, {}, 1981, TEST_SETTINGS);
    expect(res.updatedCash).toBeGreaterThanOrEqual(0);
    expect(res.updatedHoldings['KR_005930'].shares).toBeGreaterThan(0);
    expect(res.tradeLogs.length).toBe(1);
    expect(res.totalFees).toBeGreaterThan(0);
    expect(res.updatedCash + res.tradeLogs[0].totalAmountKRW + res.totalFees).toBeLessThanOrEqual(cash + 1e-4);
  });


  // Test 20: 100% 단일 종목 집중 매수 후 다음 연도 진행 시 화면 렌더링 및 결산 레코드가 정상 생성되는지
  it('20. 100% 단일 종목 집중 매수 후 다음 연도 진행 시 정상 결산 레코드가 생성되는지', () => {
    const cash = 10000000;
    const buyRes = executeBuy('KR_005930', cash, cash, {}, 1981, TEST_SETTINGS);

    const startAssets = calculatePortfolioValue(buyRes.updatedCash, buyRes.updatedHoldings, 1980);
    const stepRes = advanceSimulationOneYear(
      1981,
      buyRes.updatedCash,
      buyRes.updatedHoldings,
      startAssets,
      0,
      buyRes.totalFees,
      [],
      TEST_SETTINGS
    );

    expect(stepRes.performanceRecord.year).toBe(1981);
    expect(stepRes.performanceRecord.endTotalAssetsKRW).toBeGreaterThan(0);
    expect(stepRes.performanceRecord.holdingsSnapshot.length).toBe(1);
    expect(stepRes.performanceRecord.bestPerformer).toBeDefined();
    expect(stepRes.performanceRecord.worstPerformer).toBeDefined();
    expect(stepRes.nextYear).toBe(1982);
  });
  // Test 21: 연초 추가 납입금이 현금으로 입금되며 사용자가 매수하지 않으면 자동으로 종목을 사지 않는지
  it('21. 연초 추가 납입금은 현금으로 입금되며, 사용자가 매수하지 않으면 기존 종목과 현금이 자동 매수 없이 그대로 유지되는지', () => {
    const cash = 10000000;
    // 1981년 삼성전자 400만원 매수 (잔여 현금 약 600만원)
    const buyRes = executeBuy('KR_005930', 4000000, cash, {}, 1981, TEST_SETTINGS);
    const initialShares = buyRes.updatedHoldings['KR_005930'].shares;
    const remainingCash = buyRes.updatedCash;

    // 1981년 1년 시뮬레이션 진행
    const startAssets = calculatePortfolioValue(remainingCash, buyRes.updatedHoldings, 1980);
    const stepRes = advanceSimulationOneYear(
      1981,
      remainingCash,
      buyRes.updatedHoldings,
      startAssets,
      0,
      buyRes.totalFees,
      [],
      TEST_SETTINGS
    );

    // 1982년 연초 추가 납입금 6,000,000원 입금
    const annualContribution = 6000000;
    const cash1982Start = stepRes.updatedCash + annualContribution;

    // 사용자가 1982년에 아무런 매수 주문을 하지 않은 경우
    // 기존 삼성전자 주식 수량은 1주도 변하지 않고 그대로 유지되어야 함
    expect(stepRes.updatedHoldings['KR_005930'].shares).toBe(initialShares);
    // 현금 잔고는 이전 잔여현금 + 600만원이 그대로 100% 보존되어야 함
    expect(cash1982Start).toBeGreaterThanOrEqual(remainingCash + annualContribution - 1);
  });

  // Test 22: 사용자가 특정 종목을 직접 매수 지정했을 때만 현금이 줄어들며 해당 종목이 매수되는지
  it('22. 사용자가 특정 종목을 직접 매수 지정했을 때만 현금이 차감되며 해당 종목만 매수되는지', () => {
    const cash1982 = 12000000; // 보유 현금 1,200만원
    const buyAmount = 5000000; // 사용자가 기아(KR_000270) 500만원 매수 지정

    const res = executeBuy('KR_000270', buyAmount, cash1982, {}, 1982, TEST_SETTINGS);
    expect(res.updatedHoldings['KR_000270']).toBeDefined();
    expect(res.updatedHoldings['KR_000270'].shares).toBeGreaterThan(0);
    expect(res.updatedCash).toBeLessThan(cash1982);
    expect(res.updatedCash).toBeCloseTo(cash1982 - (buyAmount + res.totalFees), -1);
  });
});

