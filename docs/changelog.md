# CHANGELOG

의미 있는 변경 사항을 "날짜 — 무엇을 바꿨는지" 형식으로 최신순으로 기록한다.

## 2026-07-07 — 로그인 진입 UX: 안내 바텀시트

- 헤더 "로그인" 클릭이 곧바로 구글로 리다이렉트되던 것을, 먼저 **안내 바텀시트**(`components/LoginSheet.tsx` 신설)를 여는 방식으로 바꿨다. 시트 안의 "Google로 계속하기"를 눌렀을 때만 `signIn('google')`이 실행된다.
- 시트 구성: 💰 브랜드 + 헤드라인("로그인하고 어디서나 이어보기") + 안내 문구 + Google 공식 스타일 버튼 + "나중에 하기"(hover 시 밑줄, 배경 없음) + 약관 문구. 스크림·Esc·바깥클릭·X로 닫힌다. 색은 전부 디자인 토큰, 앱 콘텐츠 폭(480/600) 중앙 정렬.
- `HeaderAuth`는 비로그인 시 로그인 버튼이 `signIn` 직접 호출 대신 `sheetOpen` 상태로 시트를 열도록 변경. 게이팅 정책 B(로그인 선택)에 맞춰 "로그인 안 해도 그대로 사용"을 시트에서 안내한다.

## 2026-07-07 — Vite → Next.js 마이그레이션 (Phase 1~7)

`feat/migrate-to-nextjs` 브랜치에서 진행. 전환 전 상태는 `v0.1-vite-final` 태그로 백업. 상세 체크리스트는 `docs/migration-plan.md`, 결정 배경은 `docs/decisions.md` 참조. (main 브랜치는 아직 Vite 유지 — Phase 8~9 후 머지 예정.)

- **Phase 1 골격**: Vite → Next.js 16(App Router, Turbopack, `src/`) 전환. `@tailwindcss/vite` → `@tailwindcss/postcss`. 의존성(recharts·date-fns·uuid·pretendard-gov) 이관.
- **Phase 2 스타일**: `src/styles/tokens.css`·`index.css` 그대로 이관, `app/layout.tsx`에서 글로벌 CSS import, Pretendard GOV 폰트 명시 적용.
- **Phase 3 코드 이관**: types·utils·hooks·constants·components 이관, 상태/이벤트 컴포넌트와 `LedgerContext`에 `'use client'` 경계 지정, `@/` 경로 alias 반영.
- **Phase 4 라우팅**: `App.tsx` 탭 state 라우팅 → `app/` 파일 라우팅(`/`, `/transactions`, `/budget`). 하단 탭은 `next/link`+`usePathname`. 공통 셸을 `app/AppShell.tsx`(헤더+탭바+Provider)로 분리.
- **Phase 5 배포**: Vercel 자동 빌드·Next.js 프리셋 자동 감지·프리뷰 동작 확인.
- **Phase 6 DB**: Vercel(Neon) Postgres + Prisma 7 도입. 스키마에 User/Account/Session/VerificationToken(NextAuth) + Transaction/Category/Budget(각 `userId` 포함) 정의 후 마이그레이션 실행. `prisma-client` 제너레이터(`src/generated/prisma`, gitignore), PrismaPg 드라이버 어댑터, 풀링(`DATABASE_URL`)/논풀링(`DATABASE_URL_UNPOOLED`) URL 분리.
- **Phase 7 인증**: Auth.js v5(NextAuth) + `@auth/prisma-adapter`, DB 세션 전략. `lib/auth.ts` 중앙 설정, `app/api/auth/[...nextauth]/route.ts`, `AuthProvider`(SessionProvider 경계), `HeaderAuth`(로그인/아바타/로그아웃). Google OAuth 연동, 로컬·Vercel 프리뷰 로그인 동작 확인.
- **아직 안 함**: Phase 8(localStorage → 서버 API 저장소 교체), Phase 9(로딩/에러 처리·`CLAUDE.md`/`design-system.md` 갱신).

## 2026-07-06 — 헤더 로그인 버튼 + 콘텐츠 폭 480px + 하단 탭바 full-width

- **콘텐츠 폭 규칙 변경**: 모바일 상한을 `360px` → `480px`로 넓혔다(`App.tsx`의 `CONTENT`, PC는 600px 유지). 헤더·본문·탭바에 공통 적용되는 전역 규칙이라 `design-system.md` Layout 섹션도 480/600으로 갱신(뒤집혀 있던 서술도 정정).
- **헤더 개편**: 좌측 로고 유지, 우측에 **로그인 버튼** 추가(`justify-between`, 토큰만 사용). 로그인 기능 자체는 요구사항 미정이라 지금은 **버튼 UI만** 두고 동작은 없다(tasks.md "대기 중").
- **하단 탭바 full-width화**: 좌우·하단 여백을 두고 떠 있던 카드형(`rounded-2xl`·`shadow-lg`)을 화면 하단에 밀착하는 **완전 사각 + 상단 보더(`border-t`)** 고정바로 변경. 버튼 행은 콘텐츠 폭 중앙 정렬을 유지하고, 본문 하단 여백(`pb-20`)과 탭바에 `env(safe-area-inset-bottom)` 안전영역 패딩을 적용해 겹침을 방지했다.

## 2026-07-06 — 지출 결제수단·신용카드 할부 + 대시보드 카드 청구 예정

- **지출 결제수단(현금/체크/신용) 추가**: `Transaction.method?`(선택적), `constants/paymentMethods.ts`(옵션·뱃지·기본값=현금). 입력 폼은 지출일 때만 세그먼트 노출, 거래 목록에 뱃지 표시. 신용카드 강조용 `--credit` 토큰을 `tokens.css`에 추가(하드코딩 없이 토큰만).
- **신용카드 할부(일시불~24개월)**: `Transaction.installmentMonths?`, `constants/installments.ts`(옵션 목록 + 원금 균등분할 `installmentAmount`, 나머지는 1회차에 몰아 합계 일치). 신용카드일 때만 할부 드롭다운 노출, 매달 청구액 미리보기.
- **대시보드 카드 청구 예정 카드(`CreditBillingCard`) 신설**: 이번 달 실제 청구액을 집계한다. 다른 달에 산 할부도 이번 달 회차분(예: `3/7`)만 합산하고, 항목별로 회차/일시불 뱃지와 **메모**를 함께 보여 어떤 지출인지 구분한다.
- **`useStatistics` 확장**: `creditCardTotal`(구매월 기준 신용카드 합계), `creditBillingTotal`·`creditBillingItems`(청구월 기준). `MonthlySpendingCard`는 소비금액을 현금·체크 / 신용카드로 분해 표시.
- **콘텐츠 폭 규칙 정정**: 기존 `max-w-5xl`(1024px)/뒤집혀 있던 규칙을 **모바일 360px / PC(≥768px) 600px**로 바로잡아 `App.tsx` 헤더·본문·하단 탭바에 공통 적용.
- **거래 페이지**: 상단 그래프 2개(카테고리·추이) 임시 숨김, 좁은 폭에서 목록 레이아웃 정리(카테고리명 말줄임, 금액·버튼 세로 스택). **금액 입력에 천단위 콤마 표시**(저장은 숫자만, 표시는 콤마).

## 2026-07-03 — 카테고리 추가/수정/삭제 기능 (예산 페이지)

- 카테고리를 상수에서 **편집 가능한 영속 상태로 승격**했다. `repository`에 `getCategories/saveCategories`(키 `bankapp.categories`, 최초 실행 시 `DEFAULT_CATEGORIES`로 시드), `LedgerContext`에 `ADD/UPDATE/DELETE_CATEGORY` 액션과 저장 구독을 추가했다.
- 정적 `getCategory/categoriesByType`를 제거하고 **`hooks/useCategories`**(all·byType·byId·nextColor·CRUD)로 일원화했다. 소비처(`FilterBar`·`TransactionForm`·`TransactionList`·`BudgetPanel`·`useStatistics`)를 모두 이 훅 기반으로 교체했다.
- **예산 페이지 UI 개편**: "카테고리별 예산" 제목 오른쪽 **＋ 버튼**으로 카테고리 추가, 각 행 오른쪽 **톱니바퀴 버튼**으로 수정/삭제. 기존 인라인 예산 입력칸은 제거하고 사용률 막대/퍼센트만 표시한다.
- **카테고리 모달**(`CategoryModal`): 헤더(닫기·제목·완료) + 이름 + 색상 + 이 달 예산. 색상은 **프리셋 팔레트 스와치 + 자유 색상 선택기(`input[type=color]`)** 둘 다 제공. 수정 모드에는 삭제 버튼.
- **삭제 정합성**: 카테고리를 지우면 그 카테고리의 예산도 함께 삭제하고, 이미 기록된 거래는 남겨 ‘미분류/알 수 없음’으로 표시한다. 지출 카테고리가 1개뿐이면 삭제를 막는다.

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
