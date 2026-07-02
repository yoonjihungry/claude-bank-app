# claude-bank-app

개인용 가계부(수입/지출 기록·통계) 웹앱. 서버·로그인 없이 브라우저에서 바로 동작하며, 나중에 백엔드/DB로 확장하기 쉬운 구조를 지향한다.

## Tech Stack
- React + Vite + TypeScript (가벼운 SPA, 최신 표준, 타입 안정성)
- localStorage 영속화 (서버 불필요, 개인용에 충분 — 추후 API 교체 가능하도록 저장소 계층 분리)
- Recharts (카테고리별 통계 시각화)
- date-fns (날짜 유틸)
- 스타일: Tailwind CSS v4 (`@tailwindcss/vite` 플러그인, `src/index.css`에서 `@import "tailwindcss"`). 별도 CSS 파일 없이 컴포넌트에 유틸리티 클래스로 스타일링한다.

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

## Commands
- `npm run dev` — 개발 서버 실행
- `npm run build` — 타입 체크 + 빌드
