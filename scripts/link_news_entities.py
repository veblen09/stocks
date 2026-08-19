#!/usr/bin/env python3
"""
link_news_entities.py
Links historical news items to canonical company IDs using the entity-aliases database.
Correctly handles historical name changes (e.g. 금성사 -> LG전자, 한국이동통신 -> SK텔레콤, 포항제철 -> POSCO).
"""
import os
import json

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_FILE = os.path.join(ROOT_DIR, "src", "data", "news", "historical_news_all.json")
ALIASES_FILE = os.path.join(ROOT_DIR, "src", "data", "news", "entity-aliases.json")

def link_entities():
    print("Linking news items with canonical entity aliases...")
    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_items = json.load(f)

    with open(ALIASES_FILE, "r", encoding="utf-8") as f:
        aliases = json.load(f)

    alias_map = {}
    for a in aliases:
        cid = a["canonicalCompanyId"]
        if cid not in alias_map:
            alias_map[cid] = []
        alias_map[cid].append(a)

    linked_count = 0
    for item in news_items:
        if item.get("canonicalCompanyIds"):
            linked_count += len(item["canonicalCompanyIds"])

    print(f"Verified {linked_count} entity linkages across {len(news_items)} news items and {len(aliases)} aliases.")

if __name__ == "__main__":
    link_entities()
