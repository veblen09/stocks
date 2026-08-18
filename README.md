# 머니트랙: 45년 한·미 주식투자 실험실 (1980~2025)

> **“1980년 말부터 2025년 말까지 실제 시장 데이터로 경험하는 장기 모의주식투자”**
> 
> 1980년 말 최초 투자 후 1981~2025년, 총 45회의 연간 투자 결과를 체험하는 금융경제학 및 퀀트 자산배분 시뮬레이션 웹 애플리케이션입니다.

---

## 📌 주요 특징 및 설계 원칙

1. **실제 역사적 시장 데이터 100% 기반 (No Random / No Fabricated Data)**
   - 한국 25개 우량주(KRX) + 미국 25개 대표 우량주(S&P 500/Nasdaq) = 총 50개 대표 종목 수록
   - 1980년 말부터 2025년 말까지 46개 연말 시점, 45개 연간 운용 구간의 실제 수정주가 및 배당 재투자 총수익률(Total Return) 반영
   - 한국은행(ECOS) 및 미 연준(FRED) 46개 연말 실제 USD/KRW 환율 DB 내장

2. **철저한 사후지식 편향 방지 및 Pre-IPO 보호**
   - 상장 이전(Pre-IPO) 시점의 주식은 매수가 원천 차단되며 `상장 전 (Pre-IPO)` 배지 부착
   - 종목별 과거 지표(직전 1년 수익률, 3년 CAGR, 5년 CAGR, 변동성, MDD)는 오직 당해 연도 $Y-1$ 시점까지의 데이터만 계산 (Lookahead Bias 배제)
   - 당해 연도 실제 역사적 사건(외환위기, 닷컴버블, 금융위기, 팬데믹, AI 혁명 등)은 투자 결정을 마친 후 결산 모달에서 공개

3. **정밀한 퀀트 금융 계산 엔진**
   - **TWR (시간가중수익률)**: 입출금 현금흐름 왜곡을 제거한 순수 전략 복리 운용 성과
   - **MWR / IRR (금액가중수익률)**: Newton-Raphson 방식으로 적립식 투자자의 실제 체감 내부수익률 산출
   - **환율 효과 분해**: $KRW\_Return = (1 + USD\_Return) \times \frac{FX_t}{FX_{t-1}} - 1$
   - **MDD (최대낙폭) & 연간 변동성**: TWR 복리 곡선 기준 리스크 정밀 측정
   - **3대 벤치마크 동일 현금흐름 비교**: 코스피(KOSPI), S&P 500(원화 환산), 50:50 한·미 혼합 리밸런싱 지수

4. **장기투자를 위한 5년·10년 자동투자(Auto-Invest) 엔진**
   - 연 1회 리밸런싱, 5% 이탈 시 리밸런싱, 적립금 우선 매수, 퀀트 모멘텀/저변동성 규칙 지원
   - 수동 1년 반복 진행과 자동투자 실행 결과가 수학적으로 100% 동일

5. **인터랙티브 리포트 & 교육용 기능**
   - 8대 필수 차트(자산가치 비교, 100 기준 TWR 지수, 연도별 수익률, MDD 곡선, 한·미 배분 등)
   - 5대 퀀트 투자 역량 점수(분산도, 규칙준수, 방어력, 비용효율, 알파) 및 7대 투자자 페르소나 진단
   - 45년 전체 운용 데이터 CSV 내보내기 & 원클릭 보고서 인쇄
   - 교사용 수업 모드(4가지 역사 테마 활동 프리셋 및 학생 링크 배포)
   - 단일 파일 번들(`dist/index.html` / root `index.html`) 지원

---

## 🛠️ 기술 스택

- **Frontend Framework**: React 18, TypeScript (Strict Type Safety)
- **Styling**: Tailwind CSS (Glassmorphism, Rich Micro-animations, Responsive Design)
- **Icons**: Lucide React
- **Build Tool**: Vite 6 + `vite-plugin-singlefile`
- **Testing**: Vitest + Testing Library (18개 핵심 단위 테스트 100% 통과)

---

## 🚀 실행 및 빌드 방법

### 1. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173/`으로 접속합니다.

### 2. 단위 테스트 실행
```bash
npx vitest run
```
18개 핵심 퀀트 금융 로직 단위 테스트가 실행됩니다.

### 3. 단일 파일 프로덕션 빌드
```bash
npm run build
```
빌드 완료 시 `dist/index.html` 및 루트 `index.html`에 외부 의존성 없이 즉시 열리는 독립 실행형 HTML 단일 파일이 생성됩니다.

---

## 📂 프로젝트 구조

```
├── scripts/
│   ├── fetch_market_data.py       # 원본 시장 데이터 수집기
│   ├── normalize_market_data.py   # 1980~2025 데이터 정규화 스크립트
│   └── validate_market_data.py    # 데이터 무결성 검증기
├── src/
│   ├── data/normalized/           # 정규화된 JSON 데이터셋 (stocks, prices, fx, benchmarks, events)
│   ├── engine/                    # 순수 계산 퀀트 엔진
│   │   ├── fxEngine.ts            # 환율 변환 및 환율 기여도 분해
│   │   ├── returnEngine.ts        # 주가/수익률/과거통계 (미래누출 방지)
│   │   ├── tradeEngine.ts         # 매수/매도/리밸런싱/수수료 엔진
│   │   ├── portfolioEngine.ts     # 1년 진행 시뮬레이션 및 결산 브리핑
│   │   ├── benchmarkEngine.ts     # 3대 벤치마크 동일 현금흐름 시뮬레이터
│   │   ├── autoInvestEngine.ts    # 5년/10년 자동투자 규칙 실행기
│   │   └── metricsEngine.ts       # TWR, IRR, MDD, 5대 점수 및 페르소나
│   ├── store/
│   │   └── stockGameStore.tsx     # React Context & LocalStorage v2 연동
│   ├── pages/
│   │   ├── HomePage.tsx           # 홈 화면 (이용안내, 용어사전, 출처고지)
│   │   ├── SetupPage.tsx          # 투자 환경설정 (기간, 자금, 비용, 벤치마크)
│   │   ├── GamePage.tsx           # 시뮬레이션 대시보드 (카탈로그, 매매, 자동투자)
│   │   ├── ResultPage.tsx         # 45년 최종 결과 보고서 (8대 차트, CSV, 인쇄)
│   │   └── TeacherPage.tsx        # 교사용 수업 모드 (4대 역사 테마 프리셋)
│   ├── components/                # UI 컴포넌트 & 모달
│   └── types/                     # TypeScript 데이터 모델
├── tests/
│   └── stockGame.test.ts          # 18대 핵심 기능 검증 단위 테스트
├── DATA_AUDIT.md                  # 50개 종목 출처 및 데이터 거버넌스 감사 보고서
└── MIGRATION_PLAN.md              # 45년 주식투자 전환 설계 문서
```

---

## ⚖️ 저작권 및 라이선스

- **개발 및 저작권**: Copyright 2026. 하나고등학교 일반사회 교사 김윤구 All Rights Reserved. (`veblen@hana.hs.kr`)
- **교육적 고지**: 본 프로그램은 금융교육을 위한 실제 역사 데이터 기반 모의 시뮬레이션이며, 실제 투자 권유나 자문이 아닙니다.
