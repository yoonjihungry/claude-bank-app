# Migration Plan: Vite → Next.js + 로그인/DB 연동

> **목표**: 브라우저 localStorage에 갇혀 있는 가계부 데이터를 서버(DB)로 옮기고,
> 로그인을 통해 여러 기기에서 동일한 데이터를 확인할 수 있게 한다.
>
> **방향**: Vite + React SPA → **Next.js (App Router) + Vercel Postgres + NextAuth.js**
>
> 배포 인프라(Vercel)는 그대로 사용. Framework Preset이 자동으로 Next.js로 감지된다.

---

## 전환하는 이유 요약

- Vite는 프론트엔드 전용이라 백엔드/DB/인증을 붙이려면 외부 서비스 여러 개 조합 필요
- Next.js는 프론트 + API + DB 연결 + 인증을 한 프로젝트에서 처리 가능
- 이미 Vercel 배포 중이고, Vercel과 Next.js는 같은 회사(Vercel) → 통합이 가장 자연스러움
- 앱 규모가 작을 때(지금)가 마이그레이션 부담이 가장 적음

---

## 최종 목표 스택

| 구분 | 현재 | 이후 |
|---|---|---|
| 프레임워크 | Vite + React | **Next.js 14+ (App Router)** |
| 스타일 | Tailwind v4 (`@tailwindcss/vite`) | Tailwind v4 (`@tailwindcss/postcss`) |
| 저장소 | localStorage | **Vercel Postgres** (Prisma or Drizzle ORM) |
| 인증 | 없음 | **NextAuth.js (Google 로그인)** |
| 배포 | Vercel | Vercel (그대로) |
| 라우팅 | `App.tsx` 내부 탭 전환 | Next.js `app/` 파일 기반 라우팅 |

---

## Phase 0. 준비

- [ ] 현재 상태를 백업 포인트로 커밋/태그 (예: `v0.1-vite-final`)
- [ ] 마이그레이션용 브랜치 생성 (`feat/migrate-to-nextjs`)
- [ ] Next.js 버전은 최신 안정(App Router 기준)으로 결정

## Phase 1. Next.js 프로젝트 골격

- [ ] Next.js 프로젝트 초기화 (TypeScript, Tailwind, App Router, `src/` 폴더 옵션 선택)
- [ ] 기존 `package.json`의 의존성 이관
  - `recharts`, `date-fns`, `uuid`, `pretendard-gov` 등
- [ ] `@tailwindcss/vite` 제거, `@tailwindcss/postcss`로 교체

## Phase 2. 스타일 시스템 이관

- [ ] `src/styles/tokens.css`, `src/styles/index.css` 그대로 이관
- [ ] `app/layout.tsx`에서 글로벌 CSS import
- [ ] Pretendard GOV 폰트 로딩 방식 확인
  - Next.js `next/font`로 대체할지, 기존 CSS import 유지할지 결정
- [ ] `@theme`의 `--content-width-base`, `--content-width-md` 등 그대로 유지

## Phase 3. 코드 이관 (컴포넌트/훅/유틸)

- [ ] `src/types/`, `src/utils/`, `src/hooks/`, `src/constants/` → 그대로 복사
  - 경로 alias(`@/`) 설정 반영
- [ ] `src/components/` → 그대로 이관
  - 상태/이벤트 쓰는 컴포넌트 상단에 `'use client'` 지시자 추가
- [ ] `LedgerContext`도 클라이언트 컴포넌트로 (`'use client'`)
- [ ] `storage/repository.ts`는 일단 **localStorage 구현 그대로 유지** (Phase 6에서 교체)

## Phase 4. 라우팅 전환

- [ ] `App.tsx`의 탭 방식 라우팅 → Next.js `app/` 폴더 구조로

```
app/
  layout.tsx              # 헤더 + 하단 탭 + 전역 Context (Provider)
  page.tsx                # 대시보드 (기존 DashboardPage)
  transactions/
    page.tsx              # 기존 TransactionsPage
  budget/
    page.tsx              # 기존 BudgetPage
```

- [ ] 하단 탭 메뉴에서 `next/link` + `usePathname()`으로 활성 상태 관리
- [ ] `MonthNavigator`나 필터 등 페이지 간 공유 상태는 Context 유지

## Phase 5. Vercel 배포 확인 (여기까지가 "동작은 동일, 프레임워크만 교체")

- [ ] GitHub push → Vercel 자동 빌드 확인
- [ ] Framework Preset이 Next.js로 자동 감지되는지 확인
- [ ] 기존 도메인에서 동일하게 동작하는지 확인
- [ ] 이 시점에 한 번 커밋/머지 (마이그레이션 완료 vs 백엔드 연동은 별개 단계)

---

## Phase 6. DB 연동 (Vercel Postgres)

- [ ] Vercel 대시보드 → Storage → Postgres 생성
  - 환경변수(`POSTGRES_URL` 등) 자동 주입 확인
  - 로컬 개발용으로 `.env.local`에 복사
- [ ] ORM 선택: **Prisma** 또는 **Drizzle**
  - 판단 기준: 러닝 커브(Prisma가 편함) vs 번들 크기/성능(Drizzle이 가벼움)
  - 개인용 프로젝트라면 **Prisma 추천**
- [ ] 스키마 정의 — 기존 `types/index.ts`와 매핑
  - `User` (NextAuth용)
  - `Transaction` (`id, type, amount, categoryId, date, memo, userId`)
  - `Category` (`id, name, type, color, userId`)
  - `Budget` (`categoryId, month, limit, userId`)
- [ ] 마이그레이션 실행, DB 스키마 생성

## Phase 7. 인증 (NextAuth.js)

- [ ] NextAuth.js 설치 및 세팅 (`app/api/auth/[...nextauth]/route.ts`)
- [ ] Provider 선택: **Google 로그인** (가장 간단, 계정 별도 관리 안 해도 됨)
  - Google Cloud Console에서 OAuth Client 발급 → `GOOGLE_CLIENT_ID/SECRET`
- [ ] 환경변수 세팅
  - `NEXTAUTH_SECRET` (터미널에서 `openssl rand -base64 32`)
  - `NEXTAUTH_URL` (배포 도메인)
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [ ] Vercel 대시보드에서 위 환경변수 등록 → 재배포
- [ ] `AuthContext` 또는 NextAuth의 `useSession` 훅으로 로그인 상태 관리
- [ ] 헤더의 로그인 버튼과 연결
  - 비로그인: "로그인" 버튼 → Google 로그인 모달
  - 로그인: 아바타/이메일 표시 + 로그아웃 옵션
- [ ] 로그인 게이팅 정책 결정
  - **후보 A**: 로그인 필수 (게이트 화면)
  - **후보 B**: 비로그인은 localStorage로 계속 쓸 수 있고, 로그인하면 서버 동기화 시작
  - 결정되면 `decisions.md`에 기록

## Phase 8. 저장소 교체 (localStorage → API)

- [ ] `app/api/transactions/route.ts` 등 CRUD 엔드포인트 작성
  - `GET/POST/PATCH/DELETE` 각각 구현
  - 세션에서 `userId` 꺼내서 본인 데이터만 접근하도록 제한
- [ ] `storage/repository.ts`를 API 호출 기반으로 교체
  - 기존 인터페이스(`getTransactions/saveTransactions/...`)를 유지하면 `LedgerContext`는 거의 안 바뀜
- [ ] 최초 로그인 시 로컬 데이터 → 서버 마이그레이션 로직 (선택)
  - "기존 데이터를 계정에 옮기시겠습니까?" 프롬프트

## Phase 9. 마무리

- [ ] 로딩/에러 상태 처리 (로그인 확인 중, API 호출 중 스피너 등)
- [ ] 로그아웃 처리, 세션 만료 처리
- [ ] `CLAUDE.md` 업데이트 (Tech Stack, Directory Structure, Architecture Rules)
- [ ] `design-system.md`의 파일 경로 참조 갱신 (`src/styles/` → 새 위치)
- [ ] `decisions.md` 항목 추가:
  - Next.js 전환 이유
  - ORM 선택 이유 (Prisma vs Drizzle)
  - 로그인 방식 (Google) 선택 이유
  - 로그인 게이팅 정책 (A/B 중 선택 이유)
- [ ] `changelog.md`에 마이그레이션 요약 기록

---

## 예상 소요 시간 (참고)

| Phase | 내용 | 예상 시간 |
|---|---|---|
| 0~5 | Vite → Next.js 전환 (기능 동일) | 2~4시간 |
| 6~7 | DB + 인증 세팅 | 3~5시간 |
| 8 | 저장소 교체 | 2~3시간 |
| 9 | 마무리·문서 | 1~2시간 |

> Claude Code로 진행하면 훨씬 단축 가능. 한 번에 다 하지 말고 Phase 단위로 커밋할 것.

---

## 진행 시 주의사항

1. **Phase 5까지는 기능 변경 없이 프레임워크만 교체**. 이 시점에서 배포·동작이 이전과 동일해야 다음 단계로 넘어감.
2. **DB 스키마 확정 전에 코드 대량 변경 금지**. 스키마가 흔들리면 API·프론트 다 다시 손봄.
3. **환경변수는 절대 커밋하지 않는다**. `.env.local`은 `.gitignore` 유지.
4. Phase가 끝날 때마다 **작은 단위로 커밋**(Conventional Commits). 롤백 지점 확보.
5. `CLAUDE.md`의 Workflow Rules(작업 지시 확인 → 커밋 확인 → 푸시 확인) 그대로 준수.
