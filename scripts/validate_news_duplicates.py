#!/usr/bin/env python3
"""
scripts/validate_news_duplicates.py
Checks for duplicate or near-identical headlines and summaries across different years.
"""

import json
import os
import sys
from collections import defaultdict

NEWS_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "news", "historical_news_all.json")

def validate_news_duplicates():
    if not os.path.exists(NEWS_FILE):
        print(f"Error: {NEWS_FILE} not found", file=sys.stderr)
        return []

    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_list = json.load(f)

    title_map = defaultdict(list)
    id_set = set()
    warnings = []

    for news in news_list:
        news_id = news.get("id", "UNKNOWN")
        if news_id in id_set:
            warnings.append({
                "id": news_id,
                "warning": "DUPLICATE_ID",
                "detail": f"Duplicate news ID detected: '{news_id}'"
            })
        id_set.add(news_id)

        title = news.get("titleKo", "").strip()
        pub_year = news.get("publishedAt", "")[:4]
        title_map[title].append((news_id, pub_year))

    for title, entries in title_map.items():
        if len(entries) > 1:
            years = [e[1] for e in entries]
            ids = [e[0] for e in entries]
            warnings.append({
                "ids": ids,
                "warning": "DUPLICATE_HEADLINE",
                "detail": f"Headline '{title}' repeated across {len(entries)} entries (years: {', '.join(years)})"
            })

    print(f"Duplicate validation complete: {len(warnings)} potential duplicates found.")
    return warnings

if __name__ == "__main__":
    res = validate_news_duplicates()
    print(json.dumps(res, indent=2, ensure_ascii=False))
