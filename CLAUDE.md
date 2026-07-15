# claude-bank-app

개인용 가계부(수입/지출 기록·통계) 웹앱. 로그인 없이 브라우저에서 바로 동작하는 것을 기본으로 하되,
로그인하면 여러 기기에서 데이터를 이어 볼 수 있도록 서버/DB를 붙여 나가는 중이다.

## Tech Stack
- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- 스타일: Tailwind CSS v4 (`@tailwindcss/postcss` — `postcss.config.mjs`로 연동). CSS 파일은 `src/styles/`에 모은다 — `src/styles/index.css`(진입, `@import "tailwindcss"` + `@theme` 매핑)와 `src/styles/tokens.css`(shadcn HSL 디자인 토큰). 컴포넌트는 유틸리티 클래스로 스타일링한다.
- Recharts (카테고리별 통계 시각화)
- date-fns (날짜 유틸)
- 인증: Auth.js(NextAuth v5) + Google OAuth, DB 세션 전략
- DB: PostgreSQL(Neon) + Prisma 7 (`prisma-client` 제너레이터 + PrismaPg 드라이버 어댑터)

### 데이터 저장의 현재 상태 (중요)
**가계부 데이터(거래·예산·카테고리·반복규칙)는 아직 localStorage에 저장된다.** Prisma/Postgres는 현재
인증 테이블(User/Account/Session/VerificationToken)만 실제로 쓰고 있다. `prisma/schema.prisma`에
Transaction/Category/Budget 모델이 이미 정의돼 있지만 앱은 아직 그쪽을 읽지 않는다 —
localStorage → 서버 API 교체는 마이그레이션 Phase 8 과제로 남아 있다(`docs/migration-plan.md` 참조).

로그인 게이팅은 **정책 B(로그인 선택)** 다. 비로그인 사용자는 localStorage로 그대로 쓰고,
로그인 강제 미들웨어가 없어 auth 설정도 Node 런타임 단일 설정으로 둔다.

## Dependencies
- 도메인: `recharts`, `date-fns`, `uuid`
- 스타일: `tailwindcss`, `@tailwindcss/postcss`, `pretendard-gov`
- 인증/DB: `next-auth`(v5 beta), `@auth/prisma-adapter`, `@prisma/client`, `prisma`

## Directory Structure
```
claude-bank-app/
├─ next.config.ts
├─ postcss.config.mjs
├─ prisma.config.ts
├─ package.json
├─ tsconfig.json
├─ public/
├─ prisma/
│   ├─ schema.prisma           # User/Account/Session/VerificationToken(NextAuth) + Category/Transaction/Budget
│   └─ migrations/
├─ docs/                       # changelog · decisions · design-system · migration-plan · tasks
└─ src/
   ├─ app/                     # App Router — 라우트 세그먼트만 둔다(얇은 래퍼)
   │   ├─ layout.tsx           # 루트 레이아웃(글로벌 CSS import, AuthProvider, AppShell)
   │   ├─ AppShell.tsx         # 공통 셸(헤더+하단 탭바+LedgerProvider)
   │   ├─ page.tsx             # '/'             → screens/DashboardPage
   │   ├─ transactions/page.tsx# '/transactions' → screens/TransactionsPage
   │   ├─ budget/page.tsx      # '/budget'       → screens/BudgetPage
   │   └─ api/auth/[...nextauth]/route.ts
   ├─ screens/                 # 화면 본체(예전 pages/). app/의 page.tsx가 이걸 렌더한다
   │   ├─ DashboardPage.tsx    # 오늘의 소비 + 캘린더 + 이번달 소비금액 (3섹션)
   │   ├─ TransactionsPage.tsx # 카테고리/추이 차트 + 거래 입력·목록·필터
   │   └─ BudgetPage.tsx       # 카테고리 추가·수정 + 예산 설정 + 고정거래 관리
   ├─ lib/
   │   ├─ auth.ts              # NextAuth 중앙 설정(handlers/auth/signIn/signOut)
   │   └─ prisma.ts            # PrismaClient 싱글턴
   ├─ generated/prisma/        # Prisma 생성물 — gitignore. 직접 수정 금지
   ├─ types/
   │   ├─ index.ts             # TxType, PaymentMethod, Transaction, RecurringRule, Category, Budget
   │   └─ next-auth.d.ts       # Session.user.id 타입 확장
   ├─ constants/
   │   ├─ categories.ts        # 기본 카테고리 시드 + 프리셋 색 팔레트(CATEGORY_PALETTE)
   │   ├─ paymentMethods.ts    # 결제수단 옵션·뱃지·기본값
   │   └─ installments.ts      # 할부 개월 옵션 + 회차 금액 계산
   ├─ storage/
   │   └─ repository.ts        # localStorage 읽기/쓰기 추상화 (추후 API로 교체 지점)
   ├─ context/
   │   └─ LedgerContext.tsx    # 전역 상태(거래·예산·카테고리·반복규칙) + reducer, CRUD 액션
   ├─ hooks/
   │   ├─ useTransactions.ts   # 거래 조회/필터 로직
   │   ├─ useCategories.ts     # 카테고리 조회/편집(all·byType·byId·nextColor·CRUD)
   │   ├─ useRecurring.ts      # 반복(고정) 규칙 조회/CRUD
   │   ├─ useStatistics.ts     # 월별/카테고리별 집계 + 신용카드 청구 집계(useMemo)
   │   ├─ useDailySpending.ts  # 오늘/어제 지출·증감
   │   └─ useMonthlyCalendar.ts# 날짜별 수입/지출 유무
   ├─ utils/
   │   ├─ format.ts            # 통화(원)·날짜 포맷팅
   │   ├─ dateRange.ts         # 월 시작/끝, 기간 필터 헬퍼
   │   ├─ color.ts             # HSV↔RGB↔HEX 변환(커스텀 색상 선택기용)
   │   └─ tokenColor.ts        # 디자인 토큰 → 실제 색 해석(차트 등 JS에서 색이 필요할 때)
   ├─ components/
   │   ├─ AuthProvider.tsx         # SessionProvider 클라이언트 경계
   │   ├─ HeaderAuth.tsx           # 헤더 로그인/아바타/로그아웃
   │   ├─ LoginSheet.tsx           # 로그인 안내 바텀시트
   │   ├─ TransactionForm.tsx      # 수입/지출 입력·수정 폼(결제수단·할부·매달 반복 포함)
   │   ├─ TransactionList.tsx      # 거래 목록 + 삭제/수정
   │   ├─ FilterBar.tsx            # 기간·카테고리·금액 필터
   │   ├─ TodaySpendingCard.tsx    # 오늘의 소비 + 어제 대비(대시보드 섹션1)
   │   ├─ TransactionCalendar.tsx  # 월 캘린더 + 날짜별 수입/지출 dot(섹션2)
   │   ├─ SelectedDayPanel.tsx     # 캘린더에서 클릭한 날짜의 내역 목록
   │   ├─ MonthlySpendingCard.tsx  # 이번달 소비금액 카드(섹션3)
   │   ├─ CreditBillingCard.tsx    # 이번 달 카드 청구 예정(청구월 기준)
   │   ├─ CategoryChart.tsx        # 카테고리별 파이 차트 (Recharts)
   │   ├─ DailyTrendChart.tsx      # 일자별 순액 막대+누적선 (Recharts, --primary)
   │   ├─ BudgetPanel.tsx          # 카테고리별 예산 사용 현황 + 수정(톱니바퀴)
   │   ├─ CategoryModal.tsx        # 카테고리 추가/수정(이름·색상·예산) 모달
   │   ├─ RecurringPanel.tsx       # 고정거래 관리(접힘 섹션)
   │   ├─ RecurringModal.tsx       # 고정거래 규칙 추가/수정 모달
   │   └─ MonthNavigator.tsx       # 이전/다음 월 이동
   └─ styles/
       ├─ index.css            # 진입 — @import "tailwindcss" + @theme 매핑
       └─ tokens.css           # 디자인 토큰(Source of Truth)
```

새 파일을 추가할 때는 위 구조를 따를 것. 예: 새 재사용 컴포넌트는 `src/components/`,
**새 화면은 `src/screens/`에 만들고 `src/app/<route>/page.tsx`는 그것을 렌더하는 얇은 래퍼만 둔다**,
새 집계 로직은 `src/hooks/`. import는 `@/` alias를 쓴다.

## Data Model (`src/types/index.ts`)
```ts
type TxType = 'income' | 'expense';
type PaymentMethod = 'cash' | 'check' | 'credit';  // 지출 전용

interface Transaction {
  id: string;
  type: TxType;
  amount: number;                // 원 단위 정수
  category: string;              // Category.id 참조
  date: string;                  // ISO 'YYYY-MM-DD'
  memo?: string;
  method?: PaymentMethod;        // 없으면 '미지정'
  installmentMonths?: number;    // 신용카드 전용. 2 이상이면 할부
  recurringId?: string;          // 반복 규칙이 자동 생성한 거래면 그 규칙 id
}

interface RecurringRule {        // 매월 반복되는 고정 수입/지출. 주기는 '매월'만 지원
  id: string;
  type: TxType;
  amount: number;
  category: string;
  method?: PaymentMethod;
  dayOfMonth: number;            // 1~31, 그 달에 없는 날이면 말일로 보정
  memo?: string;
  startMonth: string;            // 'YYYY-MM'부터 적용
  active: boolean;
  generatedMonths: string[];     // 이미 생성한 달 — 중복 생성 방지
}

interface Category {
  id: string;
  name: string;
  type: TxType;
  color: string;                 // 차트용
}

interface Budget {
  categoryId: string;
  month: string;                 // 'YYYY-MM'
  limit: number;
}
```
`method`·`installmentMonths`·`recurringId`는 모두 **선택적**이다 — 필드가 없는 기존 localStorage
데이터도 그대로 동작해야 하므로 필수로 바꾸지 않는다.

## Architecture Rules
- **상태 관리**: 전역 상태는 `LedgerContext` + `useReducer`만 사용한다. 액션 이름:
  `ADD_TX / UPDATE_TX / DELETE_TX / SET_BUDGET / ADD_CATEGORY / UPDATE_CATEGORY / DELETE_CATEGORY /
  ADD_RULE / UPDATE_RULE / DELETE_RULE / RUN_RECURRING`.
  상태가 바뀌면 `repository`를 통해 localStorage에 자동 저장한다(useEffect 구독).
- **저장소 계층**: localStorage 접근은 반드시 `storage/repository.ts`를 통해서만 한다
  (`getTransactions/saveTransactions/getBudgets/saveBudgets/getCategories/saveCategories/getRecurringRules/saveRecurringRules`).
  컴포넌트나 훅에서 `localStorage`를 직접 호출하지 않는다 — Phase 8에서 fetch 기반 API로 교체할 때
  이 계층만 바꾸면 되도록 유지한다.
- **카테고리 접근**: 카테고리는 편집 가능한 영속 상태다. 컴포넌트/훅은 `constants`의 정적 목록이 아니라
  `hooks/useCategories`(`all/byType/byId/nextColor` + CRUD)를 통해 접근한다. `DEFAULT_CATEGORIES`는
  최초 시드 용도로만 쓴다.
- **집계/통계 로직**: 컴포넌트 내부에서 직접 계산하지 않고, `hooks/` 아래 `useMemo` 기반 커스텀 훅으로 분리한다.
- **반복거래 멱등성**: 자동 생성 거래의 id는 `규칙id__YYYY-MM` 결정적 값이고, 생성한 달은 규칙의
  `generatedMonths`에 기록한다. 같은 달을 두 번 만들지 않고, 사용자가 자동 생성분을 지워도 되살아나지 않는다.
- **서버/클라이언트 경계**: `src/app/`은 기본 서버 컴포넌트다. 상태·이벤트·브라우저 API를 쓰는 컴포넌트에는
  `'use client'`를 명시한다(`AppShell`, `LedgerContext`, 대부분의 `components/`·`screens/`).

## Styling Rules
- **색상은 디자인 토큰만 사용한다**: `src/styles/tokens.css`(Source of Truth)에 정의된 토큰의 Tailwind
  유틸리티(`bg-primary`, `text-income` 등)만 쓰고, HEX/`rgb()` 하드코딩이나 Tailwind 기본 팔레트
  (`text-red-500` 등)를 쓰지 않는다. 필요한 색이 없으면 `tokens.css`에 토큰을 먼저 추가한다.
- **라이트 전용**: 다크 모드는 지원하지 않기로 확정했다. 토큰은 `:root` 하나만 둔다.
- 타이포그래피/레이아웃/텍스트 색상 등 전체 디자인 가이드는 `docs/design-system.md` 참조.

## Commands
- `npm run dev` — 개발 서버 실행 (`next dev`, Turbopack)
- `npm run build` — 프로덕션 빌드 (`next build`)
- `npm start` — 빌드 결과 실행
- `npm run lint` — oxlint
- `npx tsc --noEmit` — 타입 체크만
- `npm run db:push` / `db:migrate` / `db:studio` — Prisma 스키마 반영 / 마이그레이션 / 스튜디오
- `postinstall`에서 `prisma generate`가 자동 실행된다(`src/generated/prisma`)

## Environment
- 비밀값은 `.env.local`에만 둔다. `.env`도 커밋 금지(`.env.example`만 커밋).
- 필요한 키: `DATABASE_URL`(풀링) / `DATABASE_URL_UNPOOLED`(논풀링) / `AUTH_SECRET` /
  `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`

## Docs
의미 있는 변경/결정은 아래에 누적 기록한다.
- `docs/changelog.md` — "날짜 — 무엇을 바꿨는지" 최신순. 과거 항목은 그 시점의 사실이므로 보존하고 새 항목을 얹는다.
- `docs/decisions.md` — "배경 / 대안 / 결정 이유" 최신순. 뒤집힌 결정은 지우지 말고 접은 이유를 남긴다.
- `docs/design-system.md` — 디자인 가이드
- `docs/migration-plan.md` — Vite → Next.js 마이그레이션 체크리스트(Phase 8~9 미완)
- `docs/tasks.md` — 대기 중 과제

## Workflow Rules

작업 지시를 받으면 다음 순서를 따른다.

1. **지시 확인 및 검토**
   - 요청받은 작업을 바로 시작하기 전에, 더 나은 접근 방식이 있다면
     제안하고 사용자 확인을 받는다.
   - 명백히 지시대로만 하면 되는 단순 작업은 이 단계를 생략해도 된다.

2. **작업 수행**
   - 확인된 방향대로 구현한다.

3. **커밋 여부 확인**
   - 작업이 끝나면 커밋 여부를 먼저 물어본다. 자동으로 커밋하지 않는다.

4. **브랜치 확인**
   - 커밋을 원하면, 현재 브랜치가 맞는지 확인한다.

5. **커밋**
   - 확인 후 커밋한다. 커밋 메시지는 Conventional Commits 형식
     (feat/fix/refactor/docs/style 등)을 따른다.

6. **푸시 여부 확인**
   - 커밋 후 바로 푸시하지 않는다. 푸시할지 다시 한번 확인받은 후에만 푸시한다.
