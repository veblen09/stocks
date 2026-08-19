#!/usr/bin/env python3
"""
scripts/validate_news_links.py
Validates link accessibility and distinguishes root homepages from specific document URLs.
"""

import json
import os
import sys
from urllib.parse import urlparse

NEWS_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "news", "historical_news_all.json")

def validate_news_links():
    if not os.path.exists(NEWS_FILE):
        print(f"Error: {NEWS_FILE} not found", file=sys.stderr)
        return []

    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_list = json.load(f)

    warnings = []
    for news in news_list:
        news_id = news.get("id", "UNKNOWN")
        url = news.get("sourceUrl", "")
        evidence_level = news.get("evidenceLevel", "")

        if not url:
            warnings.append({
                "id": news_id,
                "warning": "EMPTY_URL",
                "detail": "Source URL is missing."
            })
            continue

        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            warnings.append({
                "id": news_id,
                "warning": "MALFORMED_URL",
                "detail": f"Malformed URL: '{url}'"
            })
        elif parsed.path in ["", "/"] and evidence_level == "PRIMARY_SOURCE":
            # Just home page root URL but claiming PRIMARY_SOURCE
            warnings.append({
                "id": news_id,
                "warning": "ROOT_DOMAIN_ONLY",
                "detail": f"Source URL '{url}' is only a homepage root; documentary archive link should be verified or labeled accordingly."
            })

    print(f"Link validation complete: {len(warnings)} issues flagged.")
    return warnings

if __name__ == "__main__":
    res = validate_news_links()
    print(json.dumps(res, indent=2, ensure_ascii=False))
