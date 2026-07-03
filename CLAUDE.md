# claude-bank-app

개인용 가계부(수입/지출 기록·통계) 웹앱. 서버·로그인 없이 브라우저에서 바로 동작하며, 나중에 백엔드/DB로 확장하기 쉬운 구조를 지향한다.

## Tech Stack
- React + Vite + TypeScript (가벼운 SPA, 최신 표준, 타입 안정성)
- localStorage 영속화 (서버 불필요, 개인용에 충분 — 추후 API 교체 가능하도록 저장소 계층 분리)
- Recharts (카테고리별 통계 시각화)
- date-fns (날짜 유틸)
- 스타일: Tailwind CSS v4 (`@tailwindcss/vite` 플러그인). CSS 파일은 `src/styles/`에 모은다 — `src/styles/index.css`(진입, `@import "tailwindcss"` + `@theme` 매핑)와 `src/styles/tokens.css`(shadcn HSL 디자인 토큰). 컴포넌트는 유틸리티 클래스로 스타일링한다.

## Dependencies
- `recharts`, `date-fns`, `uuid`
- 스타일: `tailwindcss`, `@tailwindcss/vite`

## Directory Structure
```
claude-bank-app/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ src/
   ├─ main.tsx                 # 진입점
   ├─ App.tsx                  # 레이아웃 + 라우팅(탭 전환)
   ├─ types/
   │   └─ index.ts             # Transaction, Category, Budget 타입 정의
   ├─ constants/
   │   └─ categories.ts        # 기본 카테고리 목록(식비, 교통, 급여 등)
   ├─ storage/
   │   └─ repository.ts        # localStorage 읽기/쓰기 추상화 (추후 API로 교체 지점)
   ├─ context/
   │   └─ LedgerContext.tsx    # 전역 상태(거래·예산) + reducer, CRUD 액션
   ├─ hooks/
   │   ├─ useTransactions.ts   # 거래 조회/필터 로직
   │   └─ useStatistics.ts     # 월별/카테고리별 집계 계산(useMemo)
   ├─ utils/
   │   ├─ format.ts            # 통화(원)·날짜 포맷팅
   │   └─ dateRange.ts         # 월 시작/끝, 기간 필터 헬퍼
   ├─ components/
   │   ├─ TransactionForm.tsx  # 수입/지출 입력·수정 폼
   │   ├─ TransactionList.tsx  # 거래 목록 + 삭제/수정
   │   ├─ FilterBar.tsx        # 기간·카테고리·금액 필터
   │   ├─ SummaryCards.tsx     # 총수입/총지출/잔액 요약 카드
   │   ├─ CategoryChart.tsx    # 카테고리별 파이 차트 (Recharts)
   │   ├─ MonthlyChart.tsx     # 월별 수입/지출 막대 차트 (Recharts)
   │   ├─ BudgetPanel.tsx      # 카테고리별 예산 설정 + 초과 경고
   │   └─ MonthNavigator.tsx   # 이전/다음 월 이동
   └─ pages/
       ├─ DashboardPage.tsx    # 요약 카드 + 차트 + 최근 거래
       ├─ TransactionsPage.tsx # 거래 입력·목록·필터
       └─ BudgetPage.tsx       # 예산 설정·초과 현황
```

새 파일을 추가할 때는 위 구조를 따를 것. 예: 새 재사용 컴포넌트는 `src/components/`, 새 페이지는 `src/pages/`, 새 집계 로직은 `src/hooks/`.

## Data Model (`src/types/index.ts`)
```ts
type TxType = 'income' | 'expense';

interface Transaction {
  id: string;
  type: TxType;
  amount: number;        // 원 단위 정수
  category: string;      // Category.id 참조
  date: string;          // ISO 'YYYY-MM-DD'
  memo?: string;
}

interface Category {
  id: string;
  name: string;
  type: TxType;
  color: string;         // 차트용
}

interface Budget {
  categoryId: string;
  month: string;         // 'YYYY-MM'
  limit: number;
}
```

## Architecture Rules
- **상태 관리**: 전역 상태는 `LedgerContext` + `useReducer`만 사용한다. 액션 이름: `ADD_TX / UPDATE_TX / DELETE_TX / SET_BUDGET`. 상태가 바뀌면 `repository`를 통해 localStorage에 자동 저장한다(useEffect 구독).
- **저장소 계층**: localStorage 접근은 반드시 `storage/repository.ts`를 통해서만 한다 (`getTransactions/saveTransactions/getBudgets/saveBudgets`). 컴포넌트나 훅에서 `localStorage`를 직접 호출하지 않는다 — 나중에 fetch 기반 API로 교체할 때 이 계층만 바꾸면 되도록 유지한다.
- **집계/통계 로직**: 컴포넌트 내부에서 직접 계산하지 않고, `hooks/` 아래 `useMemo` 기반 커스텀 훅으로 분리한다.

## Styling Rules
- **색상은 디자인 토큰만 사용한다**: `src/styles/tokens.css`(Source of Truth)에 정의된 토큰의 Tailwind 유틸리티(`bg-primary`, `text-income` 등)만 쓰고, HEX/`rgb()` 하드코딩이나 Tailwind 기본 팔레트(`text-red-500` 등)를 쓰지 않는다. 필요한 색이 없으면 `tokens.css`에 토큰을 먼저 추가한다.
- 타이포그래피/레이아웃/텍스트 색상 등 전체 디자인 가이드는 `docs/design-system.md` 참조.

## Commands
- `npm run dev` — 개발 서버 실행
- `npm run build` — 타입 체크 + 빌드

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
