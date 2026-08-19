#!/usr/bin/env python3
"""
scripts/validate_news_no_lookahead.py
Validates zero lookahead / no future leak in contemporary news reports.
"""

import json
import os
import re
import sys

NEWS_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "news", "historical_news_all.json")

LOOKAHEAD_PATTERNS = [
    r"이후\s*\d+년\s*(뒤|후)",
    r"결국\s*(파산|상장폐지|급등|폭락)",
    r"미래에\s*밝혀진",
    r"훗날\s*(드러난|밝혀진)",
    r"이때\s*샀으면",
    r"결과적으로\s*대성공"
]

def validate_no_lookahead():
    if not os.path.exists(NEWS_FILE):
        print(f"Error: {NEWS_FILE} not found", file=sys.stderr)
        return []

    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_list = json.load(f)

    warnings = []
    compiled_patterns = [re.compile(p) for p in LOOKAHEAD_PATTERNS]

    for news in news_list:
        news_id = news.get("id", "UNKNOWN")
        is_retrospective = news.get("isRetrospective", False)
        title = news.get("titleKo", "")
        summary = news.get("summaryKo", "")
        text = f"{title} {summary}"

        # If marked as contemporary (not retrospective), it must NOT contain lookahead phrases
        if not is_retrospective:
            for pattern in compiled_patterns:
                match = pattern.search(text)
                if match:
                    warnings.append({
                        "id": news_id,
                        "warning": "LOOKAHEAD_LEAK_IN_CONTEMPORARY_NEWS",
                        "detail": f"Matched pattern '{match.group(0)}' in text: {text[:60]}..."
                    })

    print(f"No-lookahead validation complete: {len(warnings)} issues flagged.")
    return warnings

if __name__ == "__main__":
    res = validate_no_lookahead()
    print(json.dumps(res, indent=2, ensure_ascii=False))
