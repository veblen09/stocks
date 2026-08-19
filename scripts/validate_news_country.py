#!/usr/bin/env python3
"""
scripts/validate_news_country.py
Validates market and country content consistency in historical news data.
"""

import json
import os
import sys

NEWS_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "news", "historical_news_all.json")

KR_EXCLUSIVE_KEYWORDS = [
    "코스피", "코스닥", "한국은행", "금융감독원", "재정경제부", "기획재정부",
    "금모으기", "카드채", "원화", "원/달러", "종합주가지수", "외환위기(IMF)"
]

US_EXCLUSIVE_KEYWORDS = [
    "연방준비제도", "연준(Fed)", "달러 인덱스", "S&P 500", "나스닥", "다우존스",
    "SEC(미국 증권거래위원회)", "미국 재무부", "월스트리트", "그린스펀", "볼커"
]

def validate_news_country():
    if not os.path.exists(NEWS_FILE):
        print(f"Error: {NEWS_FILE} not found", file=sys.stderr)
        return []

    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        news_list = json.load(f)

    warnings = []
    for news in news_list:
        news_id = news.get("id", "UNKNOWN")
        market = news.get("market")
        title = news.get("titleKo", "")
        summary = news.get("summaryKo", "")
        text = f"{title} {summary}"

        if market == "US":
            # US Macro or US Stock should not describe Korea-exclusive local domestic events as US events
            for kw in ["금모으기 운동", "한국 카드대란", "코스피 1000선 돌파", "외환위기 IMF 구제금융 신청"]:
                if kw in text:
                    warnings.append({
                        "id": news_id,
                        "market": market,
                        "warning": "COUNTRY_CONTENT_MISMATCH",
                        "detail": f"US market news contains exclusive Korean event keyword '{kw}'"
                    })
        elif market == "KR":
            # KR Macro should not describe exclusive US federal events as Korea domestic events
            for kw in ["미국 연방준비제도 이사회 금리", "그린스펀 의장 청문회", "다우존스 1만 포인트"]:
                if kw in text and "한국" not in text and "국내" not in text:
                    warnings.append({
                        "id": news_id,
                        "market": market,
                        "warning": "COUNTRY_CONTENT_MISMATCH",
                        "detail": f"KR market news describes exclusive US event keyword '{kw}' without domestic context"
                    })

    print(f"Country validation complete: {len(warnings)} potential warnings found.")
    return warnings

if __name__ == "__main__":
    res = validate_news_country()
    print(json.dumps(res, indent=2, ensure_ascii=False))
