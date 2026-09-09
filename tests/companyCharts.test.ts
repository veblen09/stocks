import { describe, it, expect } from 'vitest';
import {
  getCompanyHistoricalPriceSeries,
  getCompanyMonthlyReplaySeries,
  getCompanyNaverChartData,
  getCompany1YrSparkline,
} from '../src/engine/companyChartEngine';
import { STOCKS_BY_ID } from '../src/engine/returnEngine';

describe('Individual Company Price Charts Engine Tests', () => {
  describe('1. Historical Price Series (Decision Phase)', () => {
    it('should generate historical price points strictly up to upToYear with zero future leak', () => {
      const upToYear = 2005;
      const series = getCompanyHistoricalPriceSeries('KR_005930', upToYear, 'ANNUAL');

      expect(series).not.toBeNull();
      expect(series?.canonicalId).toBe('KR_005930');
      expect(series?.upToYear).toBe(upToYear);
      expect(series?.points.length).toBeGreaterThan(0);

      // Verify no points past upToYear
      series?.points.forEach(p => {
        expect(p.year).toBeLessThanOrEqual(upToYear);
        expect(p.priceLocal).toBeGreaterThan(0);
        expect(p.priceKRW).toBeGreaterThan(0);
        expect(Number.isFinite(p.priceKRW)).toBe(true);
      });

      // Verify chronological order
      for (let i = 1; i < (series?.points.length || 0); i++) {
        expect(series!.points[i].year).toBeGreaterThan(series!.points[i - 1].year);
      }
    });




    it('should correctly identify all-time highs and calculate drawdowns', () => {
      const series = getCompanyHistoricalPriceSeries('KR_005930', 2010, 'ANNUAL');
      expect(series).not.toBeNull();

      let ath = 0;
      series?.points.forEach(p => {
        if (p.priceLocal > ath) {
          ath = p.priceLocal;
          expect(p.isAllTimeHigh).toBe(true);
          expect(p.drawdownFromPeak).toBe(0);
        } else {
          expect(p.drawdownFromPeak).toBeLessThanOrEqual(0);
        }
      });

      expect(series?.allTimeHighLocal).toBe(ath);
      expect(series?.allTimeLowLocal).toBeGreaterThan(0);
    });

    it('should handle US stocks and calculate both local USD and converted KRW prices', () => {
      const series = getCompanyHistoricalPriceSeries('US_AAPL', 2015, 'ANNUAL');
      expect(series).not.toBeNull();
      expect(series?.market).toBe('US');
      expect(series?.currency).toBe('USD');

      series?.points.forEach(p => {
        expect(p.priceLocal).toBeGreaterThan(0); // in USD
        expect(p.priceKRW).toBeGreaterThan(p.priceLocal); // in KRW (due to FX rate > 1)
      });
    });

    it('should return valid statistics (CAGR, MDD, Volatility) without NaN', () => {
      const series = getCompanyHistoricalPriceSeries('KR_000660', 2020, 'ANNUAL');
      expect(series).not.toBeNull();

      if (series?.stats) {
        if (series.stats.past3YrCAGR !== null) {
          expect(Number.isFinite(series.stats.past3YrCAGR)).toBe(true);
        }
        if (series.stats.historicalMDD !== null) {
          expect(series.stats.historicalMDD).toBeGreaterThanOrEqual(0);
          expect(series.stats.historicalMDD).toBeLessThanOrEqual(1.0);
        }
      }
    });
  });

  describe('2. Real-Time Replay Series (Replay Phase)', () => {
    it('should generate real-time points for Month 0 (1/1) up to currentMonth', () => {
      const year = 2008;
      const currentMonth = 6;
      const replay = getCompanyMonthlyReplaySeries('KR_005930', year, currentMonth);

      expect(replay).not.toBeNull();
      // Total currentMonth + 1 points (month 0 to month 6)
      expect(replay?.points.length).toBe(currentMonth + 1);

      // Verify points match 0..6
      replay?.points.forEach((p, idx) => {
        expect(p.month).toBe(idx);
        expect(p.priceKRW).toBeGreaterThan(0);
        expect(Number.isFinite(p.monthlyReturn)).toBe(true);
        expect(Number.isFinite(p.ytdReturn)).toBe(true);
      });
    });

    it('should never leak future months beyond currentMonth', () => {
      const replay = getCompanyMonthlyReplaySeries('US_MSFT', 2020, 4);
      // Month 0, 1, 2, 3, 4 = 5 points
      expect(replay?.points.length).toBe(5);
      expect(replay?.points.some(p => p.month > 4)).toBe(false);
    });
  });

  describe('3. Naver Finance High-Resolution Series & Non-Linearity', () => {
    it('should generate high-resolution non-straight price curve for INTC in 1982 (1-Year Mountain & Day)', () => {
      const chart1Y = getCompanyNaverChartData('US_INTC', 1982, 'LINE', '1Y');
      expect(chart1Y).not.toBeNull();
      expect(chart1Y?.candles.length).toBeGreaterThanOrEqual(100); // High-res daily simulation
      
      // Verify price curve is not a single straight line
      const closes = chart1Y!.candles.map(c => c.close);
      const firstClose = closes[0];
      const lastClose = closes[closes.length - 1];
      expect(firstClose).toBeGreaterThan(0);
      expect(lastClose).toBeGreaterThan(0);

      // Check standard deviation of price changes or intermediate variance
      let intermediateFluctuations = 0;
      for (let i = 1; i < closes.length - 1; i++) {
        const expectedLinear = firstClose + (lastClose - firstClose) * (i / (closes.length - 1));
        const diff = Math.abs(closes[i] - expectedLinear);
        if (diff > 0.5) intermediateFluctuations++;
      }
      expect(intermediateFluctuations).toBeGreaterThan(10); // Confirms realistic market wave, not straight line!

      // Verify volume
      expect(chart1Y?.totalVolume).toBeGreaterThan(0);
      chart1Y?.candles.forEach(c => {
        expect(c.volume).toBeGreaterThan(0);
        expect(c.high).toBeGreaterThanOrEqual(c.low);
      });
    });

    it('should calculate accurate moving averages (MA5, MA20, MA60, MA120) for candlestick mode', () => {
      const candleData = getCompanyNaverChartData('KR_005930', 2020, 'DAY', '1Y');
      expect(candleData).not.toBeNull();
      expect(candleData?.candles.length).toBeGreaterThan(60);

      const lateCandle = candleData!.candles[candleData!.candles.length - 1];
      expect(lateCandle.ma5).not.toBeNull();
      expect(lateCandle.ma20).not.toBeNull();
      expect(lateCandle.ma60).not.toBeNull();
      expect(Number.isFinite(lateCandle.ma5!)).toBe(true);
      expect(Number.isFinite(lateCandle.ma20!)).toBe(true);
      expect(Number.isFinite(lateCandle.ma60!)).toBe(true);
    });

    it('should correctly simulate sub-dollar US stocks in USD mode (KO 1982) without jumping to $1.00 or cliff drops', () => {
      const ko1982 = getCompanyNaverChartData('US_KO', 1982, 'DAY', '1Y', 'LOCAL');
      expect(ko1982).not.toBeNull();
      expect(ko1982?.currencyMode).toBe('LOCAL');
      expect(ko1982?.candles.length).toBeGreaterThanOrEqual(200);

      // KO 1981 close: ~$0.26, KO 1982 close: ~$0.40
      const firstCandle = ko1982!.candles[0];
      const lastCandle = ko1982!.candles[ko1982!.candles.length - 1];

      // First candle should start around 0.26
      expect(firstCandle.open).toBeCloseTo(0.2637, 1);
      // Last candle should end around 0.3955
      expect(lastCandle.close).toBeCloseTo(0.3955, 1);

      // All intermediate candles should stay in the realistic sub-dollar price corridor ($0.20 to $0.55), NOT jump to $1.00+
      ko1982!.candles.forEach(c => {
        expect(c.high).toBeLessThan(0.70);
        expect(c.low).toBeGreaterThan(0.15);
      });

      // Daily change on the final day should NOT be a cliff drop of -60%
      expect(Math.abs(ko1982!.changePercent)).toBeLessThan(0.15); // Normal daily change < 15%
    });

    it('should correctly simulate AAPL in 1988 in USD mode without jumping to $1.00 or monthly cliff drops', () => {
      const aapl1988 = getCompanyNaverChartData('US_AAPL', 1988, 'DAY', '1Y', 'LOCAL');
      expect(aapl1988).not.toBeNull();
      expect(aapl1988?.currencyMode).toBe('LOCAL');
      expect(aapl1988?.candles.length).toBeGreaterThanOrEqual(200);

      // AAPL 1987 close: ~$0.288, 1988 close: ~$0.2785
      const firstCandle = aapl1988!.candles[0];
      const lastCandle = aapl1988!.candles[aapl1988!.candles.length - 1];

      expect(firstCandle.open).toBeCloseTo(0.2881, 1);
      expect(lastCandle.close).toBeCloseTo(0.2785, 1);

      // All candles should stay in sub-dollar range around $0.20 ~ $0.40, NOT jump to $1.00+
      aapl1988!.candles.forEach(c => {
        expect(c.high).toBeLessThan(0.60);
        expect(c.low).toBeGreaterThan(0.10);
      });

      // Daily change on the final day should NOT be a cliff drop of -72%
      expect(Math.abs(aapl1988!.changePercent)).toBeLessThan(0.10);
    });
  });


  describe('4. Robustness Across All 50 Universe Stocks', () => {
    it('should produce strictly valid historical price series for all active stocks', () => {
      const allStockIds = Object.keys(STOCKS_BY_ID);
      expect(allStockIds.length).toBeGreaterThanOrEqual(50);

      allStockIds.forEach(cid => {
        const stock = STOCKS_BY_ID[cid];
        const series = getCompanyHistoricalPriceSeries(cid, 2023, 'ANNUAL');

        if (stock.firstValidYear <= 2023) {
          expect(series).not.toBeNull();
          expect(series?.points.length).toBeGreaterThan(0);
          expect(Number.isFinite(series?.currentPriceKRW)).toBe(true);
          expect(Number.isFinite(series?.allTimeHighKRW)).toBe(true);
        }
      });
    });
  });

  describe('5. Benchmark Sparklines & Charts', () => {
    it('should generate valid 1-year sparklines for KOSPI 200 and S&P 500 benchmarks', () => {
      const kospiSpark = getCompany1YrSparkline('BENCH_KOSPI', 2008);
      expect(kospiSpark).not.toBeNull();
      expect(kospiSpark?.points.length).toBeGreaterThan(1);
      expect(kospiSpark?.svgPath).toBeDefined();
      expect(kospiSpark?.svgAreaPath).toBeDefined();
      expect(Number.isFinite(kospiSpark?.return1Yr)).toBe(true);
      expect(kospiSpark?.return1Yr).toBeLessThan(0); // 2008 financial crisis should be negative return

      const sp500Spark = getCompany1YrSparkline('BENCH_SP500', 2008);
      expect(sp500Spark).not.toBeNull();
      expect(sp500Spark?.points.length).toBeGreaterThan(1);
      expect(sp500Spark?.svgPath).toBeDefined();
      expect(sp500Spark?.svgAreaPath).toBeDefined();
      expect(Number.isFinite(sp500Spark?.return1Yr)).toBe(true);
      expect(sp500Spark?.return1Yr).toBeLessThan(0); // 2008 S&P500 was negative
    });
  });
});
