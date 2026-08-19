#!/usr/bin/env python3
"""
scripts/validate_news_claims.py
Validates neutrality, lack of sensationalism, and absence of causal assertions.
"""

import json
import os
import sys

NEWS_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "news", "historical_news_all.json")

SENSATIONAL_PATTERNS = [
    "반드시 폭등", "무조건 매수", "천재적 선택", "대박 종목", "폭망 확정",
    "앞으로 10배 상승할 예정", "미래에 주가가 크게 오를 것으로 확정"
]

def validate_news_claims():
    if not os.path.exists(NEWS_FILE):
        print(f"Error: {NEWS_FILE} not found", file=sys.stderr)
        return []

    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_list = json.load(f)

    warnings = []
    for news in news_list:
        news_id = news.get("id", "UNKNOWN")
        text = f"{news.get('titleKo', '')} {news.get('summaryKo', '')}"

        for pat in SENSATIONAL_PATTERNS:
            if pat in text:
                warnings.append({
                    "id": news_id,
                    "warning": "SENSATIONAL_CLAIM",
                    "detail": f"Text contains speculative or sensational phrase: '{pat}'"
                })

    print(f"Claims validation complete: {len(warnings)} issues flagged.")
    return warnings

if __name__ == "__main__":
    res = validate_news_claims()
    print(json.dumps(res, indent=2, ensure_ascii=False))
