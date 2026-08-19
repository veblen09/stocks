#!/usr/bin/env python3
"""
scripts/validate_news_source.py
Validates source name, sourceType, and evidenceLevel in historical news data.
"""

import json
import os
import sys

NEWS_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "news", "historical_news_all.json")

OFFICIAL_SOURCES = [
    "DART", "전자공시시스템", "SEC", "EDGAR", "한국은행", "Federal Reserve",
    "한국거래소", "KRX", "NYSE", "NASDAQ", "통계청", "Bureau of Labor Statistics", "BEA"
]

def validate_news_source():
    if not os.path.exists(NEWS_FILE):
        print(f"Error: {NEWS_FILE} not found", file=sys.stderr)
        return []

    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_list = json.load(f)

    warnings = []
    for news in news_list:
        news_id = news.get("id", "UNKNOWN")
        source_name = news.get("sourceName", "")
        source_type = news.get("sourceType", "")
        evidence_level = news.get("evidenceLevel", "")
        source_url = news.get("sourceUrl", "")

        # Check if PRIMARY_SOURCE is given without an official agency or direct source
        if evidence_level == "PRIMARY_SOURCE":
            is_official = any(os_kw.lower() in source_name.lower() for os_kw in OFFICIAL_SOURCES)
            if not is_official and source_type not in ["GOVERNMENT", "REGULATOR", "EXCHANGE", "FILING"]:
                warnings.append({
                    "id": news_id,
                    "source": source_name,
                    "warning": "PRIMARY_SOURCE_UNGROUNDED",
                    "detail": f"News marked as PRIMARY_SOURCE but source '{source_name}' ({source_type}) is a media outlet rather than official filing body."
                })

        # Check if sourceUrl is empty
        if not source_url:
            warnings.append({
                "id": news_id,
                "warning": "MISSING_SOURCE_URL",
                "detail": f"Source URL is missing for news '{news.get('titleKo')}'"
            })

    print(f"Source validation complete: {len(warnings)} issues flagged.")
    return warnings

if __name__ == "__main__":
    res = validate_news_source()
    print(json.dumps(res, indent=2, ensure_ascii=False))
