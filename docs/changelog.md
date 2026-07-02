# CHANGELOG

의미 있는 변경 사항을 "날짜 — 무엇을 바꿨는지" 형식으로 최신순으로 기록한다.

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
