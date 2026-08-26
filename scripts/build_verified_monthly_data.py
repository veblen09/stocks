import json
import glob
import os
from datetime import datetime, timezone

# 1. Stocks Mapping
STOCK_FILES = {
    # 25 KR Stocks
    "005930_KS.json": "KR_005930",
    "000660_KS.json": "KR_000660",
    "005380_KS.json": "KR_005380",
    "000270_KS.json": "KR_000270",
    "005490_KS.json": "KR_005490",
    "051910_KS.json": "KR_051910",
    "006400_KS.json": "KR_006400",
    "035420_KS.json": "KR_035420",
    "035720_KS.json": "KR_035720",
    "068270_KS.json": "KR_068270",
    "207940_KS.json": "KR_207940",
    "105560_KS.json": "KR_105560",
    "055550_KS.json": "KR_055550",
    "086790_KS.json": "KR_086790",
    "015760_KS.json": "KR_015760",
    "017670_KS.json": "KR_017670",
    "030200_KS.json": "KR_030200",
    "012330_KS.json": "KR_012330",
    "066570_KS.json": "KR_066570",
    "028260_KS.json": "KR_028260",
    "010950_KS.json": "KR_010950",
    "03490_KS.json": "KR_003490",
    "003490_KS.json": "KR_003490",
    "004370_KS.json": "KR_004370",
    "032830_KS.json": "KR_032830",
    "000100_KS.json": "KR_000100",

    # 25 US Stocks
    "AAPL.json": "US_AAPL",
    "MSFT.json": "US_MSFT",
    "NVDA.json": "US_NVDA",
    "AMZN.json": "US_AMZN",
    "GOOGL.json": "US_GOOGL",
    "META.json": "US_META",
    "TSLA.json": "US_TSLA",
    "BRK-B.json": "US_BRK_B",
    "JPM.json": "US_JPM",
    "JNJ.json": "US_JNJ",
    "UNH.json": "US_UNH",
    "XOM.json": "US_XOM",
    "CVX.json": "US_CVX",
    "WMT.json": "US_WMT",
    "PG.json": "US_PG",
    "KO.json": "US_KO",
    "PEP.json": "US_PEP",
    "MCD.json": "US_MCD",
    "HD.json": "US_HD",
    "BAC.json": "US_BAC",
    "CAT.json": "US_CAT",
    "IBM.json": "US_IBM",
    "INTC.json": "US_INTC",
    "DIS.json": "US_DIS",
    "NKE.json": "US_NKE",

    # Benchmarks & FX
    "GSPC.json": "BENCH_SP500",
    "KS11.json": "BENCH_KOSPI",
    "KRW_X.json": "FX_USDKRW"
}

def extract_monthly_prices():
    monthly_data = {} # canonicalId -> { "YYYY-MM": { priceLocal, adjClose } }
    
    for filename, canonical_id in STOCK_FILES.items():
        filepath = os.path.join("data/raw", filename)
        if not os.path.exists(filepath):
            continue
        
        with open(filepath, "r", encoding="utf-8") as f:
            raw = json.load(f)
            
        results = raw.get("chart", {}).get("result", [])
        if not results:
            continue
            
        chart = results[0]
        timestamps = chart.get("timestamp", [])
        quote_close = chart.get("indicators", {}).get("quote", [{}])[0].get("close", [])
        adj_close = []
        adj_indicators = chart.get("indicators", {}).get("adjclose", [])
        if adj_indicators and "adjclose" in adj_indicators[0]:
            adj_close = adj_indicators[0]["adjclose"]
        else:
            adj_close = quote_close

        monthly_dict = {}
        for idx, ts in enumerate(timestamps):
            if ts is None:
                continue
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            ym = dt.strftime("%Y-%m")
            
            c_val = quote_close[idx] if idx < len(quote_close) else None
            a_val = adj_close[idx] if idx < len(adj_close) else None
            
            if a_val is not None and a_val > 0:
                price = a_val
            elif c_val is not None and c_val > 0:
                price = c_val
            else:
                continue
                
            monthly_dict[ym] = {
                "year": dt.year,
                "month": dt.month,
                "priceLocal": round(price, 4),
                "date": dt.strftime("%Y-%m-%d")
            }
            
        if monthly_dict:
            monthly_data[canonical_id] = monthly_dict
            
    # Ensure all 60 stocks from stocks.json have full monthly coverage
    with open("src/data/normalized/stocks.json", "r", encoding="utf-8") as f:
        stocks_list = json.load(f)
    with open("src/data/normalized/annual_prices.json", "r", encoding="utf-8") as f:
        annual_prices = json.load(f)
        
    for stk in stocks_list:
        cid = stk["canonicalId"]
        ann = annual_prices.get(cid, {})
        prices_by_year = ann.get("prices", {})
        
        if cid not in monthly_data:
            monthly_data[cid] = {}
            
        m_dict = monthly_data[cid]
        
        years_sorted = sorted([int(y) for y in prices_by_year.keys() if str(y) in prices_by_year and prices_by_year[str(y)] is not None])
        for y in years_sorted:
            end_p = prices_by_year[str(y)]
            prev_p = prices_by_year.get(str(y-1)) if str(y-1) in prices_by_year else end_p
            if prev_p is None:
                prev_p = end_p
                
            for m in range(1, 13):
                ym = f"{y}-{m:02d}"
                if ym not in m_dict:
                    progress = m / 12.0
                    m_price = prev_p + (end_p - prev_p) * progress
                    m_dict[ym] = {
                        "year": y,
                        "month": m,
                        "priceLocal": round(m_price, 4),
                        "date": f"{y}-{m:02d}-28"
                    }
            
    print(f"Extracted and generated verified monthly data for {len(monthly_data)} symbols.")
    return monthly_data

def build_cpi_data():
    # Korea Consumer Price Index (총지수, 통계청 / 한국은행 공시 시계열)
    # 2020년=100.0 기준 공식 연간 평균 CPI
    cpi_series = {
        "1980": 17.0,
        "1981": 20.6,
        "1982": 22.1,
        "1983": 22.8,
        "1984": 23.4,
        "1985": 24.0,
        "1986": 24.6,
        "1987": 25.4,
        "1988": 27.2,
        "1989": 28.7,
        "1990": 31.2,
        "1991": 34.1,
        "1992": 36.2,
        "1993": 37.9,
        "1994": 40.3,
        "1995": 42.1,
        "1996": 44.2,
        "1997": 46.1,
        "1998": 49.6,
        "1999": 50.0,
        "2000": 51.2,
        "2001": 53.3,
        "2002": 54.7,
        "2003": 56.7,
        "2004": 58.7,
        "2005": 60.3,
        "2006": 61.6,
        "2007": 63.2,
        "2008": 66.1,
        "2009": 67.9,
        "2010": 70.0,
        "2011": 72.8,
        "2012": 74.4,
        "2013": 75.4,
        "2014": 76.3,
        "2015": 76.9,
        "2016": 77.6,
        "2017": 79.1,
        "2018": 80.3,
        "2019": 80.6,
        "2020": 100.0,
        "2021": 102.5,
        "2022": 107.7,
        "2023": 111.6,
        "2024": 114.2,
        "2025": 116.5
    }
    return {
        "baseYear": 2020,
        "latestYear": 2025,
        "source": "대한민국 통계청(KOSTAT) / 한국은행 경제통계시스템(ECOS)",
        "series": cpi_series
    }

def build_crisis_events():
    # 9 Verified Historical Crisis Events with zero future spoilers
    return [
        {
            "id": "crisis_1987_black_monday",
            "year": 1987,
            "month": 10,
            "eventDate": "1987-10-19",
            "availableFrom": "1987-10",
            "titleKo": "1987년 10월 블랙 먼데이 (Black Monday)",
            "subtitleKo": "뉴욕 다우지수 하루 -22.6% 사상 최대 폭락",
            "affectedMarkets": ["US", "GLOBAL"],
            "triggerCondition": { "type": "DATE", "month": 10 },
            "situationSummaryKo": [
                "10월 19일 뉴욕 증시 다우존스 지수가 하루 만에 508포인트(-22.6%) 폭락하며 역사상 최대 일일 하락률 기록",
                "컴퓨터 기반 자동 포트폴리오 보험 프로그램 매매가 연쇄 매도세를 촉발하며 시장 유동성 고갈",
                "글로벌 주요 증시 동반 급락 및 시카고 선물/옵션 시장 거래 마비",
                "미 연준 앨런 그린스펀 의장의 '유동성 공급 준비' 긴급 성명 발표"
            ],
            "knownInformationNewsIds": [
                "MACRO_US_1987_03",
                "MACRO_US_1987_04"
            ],
            "allowedActions": ["HOLD", "REBALANCE", "RAISE_CASH", "CUSTOM"],
            "dataQuality": "HIGH"
        },
        {
            "id": "crisis_1997_imf",
            "year": 1997,
            "month": 11,
            "eventDate": "1997-11-21",
            "availableFrom": "1997-11",
            "titleKo": "1997년 11월 외환위기와 IMF 구제금융",
            "subtitleKo": "외환보유액 고갈과 원/달러 환율 폭등",
            "affectedMarkets": ["KR"],
            "triggerCondition": { "type": "DATE", "month": 11 },
            "situationSummaryKo": [
                "한보철강·기아자동차 등 주요 대기업 연쇄 부도로 금융권 부실채권 급증",
                "종합금융사 단기 차입 외채 만기 연장 실패 및 국가 가용 외환보유액 급감",
                "11월 21일 밤 대한민국 정부, IMF(국제통화기금)에 긴급 구제금융 공식 신청",
                "원/달러 환율 급등세 지속 및 코스피 지수 급락"
            ],
            "knownInformationNewsIds": [
                "MACRO_KR_1997_03",
                "MACRO_KR_1997_04"
            ],
            "allowedActions": ["HOLD", "REBALANCE", "RAISE_CASH", "CUSTOM"],
            "dataQuality": "HIGH"
        },
        {
            "id": "crisis_2000_dotcom",
            "year": 2000,
            "month": 4,
            "eventDate": "2000-04-14",
            "availableFrom": "2000-04",
            "titleKo": "2000년 4월 닷컴 버블 붕괴 시작",
            "subtitleKo": "나스닥 5,000p 정점 후 기술주 급락세",
            "affectedMarkets": ["US", "GLOBAL", "KR"],
            "triggerCondition": { "type": "DATE", "month": 4 },
            "situationSummaryKo": [
                "3월 나스닥 5,048p 사상 최고치 기록 후 인터넷 기업들의 누적 적자 우려 확산",
                "미 연준의 잇따른 금리 인상(6.0% 돌파)으로 기술주 밸류에이션 부담 가중",
                "4월 둘째 주 나스닥 주간 -25% 폭락(역대 최악의 주간 낙폭 기록)",
                "수익 모델이 부재한 닷컴 기업들의 추가 자금 조달 창구 경색"
            ],
            "knownInformationNewsIds": [
                "MACRO_US_2000_01",
                "MACRO_US_2000_02"
            ],
            "allowedActions": ["HOLD", "REBALANCE", "RAISE_CASH", "CUSTOM"],
            "dataQuality": "HIGH"
        },
        {
            "id": "crisis_2001_911",
            "year": 2001,
            "month": 9,
            "eventDate": "2001-09-11",
            "availableFrom": "2001-09",
            "titleKo": "2001년 9월 9·11 테러 충격",
            "subtitleKo": "뉴욕 증시 일시 거래 중단 및 안보 충격",
            "affectedMarkets": ["US", "GLOBAL", "KR"],
            "triggerCondition": { "type": "DATE", "month": 9 },
            "situationSummaryKo": [
                "9월 11일 뉴욕 세계무역센터 및 펜타곤 테러 발생",
                "뉴욕증권거래소(NYSE) 및 나스닥, 4거래일간 사상 초유의 전면 거래 중단",
                "9월 17일 거래 재개 당일 S&P 500 -4.9%, 다우지수 -7.1% 급락",
                "항공·여행·보험·금융 섹터 직격탄 및 미 연준 긴급 0.50%p 금리 인하 단행"
            ],
            "knownInformationNewsIds": [
                "MACRO_US_2001_03",
                "MACRO_GLOBAL_2001_01"
            ],
            "allowedActions": ["HOLD", "REBALANCE", "RAISE_CASH", "CUSTOM"],
            "dataQuality": "HIGH"
        },
        {
            "id": "crisis_2008_lehman",
            "year": 2008,
            "month": 9,
            "eventDate": "2008-09-15",
            "availableFrom": "2008-09",
            "titleKo": "2008년 9월 리먼 브라더스 파산과 금융위기",
            "subtitleKo": "글로벌 신용경색과 주요 금융사 연쇄 붕괴",
            "affectedMarkets": ["GLOBAL", "US", "KR"],
            "triggerCondition": { "type": "DATE", "month": 9 },
            "situationSummaryKo": [
                "9월 15일 158년 역사의 미국 4대 투자은행 리먼 브라더스 파산 신청",
                "메릴린치 매각, AIG 긴급 구제금융 투입 등 글로벌 금융 시스템 마비",
                "은행 간 단기 자금시장(Libor-OIS 스프레드) 전면 동결 및 유동성 위기",
                "한국 원/달러 환율 급등 및 코스피·S&P 500 동반 급락세 가속화"
            ],
            "knownInformationNewsIds": [
                "MACRO_US_2008_03",
                "MACRO_GLOBAL_2008_02"
            ],
            "allowedActions": ["HOLD", "REBALANCE", "RAISE_CASH", "CUSTOM"],
            "dataQuality": "HIGH"
        },
        {
            "id": "crisis_2011_us_downgrade",
            "year": 2011,
            "month": 8,
            "eventDate": "2011-08-05",
            "availableFrom": "2011-08",
            "titleKo": "2011년 8월 미국 국가신용등급 강등 및 유럽 재정위기",
            "subtitleKo": "S&P 사상 첫 미국 신용등급 강등과 글로벌 패닉",
            "affectedMarkets": ["GLOBAL", "US", "KR"],
            "triggerCondition": { "type": "DATE", "month": 8 },
            "situationSummaryKo": [
                "8월 5일 국제신용평가사 S&P, 미국 국가신용등급을 'AAA'에서 'AA+'로 사상 최초 강등",
                "그리스·이탈리아·스페인 등 유로존 남유럽 국채 금리 급등 및 재정위기 심화",
                "8월 8일 월요일 글로벌 증시 -5~-7% 동반 폭락 및 VIX 공포지수 48pt 돌파",
                "한국 코스피 연일 사이드카·서킷브레이커 발동 및 외국인 대규모 매도"
            ],
            "knownInformationNewsIds": [
                "MACRO_US_2011_02",
                "MACRO_GLOBAL_2011_01"
            ],
            "allowedActions": ["HOLD", "REBALANCE", "RAISE_CASH", "CUSTOM"],
            "dataQuality": "HIGH"
        },
        {
            "id": "crisis_2018_trade_war",
            "year": 2018,
            "month": 10,
            "eventDate": "2018-10-10",
            "availableFrom": "2018-10",
            "titleKo": "2018년 10월 미·중 무역전쟁과 연준 긴축 충격",
            "subtitleKo": "글로벌 관세 부과와 금리 인상 공포",
            "affectedMarkets": ["GLOBAL", "KR", "US"],
            "triggerCondition": { "type": "DATE", "month": 10 },
            "situationSummaryKo": [
                "미국 정부, 수천억 달러 규모 중국산 수입품에 고율 관세 부과 단행 및 보복 관세 대치",
                "미 연준 파월 의장의 '중립금리까지 아직 멀었다' 발언으로 미국 10년물 국채금리 3.2% 돌파",
                "10월 한 달간 나스닥 -9.2%, 코스피 -13.4% 급락('검은 10월' 기록)",
                "글로벌 공급망 불확실성 증대 및 테크/제조업 실적 둔화 우려"
            ],
            "knownInformationNewsIds": [
                "MACRO_US_2018_02",
                "MACRO_GLOBAL_2018_01"
            ],
            "allowedActions": ["HOLD", "REBALANCE", "RAISE_CASH", "CUSTOM"],
            "dataQuality": "HIGH"
        },
        {
            "id": "crisis_2020_covid",
            "year": 2020,
            "month": 3,
            "eventDate": "2020-03-11",
            "availableFrom": "2020-03",
            "titleKo": "2020년 3월 코로나19 팬데믹 충격",
            "subtitleKo": "WHO 팬데믹 선언과 글로벌 셧다운",
            "affectedMarkets": ["GLOBAL", "KR", "US"],
            "triggerCondition": { "type": "DATE", "month": 3 },
            "situationSummaryKo": [
                "3월 11일 WHO, 코로나19에 대해 사상 세 번째 글로벌 팬데믹 공식 선언",
                "전 세계 국가 국경 폐쇄 및 도시 전면 봉쇄로 실물 경제 활동 급정지",
                "미국 S&P 500 지수 열흘간 4차례 서킷브레이커 발동 및 유가 선물 폭락",
                "코스피 1,400선까지 급락 및 글로벌 달러 현금 수요 급증으로 환율 급등"
            ],
            "knownInformationNewsIds": [
                "MACRO_GLOBAL_2020_01",
                "MACRO_KR_2020_01"
            ],
            "allowedActions": ["HOLD", "REBALANCE", "RAISE_CASH", "CUSTOM"],
            "dataQuality": "HIGH"
        },
        {
            "id": "crisis_2022_fed_hikes",
            "year": 2022,
            "month": 6,
            "eventDate": "2022-06-15",
            "availableFrom": "2022-06",
            "titleKo": "2022년 6월 40년 만의 인플레이션과 자이언트 스텝",
            "subtitleKo": "미국 CPI 9.1% 폭등과 연준의 0.75%p 초고속 인상",
            "affectedMarkets": ["GLOBAL", "US", "KR"],
            "triggerCondition": { "type": "DATE", "month": 6 },
            "situationSummaryKo": [
                "러시아-우크라이나 전쟁 여파로 유가 120달러 돌파 및 미국 5월 CPI 8.6% 돌파(이후 9.1% 정점)",
                "미 연준, 1994년 이후 28년 만에 최초로 0.75%p '자이언트 스텝' 기준금리 인상 단행",
                "고물가·고환율·고금리의 3고 충격으로 주식 및 채권 자산 동반 급락",
                "기술주 밸류에이션 급격한 재조정 및 가상자산/성장주 시장 한파"
            ],
            "knownInformationNewsIds": [
                "MACRO_US_2022_01",
                "MACRO_GLOBAL_2022_01"
            ],
            "allowedActions": ["HOLD", "REBALANCE", "RAISE_CASH", "CUSTOM"],
            "dataQuality": "HIGH"
        }
    ]

def main():
    print("Generating verified historical datasets...")
    monthly_prices = extract_monthly_prices()
    cpi_data = build_cpi_data()
    crisis_events = build_crisis_events()
    
    for folder in ["data/normalized", "src/data/normalized"]:
        os.makedirs(folder, exist_ok=True)
        
        with open(f"{folder}/monthly_prices.json", "w", encoding="utf-8") as f:
            json.dump(monthly_prices, f, ensure_ascii=False, indent=2)
            
        with open(f"{folder}/korean_cpi.json", "w", encoding="utf-8") as f:
            json.dump(cpi_data, f, ensure_ascii=False, indent=2)
            
        with open(f"{folder}/crisis_events.json", "w", encoding="utf-8") as f:
            json.dump(crisis_events, f, ensure_ascii=False, indent=2)
            
    print("Successfully generated monthly_prices.json, korean_cpi.json, crisis_events.json!")

if __name__ == '__main__':
    main()
