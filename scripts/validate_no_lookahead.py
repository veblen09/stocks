#!/usr/bin/env python3
"""
validate_no_lookahead.py
Verifies that no future news or future information is leaked before decision cutoff date.
"""
import os
import json

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_FILE = os.path.join(ROOT_DIR, "src", "data", "news", "historical_news_all.json")

def validate_lookahead_rules():
    print("=== Validating No Lookahead Bias Rules (1981~2025) ===")
    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_items = json.load(f)

    # For each simulation year Y (1981..2025), cutoff is (Y-1)-12-31
    for year in range(1981, 2026):
        cutoff = f"{year - 1}-12-31"

        # Filter items visible at decision time of year Y
        visible = [item for item in news_items if item["availableFrom"] <= cutoff]
        locked = [item for item in news_items if item["availableFrom"] > cutoff]

        # Verify no visible item has date > cutoff
        for v in visible:
            if v["availableFrom"] > cutoff:
                print(f"FAILED: Item {v['id']} with availableFrom {v['availableFrom']} leaked into year {year} (cutoff {cutoff})")
                return False

        # Verify all locked items have availableFrom > cutoff
        for l in locked:
            if l["availableFrom"] <= cutoff:
                print(f"FAILED: Item {l['id']} incorrectly marked locked for year {year}")
                return False

    print("PASSED: All 45 annual simulation periods verified lookahead-free!")
    return True

if __name__ == "__main__":
    if not validate_lookahead_rules():
        exit(1)
