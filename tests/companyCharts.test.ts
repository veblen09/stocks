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
});
