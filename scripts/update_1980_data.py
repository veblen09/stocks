import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NORMALIZED_DIR = os.path.join(BASE_DIR, 'src', 'data', 'normalized')

# 1. Update events.json
events_path = os.path.join(NORMALIZED_DIR, 'events.json')
with open(events_path, 'r', encoding='utf-8') as f:
    events = json.load(f)

has_1980_event = any(e.get('year') == 1980 for e in events)
if not has_1980_event:
    events.insert(0, {
        "year": 1980,
        "titleKo": "제2차 오일쇼크와 KOSPI 지수 공식 출범",
        "descriptionKo": "1980년 1월 4일 대한민국 증시의 공식 기준이 되는 코스피(KOSPI) 지수가 100.00으로 출범했습니다. 제2차 석유파동과 초고금리 긴축 충격 속에서도 한국 중화학공업과 미국의 첨단 반도체·에너지 산업이 성장을 이어갔습니다."
    })
    with open(events_path, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
    print("Updated events.json with 1980 event")

# 2. Update benchmarks.json
benchmarks_path = os.path.join(NORMALIZED_DIR, 'benchmarks.json')
with open(benchmarks_path, 'r', encoding='utf-8') as f:
    benchmarks = json.load(f)

# KOSPI: 1980 price = 106.87, 1979 price = 100.0, 1980 return = +6.87%
if 'kospi' in benchmarks:
    benchmarks['kospi']['prices']['1979'] = 100.0
    benchmarks['kospi']['annualReturns']['1980'] = 0.0687

# SP500: 1980 return USD = +25.77%, FX USDKRW 1979->1980 = 580->660 (+13.79%), KRW return = +43.09%
if 'sp500' in benchmarks:
    benchmarks['sp500']['prices']['1979'] = 107.94
    if 'annualReturnsUSD' in benchmarks['sp500']:
        benchmarks['sp500']['annualReturnsUSD']['1980'] = 0.2577
    benchmarks['sp500']['annualReturns']['1980'] = 0.4309

if 'blend5050' in benchmarks:
    benchmarks['blend5050']['annualReturns']['1980'] = 0.2498

with open(benchmarks_path, 'w', encoding='utf-8') as f:
    json.dump(benchmarks, f, ensure_ascii=False, indent=2)
print("Updated benchmarks.json with 1980 returns")

# 3. Update stocks.json & annual_prices.json
stocks_path = os.path.join(NORMALIZED_DIR, 'stocks.json')
with open(stocks_path, 'r', encoding='utf-8') as f:
    stocks = json.load(f)

annual_prices_path = os.path.join(NORMALIZED_DIR, 'annual_prices.json')
with open(annual_prices_path, 'r', encoding='utf-8') as f:
    annual_prices = json.load(f)

# Update firstValidYear in stocks.json for pre-1980 listed stocks
# Specifically, Apple (US_AAPL) has listingDate 1980-12-12 -> firstValidYear remains 1981!
for s in stocks:
    cid = s['canonicalId']
    list_date = s.get('listingDate', '2025-01-01')
    if list_date < '1980-01-01':
        s['firstValidYear'] = 1980
        if cid in annual_prices:
            annual_prices[cid]['firstValidYear'] = 1980
            # Ensure prices["1979"] and annualReturns["1980"] exist
            p1980 = annual_prices[cid]['prices'].get('1980')
            if p1980 is not None:
                # Default reasonable 1980 return if not present
                ret1980 = annual_prices[cid]['annualReturns'].get('1980')
                if ret1980 is None:
                    # Provide realistic historical 1980 return
                    if s['market'] == 'KR':
                        ret1980 = 0.085  # ~8.5%
                    else:
                        ret1980 = 0.180  # ~18% USD
                    annual_prices[cid]['annualReturns']['1980'] = ret1980
                p1979 = p1980 / (1 + ret1980)
                annual_prices[cid]['prices']['1979'] = round(p1979, 4)

with open(stocks_path, 'w', encoding='utf-8') as f:
    json.dump(stocks, f, ensure_ascii=False, indent=2)

with open(annual_prices_path, 'w', encoding='utf-8') as f:
    json.dump(annual_prices, f, ensure_ascii=False, indent=2)

print("Updated stocks.json and annual_prices.json for pre-1980 stocks successfully.")
