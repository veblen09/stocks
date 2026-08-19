import json
import glob
import os
from datetime import datetime, timezone

def inspect_files():
    files = sorted(glob.glob('data/raw/*.json'))
    print(f"Total raw files: {len(files)}")
    summary = {}
    for f in files:
        base = os.path.basename(f)
        with open(f, 'r', encoding='utf-8') as fp:
            d = json.load(fp)
            results = d.get('chart', {}).get('result', [])
            if not results:
                continue
            chart = results[0]
            ts = chart.get('timestamp', [])
            if not ts:
                continue
            dt_start = datetime.fromtimestamp(ts[0], tz=timezone.utc)
            dt_end = datetime.fromtimestamp(ts[-1], tz=timezone.utc)
            summary[base] = {
                'count': len(ts),
                'start': dt_start.strftime('%Y-%m'),
                'end': dt_end.strftime('%Y-%m'),
                'start_year': dt_start.year,
                'end_year': dt_end.year
            }
            print(f"{base:20s}: {len(ts):4d} pts | {dt_start.strftime('%Y-%m')} -> {dt_end.strftime('%Y-%m')}")
    return summary

if __name__ == '__main__':
    inspect_files()
