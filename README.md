# claude-bank-app (가계부)

개인용 가계부 웹앱. 수입/지출을 기록하고 카테고리·월별로 통계를 보며 예산을 관리한다.
서버·로그인 없이 브라우저에서 바로 동작하며, 데이터는 브라우저 localStorage에 저장된다.

## 주요 기능

- **거래 관리** — 수입/지출 추가·수정·삭제 (날짜, 카테고리, 금액, 메모)
- **대시보드** — 월별 수입/지출/잔액 요약, 카테고리별 지출 파이 차트, 월별 추이 막대 차트
- **예산** — 카테고리별 월 예산 설정, 사용률 80%(주의)·100%(초과) 경고
- **필터** — 기간·구분·카테고리·금액·메모로 거래 조회
- **영속화** — localStorage 자동 저장 (새로고침해도 유지)

## 기술 스택

- React + Vite + TypeScript
- Tailwind CSS v4 (`src/styles/`의 디자인 토큰 기반)
- Recharts (차트), date-fns (날짜), uuid

## 실행

```bash
npm install
npm run dev     # 개발 서버 (http://localhost:5173)
npm run build   # 타입 체크 + 프로덕션 빌드
npm run lint    # oxlint
```

## 구조 개요

```
src/
├─ context/    # 전역 상태 (LedgerContext, useReducer)
├─ storage/    # localStorage 접근 계층 (repository)
├─ hooks/      # 조회·집계 로직 (useTransactions, useStatistics)
├─ components/ # UI 컴포넌트
├─ pages/      # 대시보드 / 거래 / 예산 페이지
└─ styles/     # Tailwind 진입 CSS + 디자인 토큰
```

프로젝트 규칙과 설계 배경은 [`CLAUDE.md`](CLAUDE.md), [`docs/`](docs/)(changelog · decisions · style-tokens) 참조.
