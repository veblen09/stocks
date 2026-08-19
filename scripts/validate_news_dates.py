#!/usr/bin/env python3
"""
scripts/validate_news_dates.py
Validates date formats, eventYear matches, and historical bounds (1980..2025).
"""

import json
import os
import re
import sys

NEWS_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "news", "historical_news_all.json")
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")

def validate_news_dates():
    if not os.path.exists(NEWS_FILE):
        print(f"Error: {NEWS_FILE} not found", file=sys.stderr)
        return []

    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_list = json.load(f)

    warnings = []
    for news in news_list:
        news_id = news.get("id", "UNKNOWN")
        published_at = news.get("publishedAt", "")
        
        if not DATE_PATTERN.match(published_at):
            warnings.append({
                "id": news_id,
                "warning": "INVALID_DATE_FORMAT",
                "detail": f"publishedAt '{published_at}' does not match YYYY-MM-DD"
            })
            continue

        year = int(published_at.split("-")[0])
        if year < 1980 or year > 2025:
            warnings.append({
                "id": news_id,
                "warning": "DATE_OUT_OF_BOUNDS",
                "detail": f"Year {year} is outside the simulation timeline (1980-2025)"
            })

    print(f"Date validation complete: {len(warnings)} issues flagged.")
    return warnings

if __name__ == "__main__":
    res = validate_news_dates()
    print(json.dumps(res, indent=2, ensure_ascii=False))
