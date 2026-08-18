"""
scripts/fetch_market_data.py
Fetches raw historical market prices for 50 stocks (25 Korean, 25 US), benchmarks, and USD/KRW FX.
"""

import urllib.request
import json
import os
import time
from datetime import datetime, timezone

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

US_TICKERS = [
    'AAPL', 'MSFT', 'IBM', 'INTC', 'NVDA',
    'AMZN', 'GOOGL', 'META', 'TSLA', 'JPM',
    'BAC', 'BRK-B', 'JNJ', 'UNH', 'XOM',
    'CVX', 'KO', 'PEP', 'PG', 'WMT',
    'HD', 'MCD', 'DIS', 'CAT', 'NKE'
]

KR_TICKERS = [
    '005930.KS', '000660.KS', '005380.KS', '000270.KS', '005490.KS',
    '051910.KS', '006400.KS', '066570.KS', '207940.KS', '035420.KS',
    '035720.KS', '068270.KS', '105560.KS', '055550.KS', '086790.KS',
    '028260.KS', '032830.KS', '017670.KS', '030200.KS', '015760.KS',
    '012330.KS', '003490.KS', '010950.KS', '000100.KS', '004370.KS'
]

INDEX_TICKERS = ['^KS11', '^GSPC', 'KRW=X']

def fetch_ticker_data(ticker):
    # Fetch from 1970 to 2026
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?period1=0&period2=1767225600&interval=1mo"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            return data
    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return None

def main():
    os.makedirs('data/raw', exist_ok=True)
    all_tickers = US_TICKERS + KR_TICKERS + INDEX_TICKERS
    print(f"Fetching data for {len(all_tickers)} symbols...")
    
    results = {}
    for ticker in all_tickers:
        safe_name = ticker.replace('^', '').replace('=', '_').replace('.', '_')
        raw_file = f"data/raw/{safe_name}.json"
        if os.path.exists(raw_file):
            print(f"[{ticker}] Loading from local cache {raw_file}")
            with open(raw_file, 'r', encoding='utf-8') as f:
                results[ticker] = json.load(f)
            continue
            
        print(f"[{ticker}] Fetching from Yahoo Finance API...")
        data = fetch_ticker_data(ticker)
        if data:
            results[ticker] = data
            with open(raw_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        time.sleep(0.3)
        
    print(f"Successfully retrieved raw data for {len(results)} symbols.")

if __name__ == '__main__':
    main()
