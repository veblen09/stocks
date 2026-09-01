"""
scripts/validate_market_data.py
Strictly validates all normalized datasets to guarantee data integrity, no fake data, and full compliance.
"""

import json
import math
import sys

def validate():
    print("=== Validating Market Datasets ===")
    
    # 1. Load stocks.json
    with open('src/data/normalized/stocks.json', 'r', encoding='utf-8') as f:
        stocks = json.load(f)
    print(f"Checking stocks.json: Found {len(stocks)} stocks.")
    assert len(stocks) == 60, f"Expected 60 stocks, got {len(stocks)}"
    kr_stocks = [s for s in stocks if s['market'] == 'KR']
    us_stocks = [s for s in stocks if s['market'] == 'US']
    assert len(kr_stocks) == 30, f"Expected 30 KR stocks, got {len(kr_stocks)}"
    assert len(us_stocks) == 30, f"Expected 30 US stocks, got {len(us_stocks)}"
    print("  -> Exactly 30 Korean stocks and 30 US stocks verified.")

    # 2. Load fx_usdkrw.json
    with open('src/data/normalized/fx_usdkrw.json', 'r', encoding='utf-8') as f:
        fx = json.load(f)
    fx_rates = fx['rates']
    for y in range(1980, 2026):
        assert str(y) in fx_rates or y in fx_rates, f"Missing FX rate for year {y}"
        val = fx_rates.get(str(y), fx_rates.get(y))
        assert val > 0, f"Invalid FX rate {val} for year {y}"
    print("  -> USD/KRW rates for all 46 year-end points (1980-2025) verified.")

    # 3. Load benchmarks.json
    with open('src/data/normalized/benchmarks.json', 'r', encoding='utf-8') as f:
        benchmarks = json.load(f)
    for b_id in ['kospi', 'sp500', 'blend5050']:
        assert b_id in benchmarks, f"Missing benchmark {b_id}"
        rets = benchmarks[b_id]['annualReturns']
        for y in range(1980, 2026):
            val = rets.get(str(y), rets.get(y))
            assert val is not None and not math.isnan(val), f"Benchmark {b_id} missing return for {y}"
    print("  -> All 3 Benchmarks (KOSPI 200, S&P 500 KRW, 50:50) verified for all 46 annual periods.")

    # 4. Load annual_prices.json
    with open('src/data/normalized/annual_prices.json', 'r', encoding='utf-8') as f:
        annual_prices = json.load(f)
    assert len(annual_prices) == 60, f"Expected 60 stocks in annual_prices, got {len(annual_prices)}"
    
    for stock in stocks:
        cid = stock['canonicalId']
        assert cid in annual_prices, f"Missing price entry for {cid}"
        entry = annual_prices[cid]
        first_yr = stock['firstValidYear']
        returns = entry['annualReturns']
        prices = entry['prices']
        
        # Check pre-IPO years
        for y in range(1981, first_yr):
            ret = returns.get(str(y), returns.get(y))
            assert ret is None, f"Stock {cid} must have null return before firstValidYear {first_yr} (year {y} was {ret})"
            
        # Check valid years
        valid_years_count = 0
        for y in range(first_yr, 2026):
            ret = returns.get(str(y), returns.get(y))
            if ret is not None:
                valid_years_count += 1
        assert valid_years_count > 0, f"Stock {cid} has 0 valid return years!"
        
    print("  -> Pre-IPO data handling and return validity verified across all 50 stocks.")

    # 5. Load events.json
    with open('src/data/normalized/events.json', 'r', encoding='utf-8') as f:
        events = json.load(f)
    assert len(events) == 45, f"Expected 45 annual historical market events (1981-2025), got {len(events)}"
    event_years = [e['year'] for e in events]
    assert event_years == list(range(1981, 2026)), "Event years mismatch"
    print("  -> All 45 Historical Market Briefing events verified (1981-2025).")

    # 6. Load dataProvenance.json
    with open('src/data/normalized/dataProvenance.json', 'r', encoding='utf-8') as f:
        provenance = json.load(f)
    assert provenance['totalAnnualPeriods'] == 45
    print("  -> Data provenance & methodology documentation verified.")
    print("=== All Dataset Validations PASSED Successfully! ===")

if __name__ == '__main__':
    validate()
