#!/usr/bin/env python3
"""
build_news_index.py
Builds multi-dimensional indexing structures for historical news:
- byYear (1980..2025)
- byCompany (50 canonical IDs)
- byScope (GLOBAL_MACRO, KOREA_MACRO, US_MACRO, MARKET, SECTOR, COMPANY)
- bySector
"""
import os
import json

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_FILE = os.path.join(ROOT_DIR, "src", "data", "news", "historical_news_all.json")
OUTPUT_DIRS = [
    os.path.join(ROOT_DIR, "data", "news"),
    os.path.join(ROOT_DIR, "src", "data", "news")
]

def build_index():
    print("Building multi-dimensional news lookup indexes...")
    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_items = json.load(f)

    index = {
        "byYear": {},
        "byCompany": {},
        "byScope": {},
        "bySector": {},
        "totalItems": len(news_items)
    }

    for item in news_items:
        pub_year = item["publishedAt"][:4]
        index["byYear"].setdefault(pub_year, []).append(item["id"])

        for cid in item.get("canonicalCompanyIds", []):
            index["byCompany"].setdefault(cid, []).append(item["id"])

        scope = item["scope"]
        index["byScope"].setdefault(scope, []).append(item["id"])

        for sec in item.get("relatedSectors", []):
            index["bySector"].setdefault(sec, []).append(item["id"])

    for out_dir in OUTPUT_DIRS:
        os.makedirs(out_dir, exist_ok=True)
        idx_path = os.path.join(out_dir, "news-index.json")
        with open(idx_path, "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"Index built successfully with {len(news_items)} items.")

if __name__ == "__main__":
    build_index()
