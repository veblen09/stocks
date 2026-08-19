# UI Redesign & Audio-Tactile Overhaul Notes
(머니트랙: 45년 한·미 주식투자 실험실 UI/UX 전면 개편 분석서)

---

## 1. 개요 및 개편 목적
- **기존 문제점**:
  - `bg-slate-950`, `bg-slate-900` 등 어두운 다크 테마 위주로 구성되어 장시간 학습/투자 시 눈의 피로도 증가.
  - 9px~10px의 작은 폰트, 과도한 `font-black` 사용으로 정보 위계가 약화되고 가독성 저하.
  - 평평한 카드 형태의 타일로 인해 조작 피드백 및 촉각적/음향적 반응성 부족.
- **새로운 3대 핵심 목표**:
  1. **밝고 선명한 라이트 테마 (`#f4f7fb` 베이스 + 깨끗한 흰색 서피스 + 고대비 텍스트)**
  2. **실제 기계식 키보드 키캡 형태의 입체적 종목 모자이크 데크 & 키캡 타일 (`stock-keyboard-deck` & `stock-key`)**
  3. **Web Audio API 기반 초경량·무지연 기계식 키보드 타건음 및 조작 효과음 (`UiSoundType`)**

---

## 2. 기존 컴포넌트 및 코드 분석

| 컴포넌트 | 파일 경로 | 현재 구조 및 스타일 | 개편 방향 |
| :--- | :--- | :--- | :--- |
| **종목 모자이크 데크** | `src/components/StockMosaicView.tsx` | 다크 테마 그리드, `bg-slate-900` 카드, 평면형 타일 | `stock-keyboard-deck` 입체적 키보드 본체 디자인 (그라디언트, 인셋 하이라이트/새도우) |
| **종목 키캡 타일** | `src/components/MosaicTile.tsx` | `bg-slate-900/90`, 10px 폰트, 2D 클릭 | `stock-key` 3D 키캡 (상단면, 하단 측면 깊이 `0 6px 0 var(--key-side)`, 클릭 시 `translateY(5px)` 눌림 동작) |
| **현금 키캡 타일** | `StockMosaicView.tsx` 내 Cash Card | 1열짜리 일반 카드 | `cash-key` 스페이스바처럼 2열을 차지하는 와이드 키캡, 밝은 민트/소프트 에메랄드 톤 |
| **시장/모드 필터** | `StockMosaicView.tsx` | 어두운 버튼 리스트 | `filter-key` 기능키(F1~F12) 키캡 디자인, 활성화 시 눌림(`aria-pressed="true"`) 표현 |
| **검색 & 정렬** | `StockMosaicView.tsx` | `bg-slate-950` 어두운 인풋/셀렉트 | 밝은 `#ffffff` 서피스, 선명한 `#172033` 텍스트, 깔끔한 보더 및 포커스 링 |
| **종목 상세 사이드패널** | `src/components/CompanyDetailModal.tsx` | `bg-slate-900`, 다크 7개 탭 | 밝은 화이트 사이드패널 (`bg-white`), 키캡형 탭 버튼, 14~16px 고가독성 본문 |
| **자산배분 조작부** | `CompanyDetailModal.tsx`, `OrderReviewModal.tsx` | 일반 버튼 및 슬라이더 | 키패드형 숫자/스텝 버튼 (`-10%`, `-5%`, `-1%`, `+1%`, `+5%`, `+10%`), 하단 고정 배분 요약 바 |
| **시장 브리핑/뉴스 카드** | `GamePage.tsx`, `HistoricalNewsCenterModal.tsx` | `bg-slate-950/70`, `bg-slate-900` | 밝은 화이트 카드, 날짜/출처 12px, 본문 13~14px 선명한 대비 (최소 4.5:1) |
| **연말 결과 & 보고서** | `YearEndBriefingModal.tsx`, `ReportPage.tsx` | 다크 차트 및 어두운 모달 | 밝은 테마 차트 (화이트 배경, 축 텍스트 12px, 선명한 라인 컬러, 패턴 병행) |
| **오디오 시스템** | `src/utils/audioManager.ts` | 4개 기본 효과음(`click`, `notification`, `success`, `error`) | 12개 세부 `UiSoundType` 확장 (`keyTap`, `tileOpen`, `filter`, `tab`, `allocationUp`, `allocationDown` 등) 및 기계식 타건 합성음 |

---

## 3. 투자 계산 로직과 UI 코드의 명확한 분리 확인

- **절대 불변 엔진 로직 (Data & Math Core)**:
  - `src/engine/returnEngine.ts`: 실제 1980~2025 주가 및 연도별 수익률, 통계 계산
  - `src/engine/universeEngine.ts`: 동적 상장/비상장 필터 (`firstTradingDate <= targetDate`), 무유출 원칙
  - `src/engine/portfolioEngine.ts`: 자산 가치, 현금, 비중, 거래 체결
  - `src/engine/metricsEngine.ts`: TWR, IRR, MDD, 샤프지수, 벤치마크 비교
  - `src/engine/newsEngine.ts`: 기준일 컷오프 기반 역사적 뉴스 검색
  - `src/engine/autoInvestEngine.ts`: 자동투자 규칙 시뮬레이션
- **개편 대상 UI & Presentation Layer**:
  - `src/index.css`, `src/styles/keycaps.css`, `src/styles/theme.css`: 라이트 테마 토큰 및 3D 키캡 CSS
  - `src/components/`, `src/pages/`: 전면 라이트 테마 스타일 및 키캡 인터랙션 적용
  - `src/utils/audioManager.ts`, `src/hooks/useUiSound.ts`: 사운드 트리거 명시적 연결 및 디바운싱

---

## 4. 디자인 시스템 토큰 및 가독성 기준

### A. 테마 토큰
```css
:root {
  --app-bg: #f4f7fb;
  --app-bg-accent: #eaf0f8;
  --surface: #ffffff;
  --surface-soft: #f8fafc;
  --surface-muted: #edf2f7;

  --text-primary: #172033;
  --text-secondary: #526078;
  --text-muted: #738096;

  --border: #d5deea;
  --border-strong: #b9c6d6;

  --primary: #3563e9;
  --primary-hover: #2853cf;
  --primary-soft: #e9efff;

  --kr-market: #2563eb;
  --kr-market-soft: #e8f1ff;

  --us-market: #7c3aed;
  --us-market-soft: #f1eafe;

  --positive: #087f5b;
  --positive-soft: #e7f7f0;

  --negative: #b93848;
  --negative-soft: #fdecef;

  --warning: #b56a08;
  --warning-soft: #fff4dc;

  --key-top: #ffffff;
  --key-bottom: #e8edf4;
  --key-side: #b9c5d4;
  --key-border: #c8d2df;
}
```

### B. 가독성 및 타이포그래피 규칙
- **기본 본문**: 14~16px (`font-normal` / `font-medium`)
- **설명/보조 텍스트**: 최소 13px (`text-slate-600`)
- **종목명**: 15~17px (`font-bold text-slate-900`)
- **주요 숫자/금액**: 18~24px (`font-bold font-mono text-slate-900`)
- **배지/태그**: 최소 11px
- **대비율**: 일반 본문 최소 4.5:1 이상 보장 (WCAG 2.1 AA 기준 준수)

---

## 5. Web Audio 효과음 체계 (`UiSoundType`)

| 효과음 타입 | 합성 방식 (Synthesizer) | 트리거 이벤트 |
| :--- | :--- | :--- |
| `keyTap` | 40ms 고음 클릭(1.2kHz sine) + 노이즈 버스트(스위치 클릭) | 종목 키캡 클릭, 일반 버튼 클릭 |
| `tileOpen` | 60ms 듀얼 톤(800Hz -> 1400Hz) 스위치 사운드 | 종목 상세 패널 열기, 뉴스 열기 |
| `filter` | 35ms 탭 사운드 (600Hz triangle) | 시장 필터, 정렬, 보기 모드 변경 |
| `tab` | 30ms 소프트 틱 사운드 (900Hz) | 상세 패널 내부 탭 전환 |
| `allocationUp` | 45ms 상승 클릭 (700Hz -> 1050Hz) | `+1%`, `+5%`, `+10%` 배분 증가 |
| `allocationDown`| 45ms 하강 클릭 (950Hz -> 650Hz) | `-1%`, `-5%`, `-10%`, 배분 취소 |
| `modalOpen` | 70ms 화음 오프닝 차임 | 모달 열기 |
| `modalClose` | 50ms 소프트 닫힘음 | 모달 닫기 |
| `confirm` | 80ms 2화음 확인음 | 주문 검토 버튼, 자동투자 적용 |
| `success` | 120ms 메이저 트라이어드 상승 화음 | 주문 체결 완료, 1년 진행 완료 |
| `error` | 90ms 소프트 하강 2음 | 100% 초과, 현금 부족 등 오류 |
