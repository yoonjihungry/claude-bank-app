# CHANGELOG

의미 있는 변경 사항을 "날짜 — 무엇을 바꿨는지" 형식으로 최신순으로 기록한다.

## 2026-07-03 — 대시보드를 3섹션(오늘의 소비·캘린더·이번달 소비금액)으로 재구성

- 참조 이미지에 맞춰 대시보드를 3개 섹션으로 재구성했다:
  - **`TodaySpendingCard`**(섹션1) — 오늘 지출 + "어제와 비교" 증감. 월 네비게이터와 무관하게 항상 실제 오늘 기준. 서버가 없어 새로고침은 기준 시각만 갱신한다(데이터는 항상 최신).
  - **`TransactionCalendar`**(섹션2) — 월 캘린더. "출석" 표기를 없애고, 거래가 있는 날짜 아래 dot 표시(지출 `--expense`, 수입 `--income`).
  - **`MonthlySpendingCard`**(섹션3) — 이번달 지출 합계. 참조의 "주 사용 카드" 목록은 제외.
- 기존 `SummaryCards`(요약 카드)는 섹션3과 중복이라 삭제했다.
- 카테고리 파이 차트·추이 차트·최근 내역 리스트는 **거래 탭으로 이동**했다.
- 월별 막대 `MonthlyChart`를 참조 이미지4 스타일의 **`DailyTrendChart`**(일자별 순액 막대 + 누적 순액 꺾은선, `ComposedChart`)로 대체했다. 색은 `--primary` 계열(dataviz 검증: 인접 CVD ΔE 15.4 통과).
- 집계 훅 추가: `useDailySpending`(오늘/어제 지출·증감), `useMonthlyCalendar`(날짜별 수입/지출 유무). `useStatistics`는 `monthlySeries`(6개월)를 `dailyTrend`(선택 월 일자별 순액·누적)로 교체.
- 캘린더 주말색용 `--weekend-sun`/`--weekend-sat` 토큰을 `tokens.css`에 추가하고 매핑했다. 대시보드 카드용 '원' 표기 헬퍼(`formatWon`/`formatSignedWon`)를 `utils/format.ts`에 추가.
- **캘린더 날짜 클릭 → 그 날 내역 표시**: 날짜를 누르면 캘린더 아래 `SelectedDayPanel`에 해당 날짜의 수입/지출 합계와 목록(삭제 가능)이 뜬다. 같은 날짜를 다시 누르거나 '닫기'로 해제, 월 변경 시 자동 해제. `useTransactions` 필터에 `date`(정확 날짜) 옵션과 `formatDayLabel`('M월 D일 (요일)') 헬퍼를 추가했다.

## 2026-07-03 — 밝은 핀테크 비비드 팔레트로 톤 전환 (라이트 전용)

- 색 톤을 "신뢰감 있고 차분한"에서 **"밝고 친근한 핀테크"**로 전환했다. `tokens.css`의 시맨틱 색을 비비드로 교체: primary/ring `#3987e5`, income `#22b479`, expense `#ef6b63`, warning `#f5b53a`, destructive `#e05656`. 포인트 컬러는 primary(밝은 블루).
- `constants/categories.ts`의 카테고리 8색을 동일한 비비드 팔레트로 교체했다(파이·뱃지·태그에 자동 반영). dataviz 검증 통과(명도·채도·색맹 구분 ΔE 최소 24.2).
- **다크 모드는 지원하지 않기로** 확정했다(라이트 전용). 후보 팔레트 3종을 미리보기로 비교 후 A안(밝은 핀테크)을 선택, 그 비비드 색값을 라이트 배경에 적용.
- `docs/design-system.md`의 톤·토큰 HEX 표를 갱신했다.

## 2026-07-03 — Pretendard GOV 폰트 적용

- `pretendard-gov` npm 패키지를 설치해 폰트를 **번들**했다(CDN 런타임 의존 없음). `index.css`에서 dynamic-subset CSS를 import하고 `@theme`의 `--font-sans`를 `"Pretendard GOV Variable"`로 지정해 앱 전체 기본 폰트로 적용했다.

## 2026-07-03 — 디자인 문서 통합(design-system.md) 및 `--ink` 토큰 추가

- 색상 전용이던 `docs/style-tokens.md`를 삭제하고, 그 상세 토큰 사용 가이드를 `docs/design-system.md`(레이아웃/타이포그래피/색상/spacing 통합 가이드)로 흡수했다. CLAUDE.md의 Styling Rules 참조도 `design-system.md`로 변경했다.
- 따뜻한 근검정 텍스트(`#1b1b12`)를 `tokens.css`에 `--ink` 토큰(`60 20% 9%`)으로 추가하고 `index.css`에 `--color-ink`로 매핑했다(하드코딩 대신 `text-ink` 사용). "HEX 하드코딩 금지" 규칙과의 모순 해소.
- `design-system.md`의 Tailwind 설명에서 `tailwind.config` 언급을 제거했다(이 프로젝트는 Tailwind v4라 config 파일이 없고 `@theme`만 사용).

## 2026-07-02 — 디자인 토큰을 전체 컴포넌트에 적용

- 중립 토큰(`--card`, `--card-foreground`, `--muted`, `--muted-foreground`, `--input`, `--ring`)을 `tokens.css`에 추가하고 `index.css`에 매핑했다.
- 모든 컴포넌트·페이지의 하드코딩 색(`text-red-500`, `bg-blue-600`, `bg-white`, `text-gray-*` 등)을 시맨틱/중립 토큰 유틸리티(`text-expense`, `bg-primary`, `bg-card`, `text-muted-foreground` 등)로 교체했다.
- Recharts 막대 차트의 하드코딩 hex(`#22c55e`/`#ef4444`)를 `tokenColor()` 유틸로 토큰 값을 읽어 쓰도록 변경했다(색의 Source of Truth를 tokens.css로 일원화).
- `docs/style-tokens.md`에 신규 중립 토큰을 문서화했다.

## 2026-07-02 — 디자인 토큰(색상 팔레트) 도입

- shadcn HSL 컨벤션으로 `src/styles/tokens.css`에 색상 토큰을 정의했다(background, foreground, primary, income, expense, warning, destructive, border 및 각 foreground). 톤은 "신뢰감 있고 차분한 / 지출·경고는 눈에 띄게".
- `src/index.css`의 `@theme inline`에서 `hsl(var(--x))`로 매핑해 `bg-primary`·`text-income` 등 Tailwind v4 색 유틸리티를 생성했다(tailwind.config.js 대신 v4 CSS 방식).
- 팔레트는 dataviz 검증 스크립트로 확인(명도/채도/적록 색맹 구분 통과, warning 앰버는 라벨 동반 전제). 다크 모드는 `:root`만 우선 정의하고 보류.
- 아직 컴포넌트 색상에는 적용하지 않음(토큰 인프라만 준비).

## 2026-07-02 — 가계부 웹앱 초기 구현 및 탭 레이아웃 정리

- React + Vite + TypeScript 프로젝트를 스캐폴딩하고 `recharts`, `date-fns`, `uuid` 의존성을 추가했다.
- 스타일을 Tailwind CSS v4(`@tailwindcss/vite`)로 설정했다.
- 저장소 계층(`storage/repository.ts`), 전역 상태(`context/LedgerContext.tsx`), 집계 훅(`hooks/useTransactions.ts`, `hooks/useStatistics.ts`)을 작성했다.
- 거래 CRUD, 카테고리/월별 통계 차트, 월별 예산(80%/100% 경고), 필터 기능을 구현했다.
- 임시로 세로 나열돼 있던 대시보드·거래·예산 페이지를 상단 **탭 네비게이션**으로 정리하고, 헤더/배경/여백 레이아웃을 다듬었다. 미사용 Vite 데모 파일(`src/App.css`, `src/assets/`)을 삭제하고 문서 제목/언어를 `가계부`/`ko`로 변경했다.
