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

## Phase 0. 준비 ✅

- [x] 현재 상태를 백업 포인트로 커밋/태그 (`v0.1-vite-final`)
- [x] 마이그레이션용 브랜치 생성 (`feat/migrate-to-nextjs`)
- [x] Next.js 버전은 최신 안정(App Router 기준)으로 결정 → Next.js 16

## Phase 1. Next.js 프로젝트 골격 ✅

- [x] Next.js 프로젝트 초기화 (TypeScript, Tailwind, App Router, `src/` 폴더 옵션 선택)
- [x] 기존 `package.json`의 의존성 이관
  - `recharts`, `date-fns`, `uuid`, `pretendard-gov` 등
- [x] `@tailwindcss/vite` 제거, `@tailwindcss/postcss`로 교체

## Phase 2. 스타일 시스템 이관 ✅

- [x] `src/styles/tokens.css`, `src/styles/index.css` 그대로 이관
- [x] `app/layout.tsx`에서 글로벌 CSS import
- [x] Pretendard GOV 폰트 로딩 방식 확인 → 기존 CSS import 유지 + `font-sans` 명시 적용
- [x] `@theme`의 `--content-width-base`, `--content-width-md` 등 그대로 유지

## Phase 3. 코드 이관 (컴포넌트/훅/유틸) ✅

- [x] `src/types/`, `src/utils/`, `src/hooks/`, `src/constants/` → 그대로 복사
  - 경로 alias(`@/`) 설정 반영
- [x] `src/components/` → 그대로 이관
  - 상태/이벤트 쓰는 컴포넌트 상단에 `'use client'` 지시자 추가
- [x] `LedgerContext`도 클라이언트 컴포넌트로 (`'use client'`)
- [x] `storage/repository.ts`는 일단 **localStorage 구현 그대로 유지** (Phase 8에서 교체)

## Phase 4. 라우팅 전환 ✅

- [x] `App.tsx`의 탭 방식 라우팅 → Next.js `app/` 폴더 구조로

```
app/
  layout.tsx              # 헤더 + 하단 탭 + 전역 Context (Provider)
  page.tsx                # 대시보드 (기존 DashboardPage)
  transactions/
    page.tsx              # 기존 TransactionsPage
  budget/
    page.tsx              # 기존 BudgetPage
```

- [x] 하단 탭 메뉴에서 `next/link` + `usePathname()`으로 활성 상태 관리
- [x] `MonthNavigator`나 필터 등 페이지 간 공유 상태는 Context 유지

## Phase 5. Vercel 배포 확인 (여기까지가 "동작은 동일, 프레임워크만 교체") ✅

- [x] GitHub push → Vercel 자동 빌드 확인
- [x] Framework Preset이 Next.js로 자동 감지되는지 확인
- [x] 프리뷰 도메인에서 동일하게 동작하는지 확인
- [ ] 이 시점에 한 번 커밋/머지 (마이그레이션 완료 vs 백엔드 연동은 별개 단계)
  - → 머지는 Phase 8~9까지 끝낸 뒤로 미룸(main은 Vite 유지). 프리뷰 배포로 검증 중.

---

## Phase 6. DB 연동 (Vercel Postgres) ✅

- [x] Vercel(Neon) Postgres 생성
  - 연결 문자열을 로컬 `.env.local`에 복사(`DATABASE_URL` 풀링 / `DATABASE_URL_UNPOOLED` 논풀링)
- [x] ORM 선택: **Prisma** (Prisma 7 `prisma-client` 제너레이터 + PrismaPg 드라이버 어댑터)
  - 선택 이유는 `decisions.md` 2026-07-07 항목 참조
- [x] 스키마 정의 — 기존 `types/index.ts`와 매핑
  - `User` + NextAuth용 `Account` / `Session` / `VerificationToken`
  - `Transaction` (`id, type, amount, categoryId, date, memo, userId`)
  - `Category` (`id, name, type, color, userId`)
  - `Budget` (`categoryId, month, limit, userId`)
- [x] 마이그레이션 실행, DB 스키마 생성

## Phase 7. 인증 (NextAuth.js / Auth.js v5) ✅

- [x] Auth.js v5(next-auth@beta) + `@auth/prisma-adapter` 설치·세팅 (`app/api/auth/[...nextauth]/route.ts`, `lib/auth.ts` 중앙 설정, DB 세션 전략)
- [x] Provider 선택: **Google 로그인**
  - Google Cloud Console에서 OAuth Client 발급 → `AUTH_GOOGLE_ID/SECRET`
- [x] 환경변수 세팅 (Auth.js v5 이름 규칙 — `NEXTAUTH_*` 아님)
  - `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (배포 도메인은 Vercel에서 자동 감지)
- [x] Vercel Preview 환경에 위 환경변수 등록 → 재배포 (⚠️ Production 등록은 머지 전 별도로)
- [x] NextAuth의 `useSession` 훅으로 로그인 상태 관리 (`AuthProvider` = SessionProvider 경계)
- [x] 헤더의 로그인 버튼과 연결 (`HeaderAuth`)
  - 비로그인: "로그인" 버튼 → **안내 바텀시트**(`LoginSheet`) → 시트 내 버튼에서 Google 로그인
  - 로그인: 아바타/이메일 표시 + 로그아웃 옵션
- [x] 로그인 게이팅 정책 결정 → **B (비로그인 병행)**. `decisions.md` 2026-07-07 항목에 기록

## Phase 8. 저장소 교체 (localStorage → API)

**2026-07-21 완료.** 상세는 `changelog.md`의 2026-07-21 두 항목 참조.

- [x] 스키마 보강 — `RecurringRule` 모델이 아예 없어서 추가하고, `Transaction.recurringId`와
  `categoryId` nullable(`onDelete: SetNull`) 처리
- [x] `app/api/transactions/route.ts` 등 CRUD 엔드포인트 작성
  - `GET/POST/PATCH/DELETE` 각각 구현
  - 세션에서 `userId` 꺼내서 본인 데이터만 접근하도록 제한
- [x] `storage/repository.ts`를 API 호출 기반으로 교체
  - ~~기존 인터페이스를 유지하면 `LedgerContext`는 거의 안 바뀜~~ — **틀린 예상이었다.**
    기존 인터페이스는 동기 + 배열 통째로 저장이라 유지가 불가능했고, `useReducer` lazy init과
    "상태 바뀔 때마다 전체 저장" useEffect 4개에 물려 있어 `LedgerContext`는 사실상 재작성했다.
  - 실제 결과: `LedgerRepository` 인터페이스 + 구현 둘(localStorage / 서버 API), 전부 비동기.
    저장은 액션별로, 낙관적 반영 + 실패 시 `loadAll()` 재조회로 롤백.
- [x] 최초 로그인 시 로컬 데이터 → 서버 마이그레이션 로직
  - `POST /api/migrate` + `MigrationSheet` — 빈 계정일 때만, 확인받고 옮긴다. 원본은 남긴다.

## Phase 9. 마무리

- [x] 로딩/에러 상태 처리 — `LedgerContext.status` + `LedgerGate`(로딩·재시도 화면),
  저장 실패는 `ErrorToast`. 2026-07-21
- [ ] 세션 만료 처리 (만료된 채로 저장하면 401 → 토스트만 뜨고 재로그인 유도가 없다)
- [x] `CLAUDE.md` 업데이트 (Tech Stack, Directory Structure, Architecture Rules) — 2026-07-15
- [x] ~~`design-system.md`의 파일 경로 참조 갱신 (`src/styles/` → 새 위치)~~ — 불필요. `src/styles/`가
  그대로 유지돼 문서의 경로 참조가 전부 유효하다.
- [x] `decisions.md` 항목 추가 — 아래 넷 다 기록 완료
  - Next.js 전환 이유 → "2026-07 — Vite → Next.js 마이그레이션 결정"
  - ORM 선택 이유 (Prisma vs Drizzle) → "2026-07-07 — 인증·저장소 세부 결정 확정"
  - 로그인 방식 (Google) 선택 이유 → 위 같은 항목
  - 로그인 게이팅 정책 (A/B 중 선택 이유) → 위 같은 항목
- [x] `changelog.md`에 마이그레이션 요약 기록 → "2026-07-07 — Vite → Next.js 마이그레이션 (Phase 1~7)"

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
