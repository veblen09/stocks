import { describe, it, expect } from 'vitest';
import { getMonthlyReplayQuality, generateMonthlyTrajectory } from '../src/engine/monthlyReplayEngine';
import type { StockHolding } from '../src/types/stockGame';

describe('Monthly Replay Engine', () => {
  it('determines data quality as VERIFIED_MONTHLY or PARTIAL_MONTHLY', () => {
    const mockHoldings: Record<string, StockHolding> = {
      KR_005930: {
        canonicalId: 'KR_005930',
        shares: 10,
        currentValueKRW: 10000000,
        currentWeight: 1.0,
        totalInvestedKRW: 10000000,
        averageCostKRW: 1000000,
        unrealizedPnlKRW: 0,
        unrealizedPnlPercent: 0,
      },
    };

    const quality = getMonthlyReplayQuality(2008, mockHoldings);
    expect(['VERIFIED_MONTHLY', 'PARTIAL_MONTHLY']).toContain(quality);
  });

  it('generates 12 monthly snapshots for year 2008 with crisisMonth marked', () => {
    const mockHoldings: Record<string, StockHolding> = {
      KR_005930: {
        canonicalId: 'KR_005930',
        shares: 10,
        currentValueKRW: 10000000,
        currentWeight: 1.0,
        totalInvestedKRW: 10000000,
        averageCostKRW: 1000000,
        unrealizedPnlKRW: 0,
        unrealizedPnlPercent: 0,
      },
    };

    const res = generateMonthlyTrajectory(2008, 2000000, mockHoldings, 12000000, 15000000, 9);
    expect(res.snapshots.length).toBe(12);

    const month9 = res.snapshots.find(s => s.month === 9);
    expect(month9).toBeDefined();
    expect(month9?.isCrisisMonth).toBe(true);
    expect(month9?.drawdownFromPeak).toBeLessThanOrEqual(0);
  });
});
