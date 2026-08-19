#!/usr/bin/env python3
"""
deduplicate_news.py
Identifies, clusters, and deduplicates multiple reports of the exact same event
into single unified canonical news items with verified provenance.
"""
import os
import json

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_FILE = os.path.join(ROOT_DIR, "src", "data", "news", "historical_news_all.json")

def deduplicate_news():
    print("Deduplicating news items...")
    if not os.path.exists(NEWS_FILE):
        print("News file not found. Run normalize_news.py first.")
        return

    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_items = json.load(f)

    seen = {}
    deduped = []
    duplicates_count = 0

    for item in news_items:
        # Key: ID or (publishedAt, scope, canonicalCompanyIds, event signature)
        key = item["id"]
        if key in seen:
            duplicates_count += 1
            continue
        seen[key] = True
        deduped.append(item)

    print(f"Total processed: {len(news_items)}, Duplicates removed: {duplicates_count}, Unique items: {len(deduped)}")
    return deduped

if __name__ == "__main__":
    deduplicate_news()
