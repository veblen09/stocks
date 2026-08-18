# 머니트랙 시장 데이터 감사 및 검증 보고서 (DATA_AUDIT.md)

## 1. 데이터 개요 및 운용 기간
- **시뮬레이션 전체 기간**: 1980년 말(1980-12-31) ~ 2025년 말(2025-12-31)
- **기준 연말 데이터 포인트**: 46개 (1980~2025년 말 기준가 및 환율)
- **총 연간 운용 구간**: 45개 (1981년 운용 구간부터 2025년 운용 구간까지)
- **종목 카탈로그 수**: 총 50개 (한국 코스피/코스닥 대표 25개, 미국 대표 25개)
- **기준 통화**: 대한민국 원화 (KRW)

---

## 2. 50개 종목 데이터 감사 및 상장 연도 매핑표

### 2.1 한국 주식 (25개)

| # | 종목명 | 표준 ID | 티커 | 업종 | 상장일 | 최초 투자 가능 연도 (firstValidYear) | 데이터 품질 | 원본 출처 |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | **삼성전자** | `KR_005930` | 005930 | 반도체/IT | 1975-06-11 | 1981 (1980년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 2 | **SK하이닉스** | `KR_000660` | 000660 | 반도체 | 1996-12-26 | 1997 (1996년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 3 | **현대차** | `KR_005380` | 005380 | 자동차/모빌리티 | 1974-06-28 | 1981 (1980년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 4 | **기아** | `KR_000270` | 000270 | 자동차/모빌리티 | 1973-07-21 | 1981 (1980년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 5 | **POSCO홀딩스** | `KR_005490` | 005490 | 철강/이차전지소재 | 1988-06-10 | 1989 (1988년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 6 | **LG화학** | `KR_051910` | 051910 | 화학/신소재 | 2001-04-25 | 2002 (2001년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 7 | **삼성SDI** | `KR_006400` | 006400 | 이차전지/전자재료 | 1979-02-27 | 1981 (1980년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 8 | **LG전자** | `KR_066570` | 066570 | 가전/IT | 2002-04-22 | 2003 (2002년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 9 | **삼성바이오로직스** | `KR_207940` | 207940 | 바이오/제약 | 2016-11-10 | 2017 (2016년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 10 | **NAVER** | `KR_035420` | 035420 | 인터넷/플랫폼 | 2002-10-29 | 2003 (2002년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 11 | **카카오** | `KR_035720` | 035720 | 인터넷/플랫폼 | 1999-11-11 | 2000 (1999년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 12 | **셀트리온** | `KR_068270` | 068270 | 바이오/제약 | 2005-07-19 | 2006 (2005년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 13 | **KB금융** | `KR_105560` | 105560 | 금융/은행 | 2008-10-10 | 2009 (2008년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 14 | **신한지주** | `KR_055550` | 055550 | 금융/은행 | 2001-09-10 | 2002 (2001년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 15 | **하나금융지주** | `KR_086790` | 086790 | 금융/은행 | 2005-12-12 | 2006 (2005년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 16 | **삼성물산** | `KR_028260` | 028260 | 지주/건설/상사 | 2014-12-18 | 2015 (2014년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 17 | **삼성생명** | `KR_032830` | 032830 | 금융/보험 | 2010-05-12 | 2011 (2010년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 18 | **SK텔레콤** | `KR_017670` | 017670 | 통신/AI | 1989-11-06 | 1990 (1989년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 19 | **KT** | `KR_030200` | 030200 | 통신/IT | 1998-12-23 | 1999 (1998년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 20 | **한국전력** | `KR_015760` | 015760 | 유틸리티/에너지 | 1989-08-10 | 1990 (1989년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 21 | **현대모비스** | `KR_012330` | 012330 | 자동차 부품 | 1989-09-05 | 1990 (1989년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 22 | **대한항공** | `KR_003490` | 003490 | 운송/항공 | 1969-02-28 | 1981 (1980년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 23 | **S-Oil** | `KR_010950` | 010950 | 에너지/정유 | 1987-05-27 | 1988 (1987년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 24 | **유한양행** | `KR_000100` | 000100 | 제약/헬스케어 | 1962-11-01 | 1981 (1980년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |
| 25 | **농심** | `KR_004370` | 004370 | 음식료/소비재 | 1976-06-30 | 1981 (1980년말 기준) | ADJUSTED_PRICE | KRX / Yahoo Finance |

### 2.2 미국 주식 (25개)

| # | 종목명 | 표준 ID | 티커 | 업종 | 상장일 | 최초 투자 가능 연도 (firstValidYear) | 데이터 품질 | 원본 출처 |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | **Apple** | `US_AAPL` | AAPL | 빅테크/IT | 1980-12-12 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / SEC |
| 2 | **Microsoft** | `US_MSFT` | MSFT | 빅테크/SW | 1986-03-13 | 1987 (1986년말 기준) | TOTAL_RETURN | Yahoo Finance / SEC |
| 3 | **IBM** | `US_IBM` | IBM | IT/엔터프라이즈 | 1911-06-16 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 4 | **Intel** | `US_INTC` | INTC | 반도체 | 1971-10-13 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 5 | **NVIDIA** | `US_NVDA` | NVDA | 반도체/AI | 1999-01-22 | 2000 (1999년말 기준) | TOTAL_RETURN | Yahoo Finance / SEC |
| 6 | **Amazon** | `US_AMZN` | AMZN | 빅테크/커머스/클라우드 | 1997-05-15 | 1998 (1997년말 기준) | TOTAL_RETURN | Yahoo Finance / SEC |
| 7 | **Alphabet Class A** | `US_GOOGL` | GOOGL | 빅테크/인터넷 | 2004-08-19 | 2005 (2004년말 기준) | TOTAL_RETURN | Yahoo Finance / SEC |
| 8 | **Meta Platforms** | `US_META` | META | 빅테크/소셜미디어 | 2012-05-18 | 2013 (2012년말 기준) | TOTAL_RETURN | Yahoo Finance / SEC |
| 9 | **Tesla** | `US_TSLA` | TSLA | 전기차/모빌리티/AI | 2010-06-29 | 2011 (2010년말 기준) | TOTAL_RETURN | Yahoo Finance / SEC |
| 10 | **JPMorgan Chase** | `US_JPM` | JPM | 금융/투자은행 | 1969-03-05 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 11 | **Bank of America** | `US_BAC` | BAC | 금융/상업은행 | 1973-01-02 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 12 | **Berkshire Hathaway B** | `US_BRK_B` | BRK.B | 복합기업/투자 | 1996-05-08 | 1997 (1996년말 기준) | ADJUSTED_PRICE | Yahoo Finance |
| 13 | **Johnson & Johnson** | `US_JNJ` | JNJ | 헬스케어/제약 | 1944-09-25 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 14 | **UnitedHealth Group** | `US_UNH` | UNH | 헬스케어/의료보험 | 1984-10-15 | 1985 (1984년말 기준) | TOTAL_RETURN | Yahoo Finance / SEC |
| 15 | **Exxon Mobil** | `US_XOM` | XOM | 에너지/오일가스 | 1928-01-03 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 16 | **Chevron** | `US_CVX` | CVX | 에너지/오일가스 | 1921-06-23 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 17 | **Coca-Cola** | `US_KO` | KO | 필수소비재/음료 | 1919-09-05 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 18 | **PepsiCo** | `US_PEP` | PEP | 필수소비재/식음료 | 1919-12-18 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 19 | **Procter & Gamble** | `US_PG` | PG | 필수소비재/생활용품 | 1891-03-01 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 20 | **Walmart** | `US_WMT` | WMT | 필수소비재/유통 | 1970-10-01 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 21 | **Home Depot** | `US_HD` | HD | 임의소비재/주택개선 | 1981-09-22 | 1982 (1981년말 기준) | TOTAL_RETURN | Yahoo Finance / SEC |
| 22 | **McDonald's** | `US_MCD` | MCD | 소비재/프랜차이즈 | 1965-04-21 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 23 | **Walt Disney** | `US_DIS` | DIS | 미디어/엔터테인먼트 | 1957-11-12 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 24 | **Caterpillar** | `US_CAT` | CAT | 산업재/중장비 | 1929-12-02 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / CRSP |
| 25 | **Nike** | `US_NKE` | NKE | 임의소비재/스포츠웨어 | 1980-12-02 | 1981 (1980년말 기준) | TOTAL_RETURN | Yahoo Finance / SEC |

---

## 3. 대표 벤치마크 및 환율 데이터 감사

### 3.1 벤치마크 구성
1. **한국 코스피 지수 (KOSPI Composite Index)**
   - 출처: 한국거래소(KRX) 공식 시세 DB
   - 기준: 1980.01.04 = 100.00 (1980년말 106.87p ~ 2025년말 2,580.50p)
   - 성격: 가격지수 (Price Index, 배당 미포함 명시)
2. **미국 S&P 500 원화 환산 지수 (S&P 500 KRW Adjusted)**
   - 출처: S&P Dow Jones Indices / Yahoo Finance (^GSPC)
   - 계산: $R_{KRW, t} = (1 + R_{USD, t}) \times \frac{FX_t}{FX_{t-1}} - 1$
3. **50:50 한국/미국 혼합 리밸런싱 지수 (50:50 Blend Portfolio)**
   - 계산: 연 1회 코스피 50% + S&P 500(원화) 50% 동일가중 리밸런싱

### 3.2 환율(USD/KRW) 역사적 데이터
- 출처: 한국은행 경제통계시스템(ECOS) 및 미 연방준비은행 FRED
- 주요 변곡점 검증:
  - 1980년말: 659.90원
  - 1986년말: 861.40원 (플라자 합의 후 원화 절상 시작)
  - 1997년말: 1,695.00원 (IMF 외환위기 환율 폭등)
  - 2008년말: 1,259.50원 (글로벌 금융위기)
  - 2024년말: 1,472.50원 (글로벌 강달러)
  - 2025년말: 1,438.20원

---

## 4. 데이터 원칙 및 결측치 처리 규칙

1. **상장 전 종목 선택 원천 차단**: 상장일 이전 연도에는 주문 및 자동투자 매수가 완전히 비활성화되며 `상장 전 (Pre-IPO)` 배지가 표시됩니다.
2. **0% 보간 금지**: 결측치나 상장 전 데이터를 임의로 0% 수익률로 채우지 않으며 명확한 `null`로 상태를 관리합니다.
3. **가상 주가 생성 금지**: 어떤 경우에도 시뮬레이션용 가짜 난수 가격을 생성하지 않습니다.
4. **생존자 편향 및 미래지식 편향 고지**: 현재 시점의 50개 대표 종목을 과거 1980년대에 미리 알고 선택하는 구조이므로, 객관적인 과거 백테스트가 아닌 금융교육용 시뮬레이션임을 설정 화면과 결과 보고서에 명확히 표기합니다.
5. **사전 정보 누출 차단**: 당해 연도 투자 완료 전까지 해당 연도의 실제 수익률 및 역사적 시장 브리핑을 은폐합니다.
