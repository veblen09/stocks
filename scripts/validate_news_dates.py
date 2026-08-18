#!/usr/bin/env python3
"""
validate_news_dates.py
Validates date formatting, chronologic order, and availability consistency.
"""
import os
import json
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_FILE = os.path.join(ROOT_DIR, "src", "data", "news", "historical_news_all.json")

def validate_dates():
    print("=== Validating Historical News Dates ===")
    if not os.path.exists(NEWS_FILE):
        print(f"Error: {NEWS_FILE} not found!")
        return False

    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_items = json.load(f)

    date_regex = re.compile(r"^\d{4}-\d{2}-\d{2}$")

    for item in news_items:
        nid = item["id"]
        pub = item.get("publishedAt", "")
        avail = item.get("availableFrom", "")
        prec = item.get("datePrecision", "")

        if not date_regex.match(pub):
            print(f"Error: Invalid publishedAt '{pub}' in {nid}")
            return False

        if not date_regex.match(avail):
            print(f"Error: Invalid availableFrom '{avail}' in {nid}")
            return False

        if pub > avail:
            print(f"Error: publishedAt ({pub}) is after availableFrom ({avail}) in {nid}")
            return False

        if prec not in ["DAY", "MONTH", "YEAR"]:
            print(f"Error: Invalid datePrecision '{prec}' in {nid}")
            return False

    print(f"Successfully validated {len(news_items)} news items dates and availability timestamps!")
    return True

if __name__ == "__main__":
    if not validate_dates():
        exit(1)
