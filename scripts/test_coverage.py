import urllib.request
import json
import datetime

headers = {'User-Agent': 'Mozilla/5.0'}
tickers = ['005930.KS', '^KS11', '^GSPC', 'KRW=X', 'BRK-B', 'AAPL', 'MSFT']

for t in tickers:
    url = f'https://query1.finance.yahoo.com/v8/finance/chart/{t}?period1=0&period2=1767225600&interval=1mo'
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            res = data['chart']['result'][0]
            timestamps = res.get('timestamp', [])
            if timestamps:
                first_dt = datetime.datetime.fromtimestamp(timestamps[0], datetime.timezone.utc)
                last_dt = datetime.datetime.fromtimestamp(timestamps[-1], datetime.timezone.utc)
                print(f'{t}: count={len(timestamps)}, first={first_dt.strftime("%Y-%m-%d")}, last={last_dt.strftime("%Y-%m-%d")}')
            else:
                print(f'{t}: No timestamps')
    except Exception as e:
        print(f'{t} failed: {e}')
