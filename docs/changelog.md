# CHANGELOG

의미 있는 변경 사항을 "날짜 — 무엇을 바꿨는지" 형식으로 최신순으로 기록한다.

## 2026-07-21 — 로그인하면 서버에 저장된다 (Phase 8-3, 8-4)

지금까지 만들어둔 API 라우트를 실제로 앱에 연결했다. **로그인 사용자의 가계부 데이터가
Postgres에 저장되고 다른 기기에서도 보인다.**

- `storage/repository.ts`를 갈아엎었다. 동기 함수 8개(`getX`/`saveX`)를 걷어내고
  `LedgerRepository` 인터페이스 + 구현 두 개(localStorage / 서버 API)로 바꿨다.
  `getRepository('local' | 'server')`로 고르며 모든 메서드가 비동기다.
- `LedgerContext`가 `useSession()`으로 로그인 여부를 보고 저장 위치를 정한다.
  로그인/로그아웃으로 위치가 바뀌면 자동으로 다시 불러온다.
- 저장 방식이 "상태 전체를 useEffect로 통째 저장"에서 **액션별 저장**으로 바뀌었다.
  화면에 먼저 반영하고 뒤에서 저장하며, 실패하면 `loadAll()`로 되돌리고 토스트를 띄운다.
- `RUN_RECURRING` 액션이 사라지고 `LOAD`·`SYNC_RECURRING`이 생겼다. 반복거래 생성 계산은
  `utils/recurring.ts` 순수 함수로 빼서 로컬 구현과 `/api/recurring/run`이 같은 규칙을 쓴다.
- 새 파일: `components/LedgerGate.tsx`(로딩·실패 화면), `components/ErrorToast.tsx`(저장 실패 알림),
  `app/api/categories/seed/route.ts`(기본 카테고리 시드).

**기본 카테고리 시드를 서버가 하는 이유**: `DEFAULT_CATEGORIES`의 id는 `'food'`처럼 고정
문자열인데 `Category.id`는 전역 PK다. 클라이언트가 그대로 POST하면 두 번째 사용자부터 충돌한다.
서버에서 cuid를 새로 발급해 계정마다 다른 id를 갖게 했다.

**아직 안 되는 것**: 로그인 전 로컬에 쌓아둔 기록은 서버로 넘어가지 않는다(Phase 8-5).
로그아웃하면 로컬 데이터가 그대로 다시 보인다 — 지워지지는 않는다.

## 2026-07-20 — 프로덕션 Google 로그인 복구 (Vercel 환경변수 누락)

**코드 변경 없음. 원인은 전부 Vercel/Google 콘솔 설정이었다.** 다만 화면만으로는 진단이 불가능했던
케이스라 과정을 남긴다.

- **로컬**: `redirect_uri_mismatch`. dev 서버 포트를 3100으로 고정한 뒤 구글 콘솔에
  `http://localhost:3100/api/auth/callback/google`을 등록하지 않아서였다. 프로덕션 쪽은
  `https://claude-bank-app-eta.vercel.app/api/auth/callback/google`.
- **프로덕션**: Auth.js의 "Server error / problem with the server configuration" 화면은 원인을
  알려주지 않는다. **Vercel 사이드바 Logs**의 `[auth][details]`에 실제 사유가 찍힌다. 여기서
  `invalid_client`(시크릿이 틀림) → 값 교체 후 한 번 성공 → 다시 `client_secret is missing`
  (시크릿이 아예 없음)으로 증상이 옮겨갔다.
- **함정**: Vercel 환경변수 목록에 `AUTH_GOOGLE_SECRET`이 **보이는데도 런타임에는 값이 없었다.**
  Sensitive 변수는 값을 되읽을 수 없어 "있어 보이는데 비어 있는" 상태가 화면상 정상과 구분되지 않는다.
  기존 항목 Edit으로는 갱신되지 않았고, **삭제 후 재생성**해야 실제로 실렸다.
- **진단 방법**: 임시 라우트 `/api/debug-env`로 런타임의 환경변수 존재 여부·길이·배포 ID를 찍어
  `present: false`를 확인하고 나서야 원인이 특정됐다(확인 후 제거). 자격증명 쌍 자체의 유효성은
  가짜 code로 구글 토큰 엔드포인트를 쳐서 판별할 수 있다 — `invalid_grant`면 정상, `invalid_client`면 불량.
- 처음에 "PC는 되는데 모바일만 안 된다"로 보였던 것도 브라우저 차이가 아니라, 시크릿이 빠진 배포를
  만난 것이었다.

## 2026-07-20 — 버튼에 손가락 커서 복구 (Tailwind v4 preflight 대응, 앱 전역)

`/desk`의 지역 펼치기 버튼에 마우스를 올려도 커서가 안 바뀐다는 지적에서 출발했는데, 원인은 그
버튼이 아니라 **Tailwind v4의 preflight가 `button`/`[role=button]`에 `cursor: default`를 주도록
바뀐 것**이었다(v3까지는 `pointer`). 전수 확인 결과 이 저장소에서 `cursor-pointer`를 명시한 곳은
`TransactionForm`의 label 하나뿐이라, **가계부 화면을 포함한 앱 전체의 모든 버튼**이 같은 상태였다.

- `src/styles/index.css`의 base 레이어에 `button:not(:disabled)`·`[role="button"]:not(:disabled)`
  → `cursor: pointer`, 비활성 버튼 → `cursor: not-allowed`를 추가했다.
- base 레이어라 개별 요소가 `cursor-default`/`cursor-grab` 유틸리티로 덮어쓴 곳
  (`LoginSheet`·`HeaderAuth`의 배경 클릭 영역, `/desk` 캐러셀 트랙)은 그대로 유지된다.
- 검증: 빌드된 `layout.css`에 규칙이 포함된 것을 응답으로 확인했다.

## 2026-07-20 — /desk 새로 등록된 데스크 카드 재배치 + 그리드 페이지 슬라이드 + 푸터 접힘

**이번 작업은 시안 노드를 읽지 못한 채 진행했다.** CLAUDE.md에 적힌 nodeId `685:1814`가 파일에서
사라졌고(프레임 "Main_on"이 `747:1195`, 360×3242로 재생성됨), 대조하려는 시점에 Figma REST API가
rate limit(429, 재시도까지 약 79시간)에 걸렸다. 그래서 **사용자가 첨부한 시안 스크린샷을 비율로
환산해 옮겼고, 그 사실을 먼저 알린 뒤 진행했다.** 아래 수치는 시안 실측값이 아니므로 API가 풀리면
`747:1195`(펼침)·`747:811`(접힘)로 다시 대조해야 한다. CLAUDE.md의 nodeId도 갱신 대상이다.

- **'새로 등록된 데스크' 카드 레이아웃**: 썸네일 104×104 정사각 → 120×146 세로형(가로 120px은
  사용자가 지정, 세로는 이미지 환산값). 이름과 좌석명을 `이름 | 좌석` 한 줄(구분선)에서 **두 줄로 분리**,
  등급 배지를 테두리형 → 채움형(BASIC 연회색 / PREMIUM 연한 오렌지), 가격 16 → 18px,
  찜/담기를 가격 우측 → **가격 아래 줄 좌측**으로 내리고 담기는 원형 테두리 안의 +로 바꿨다.
  좌석 표기도 이미지대로 `쉐어 데스크` → `쉐어룸 데스크`.
- **'어디서 일하세요?' 페이지네이션이 실제로 동작하도록**: `page` state가 `01/03` 표시에만 쓰이고
  그리드는 `GRID_DESKS` 전체를 그리고 있어 **화살표를 눌러도 숫자만 바뀌었다.** 샘플을 4건 → 12건으로
  늘리고 `GRID_PAGE_SIZE=4`로 잘라 3페이지를 한 트랙에 깐 뒤 `translateX(-(page-1)*100%)`로 민다.
  `totalPages`도 하드코딩 3 → `Math.ceil(전체/4)` 계산값. 전환은 기존 `SLIDE_TRANSITION`
  (350ms `cubic-bezier(0.22,1,0.36,1)`)을 재사용해 아티클·데스크 캐러셀과 손맛을 맞췄다.
  `px-5` 여백은 트랙이 아니라 **각 페이지가** 들고 있다 — overflow는 padding box에서 잘리므로
  바깥에 패딩을 주면 넘어가는 페이지가 좌우 여백 위로 비친다. 부수 효과로 카드가 언마운트되지 않아
  하트 상태가 페이지를 오가도 유지된다.
- **푸터를 접힘 기본으로**: 상호+화살표를 버튼(`aria-expanded`)으로 묶고 사업자 정보 블록을
  접힘 기본 → 클릭 시 펼침으로 바꿨다. 높이 전환은 `grid-rows-[0fr]↔[1fr]`(300ms)로 준다 —
  내용 높이를 JS로 재지 않아도 걸린다. 링크 줄과의 20px 간격 중 6px을 접히는 블록 안쪽
  `pb-1.5`로 넣어, 접히면 여백까지 같이 사라지고 펼치면 원래 간격이 된다.
  "개인정보 처리방침"에 밑줄 추가(같은 푸터의 "사업자정보확인"과 스타일 일치).
- **토큰 2개 추가**(`tokens.css`): `--desk-accent-soft`(#ffe6d6, PREMIUM 배지 배경) /
  `--desk-badge`(#eeeeee, BASIC 배지 배경). 필요한 색이 없으면 토큰부터 추가한다는 규칙대로 처리했다.
- **참고**: 페이지 전환 효과는 사용자가 지정한 sscore.co.kr의 Project 섹션을 참고했다. 해당 섹션은
  Swiper(`centeredSlides`, `autoplay 5s`, `loop`, `navigation`, `threshold:4`, `resistanceRatio:0.85`)로
  **슬라이드를 모두 깔아두고 트랙을 미는** 방식이다. 우리 그리드에는 이동 방식만 가져오고
  autoplay·loop·드래그는 넣지 않았다 — 훑어보는 목록이라 자동 재생이 방해된다고 판단했다.
- 검증: `tsc --noEmit`·`oxlint` 통과, 3100에서 `/desk` 200. 3페이지 12건이 모두 DOM에 깔리고
  트랙 transform/transition이 붙은 것, 푸터가 접힘으로 렌더되는 것을 응답 HTML로 확인했다.

## 2026-07-16 — dev 서버를 webpack + 포트 3100 고정으로 (로컬 실행 시 시스템 마비 대응)

로컬 서버를 띄우면 컴퓨터 전체가 느려진다는 문제를 조사하고 스크립트를 바꿨다.

- **`dev`를 `next dev --webpack -p 3100`으로**: Next 16의 기본 번들러인 Turbopack을 끈다. 되돌릴 수 있도록 `dev:turbo`(`next dev -p 3100`)를 함께 남겼다. Next 버전은 그대로다.
- **`start`도 `-p 3100`으로**: 프로덕션 빌드 로컬 실행도 포트를 고정했다. 기본값 3000은 이 머신의 다른 프로젝트 개발 서버가 점유하고 있어, 가계부가 조용히 3001로 밀리고 있었다(`localhost:3000`을 열면 다른 앱이 떴다).
- **확인된 원인 — 종료해도 안 죽는 고아 서버**: `npm run dev`를 중지하면 npm 껍데기만 죽고 `next dev` **본체가 살아남는다**. 실측으로 본체가 848MB, 자식(빌드 워커·실행기)까지 트리 합계 약 1GB를 문 채 계속 돌고 있었다. 껐다 켤 때마다 이게 하나씩 쌓여 램이 고갈된다. Next 16은 새 서버를 띄울 때 `Another next dev server is already running (PID ...)`로 이 상태를 알려주므로, 이 메시지가 뜨면 이전 서버가 안 죽은 것이다.
- **미확정 — node 프로세스 1,665개 폭주**: 초당 40~64개씩 2분 넘게 생성되고 각 프로세스 메모리가 0MB인(뜨자마자 죽는) 크래시 재시작 루프가 관측됐다. 같은 시점에 다른 명령이 `Thread failed to start`(자원 고갈)로 실패했다. Turbopack도 `filesystem cache has been deleted because we previously detected an internal error`를 남겨 내부 오류가 있었음은 확실하나, **폭주가 Turbopack 때문인지 npx로 뜨는 figma MCP의 재시작 루프 때문인지는 재현이 안 돼 가리지 못했다.** 고아 서버 여러 개가 같은 `.next`를 동시에 쓰면 캐시가 깨지고 서로의 파일 변경으로 리빌드를 유발하므로 이 경로도 후보다. webpack 전환은 1순위 용의자를 제거하는 조치이지 원인 확정이 아니다.
- 검증: webpack으로 3100에서 기동(Ready 345ms, Turbopack은 4.4s) 후 `/`·`/desk`·`/transactions`·`/budget` 네 라우트 모두 200. 가계부가 쓰는 node 프로세스는 4개(848MB 포함) → 2개로 줄었다.

## 2026-07-15 — /desk 시안 대조: 숨김 레이어로 생긴 오차 수정 (공데AI 버튼·화살표·칩 페이드)

시안에 없는 아이콘이 화면에 들어가 있다는 지적을 받고 노드를 다시 읽어 대조했다. 원인은 **시안을 안 읽은 게 아니라 숨김 레이어를 읽은 것**이었다. 최초 이식 때 노드 트리를 텍스트로 덤프해 그걸 보고 옮겼는데, 그 덤프에 `visible` 플래그가 없어 **꺼져 있는 레이어까지 실재하는 요소로 보고 그렸다.** 렌더된 시안과 한 번도 대조하지 않아 계속 남아 있었다.

- **공데AI CTA 버튼 아이콘 제거**: 덤프상 버튼(`685:1828`)에는 `Left Icon`/`Right Icon`(12x12 `#006ffd`)이 있으나 둘 다 숨김이라 시안에는 텍스트만 보인다. REST API로 같은 노드를 조회하면 숨김 노드가 걸러져 `TEXT` 하나만 나오는 것으로 확인했다. 아이콘 2개와 쓰이지 않게 된 `SparkleIcon` 정의를 지웠다.
- **화살표 방향 수정**: 시안의 arrow 벡터는 탭 확장 `10x5`, 푸터 `8x4`로 가로:세로가 2:1인 **아래쪽 chevron**이다. `ChevronRight`를 `rotate-90`으로 돌려 쓰던 것을 전용 `ChevronDown`으로 교체했다(푸터는 16px → 18px로 크기도 보정). 탭 확장은 펼침 시 `rotate-180`.
- **칩 줄 페이드**: 시안의 `Button - 탭 확장`은 `r=100` 흰 원이 칩 줄 위에 얹힌 구조라, 접힘 상태의 칩이 버튼에 닿기 전 사라져야 한다. 하드 컷을 `mask-[linear-gradient(...)]` 페이드로 바꾸고 버튼을 `absolute`로 올렸다. 펼치면 페이드를 걷고 `wrap`한다.
- **시안 출처를 저장소에 고정**: `CLAUDE.md`에 fileKey(`OjcyAOZ0bY7bFhQxGKaQig`)·nodeId(`685:1814`)와 "시안에 없는 것을 지어내지 말고, 못 옮기면 임의로 메우지 말고 먼저 알린다"는 규칙을 적었다. 임시 폴더에만 있던 노드 덤프는 `docs/desk-figma-spec.txt`로 옮겼다. **단 이 덤프에는 visible 정보가 없으므로 "화면에 보이는지"의 근거로 쓸 수 없다** — 그건 API 조회나 렌더 화면으로 확인한다.
- 검증: Playwright로 `/desk`를 띄워 접힘·펼침·푸터·CTA 네 군데를 캡처해 확인했다.

## 2026-07-15 — /desk 데스크 캐러셀도 1장씩 드래그로 + 드래그 로직 공통화 + 샘플 8+8건

- **`useOneStepDrag` 공통 훅 신설**: 아티클과 데스크 캐러셀이 같은 "한 번 끌면 딱 1장" 코드를 쓰도록 드래그 로직(포인터 핸들러·임계값 40px·오프셋 1칸 클램프)을 한곳으로 모았다. 방향(`dir`)만 넘기고 인덱스 해석은 호출측이 정한다 — 아티클은 무한 순환, 데스크는 양끝 고정으로 서로 다르기 때문. 아티클의 이동 공식과 순환 복귀 시점(`pointerdown`)은 그대로 두어 동작이 바뀌지 않게 했다.
- **`DeskCarousel`을 네이티브 스크롤 → `translateX` 드래그로**: 참고한 react-slick(`slidesToScroll: 1`, `infinite: false`)처럼 한 번에 1장만 넘어가고 양끝에서 멈춘다. 레이아웃(`px-5`·`gap-3`·`pb-1`·카드 `w-60`)은 건드리지 않고 이동 메커니즘만 교체했다. 센터 모드·무한 순환은 아티클 전용이라 적용하지 않았다.
- **마지막 칸 死구간 버그 수정**: 카드 8장이면 끝까지 1,624px인데 step은 252px이라 나눠떨어지지 않는다. 위치를 `-index*step`으로 잡고 결과만 자르면 마지막 인덱스의 계산값(−1764)과 실제 위치(−1624) 사이 **140px만큼 끌어도 안 움직이는 구간**이 생겼다. 인덱스의 확정 위치를 `min(i*step, max)`로 먼저 정하고 거기에 드래그를 얹도록 고쳤다. 마지막 칸만 112px로 짧게 이동해 마지막 카드가 오른쪽 여백 20px을 남기고 끝에 붙는다.
- **`ResizeObserver`로 실측 전환**: `window.resize`는 세로 스크롤바가 생겼다 사라질 때 오지 않아 뷰포트 폭 변화를 놓친다. 뷰포트를 직접 관찰하고, 정수로 반올림되는 `offsetLeft`/`clientWidth` 대신 `getBoundingClientRect()`로 잰다.
- **샘플 데이터 8+8건**(sharedesk.co.kr 참고): 인기 데스크 = 허브스페이스 잠실점 5 + 코워크라운지 성수점 3, 맞춤 추천 = 위코워킹 강남점 5 + 데일리워크 광화문점 3(두 섹션이 안 겹치게 분리). 좌석 표기를 `데스크 5` → `베이직석 #5`(등급+번호)로 바꿔 메인 배너의 "등급별 데스크 가이드"와 맞췄다. 주소는 원본 카드에 없어 지역에 맞게 채웠다. TOP 뱃지는 원본이 전부 붙어 있으나 비-TOP 카드 스타일도 보이도록 각 섹션 마지막 1건만 뺐다.
- **중복 key 버그 수정**: `DeskCarousel`이 `key={it.name}`을 쓰는데 같은 지점의 좌석이 여러 건이라 업체명이 반복된다. `name-desks` 조합으로 바꿨다. 기존 데이터는 업체명이 전부 달라 드러나지 않던 문제다.

## 2026-07-15 — /desk 아티클 캐러셀 재작성(1장씩 드래그) + 중앙 정렬 버그 수정

- **아티클 캐러셀을 `translateX` 드래그 방식으로 재작성**: 네이티브 스크롤(+스크롤 정지 후 JS 정렬)을 걷어냈다. **한 번 끌면 아무리 길게 끌어도 딱 1장만** 넘어간다(임계값 40px, 미만이면 제자리 복귀). 판정만 막으면 길게 끌 때 트랙이 따라갔다 되돌아와 튕기므로 드래그 오프셋 자체를 1칸으로 클램프했다. 센터 모드·무한 순환·자동 이동 없음은 그대로고, 활성 카드 확대 효과는 넣지 않았다. 그동안의 드래그 떨림은 스크롤 관성과 JS가 같은 `scrollLeft`를 두고 경합해서 생긴 것이라, 위치를 JS 단독으로 만들면서 원인이 사라졌다. 복제는 5벌 → 3벌, 무한 순환 복귀 시점은 `transitionend` → 다음 `pointerdown`(정확히 한 칸을 끌면 transform이 안 바뀌어 `transitionend`가 오지 않는다). 배경은 `docs/decisions.md` 2026-07-15 항목 참조.
- **아티클 카드가 중앙에서 미세하게 어긋나던 버그 수정**: 정렬 기준을 `offsetLeft`로 잡았는데 스크롤러부터 `<body>`까지 positioned 조상이 없어 `offsetParent`가 `<body>`가 됐고, 그 결과 프레임 `mx-auto` 좌측 여백이 계산에 섞여 창 너비에 따라 카드가 밀렸다. 재작성 과정에서 좌표계를 뷰포트 실측 기준으로 바꿔 해소했다.

## 2026-07-15 — CLAUDE.md를 Next.js 현재 구조에 맞게 갱신 (Phase 9 일부)

마이그레이션 Phase 9의 "`CLAUDE.md` 업데이트" 항목이 체크되지 않은 채 남아 있었다. 그 사이 Next.js
전환이 main에 머지(`b1334f7`)돼, CLAUDE.md만 Vite 시절 내용으로 굳어 실제 코드와 어긋나 있었다.
마지막으로 CLAUDE.md를 건드린 커밋이 `3e8b972`(카테고리 CRUD)로 마이그레이션보다 앞선다.

- **Tech Stack**: React+Vite SPA → Next.js 16(App Router, Turbopack) + React 19. `@tailwindcss/vite`
  → `@tailwindcss/postcss`. 인증(Auth.js v5 + Google)·DB(Neon Postgres + Prisma 7) 항목 신설.
- **데이터 저장의 현재 상태**를 명시했다 — 가계부 데이터는 여전히 localStorage이고, Prisma/Postgres는
  인증 테이블만 쓴다. 스키마에 Transaction/Category/Budget이 있지만 앱은 아직 읽지 않는다(Phase 8 과제).
  이걸 안 적으면 "DB 있으니 DB에서 읽겠지"로 오해하기 쉬운 지점이다.
- **Directory Structure**: `vite.config.ts`·`index.html`·`main.tsx`·`App.tsx` 제거, `app/`(라우트 래퍼)
  `screens/`(화면 본체) 분리 구조와 `lib/`·`generated/prisma`·`prisma/` 반영. 누락돼 있던 파일들
  (`constants/paymentMethods·installments`, `hooks/useRecurring·useDailySpending·useMonthlyCalendar`,
  `utils/color·tokenColor`, `components/AuthProvider·HeaderAuth·LoginSheet·CreditBillingCard·Recurring*`) 추가.
- **Data Model**: `PaymentMethod`·`RecurringRule`과 `Transaction.method/installmentMonths/recurringId` 반영.
  선택적 필드를 필수로 바꾸지 말라는 이유(기존 localStorage 데이터 호환)를 명시.
- **Architecture Rules**: reducer 액션에 `ADD/UPDATE/DELETE_RULE`·`RUN_RECURRING` 추가. 반복거래 멱등성,
  서버/클라이언트 경계(`'use client'`) 규칙 신설.
- 이 문서는 **main 기준**으로 썼다. `/desk` 데모(`BARE_ROUTES`·`--desk-*`·`screens/DeskHomePage`)는 아직
  `feat/desk-home`에만 있어 의도적으로 넣지 않았다 — 그 브랜치가 머지될 때 함께 반영한다.
- **Commands**: `next dev/build/start`, `oxlint`, `npx tsc --noEmit`, `db:push/migrate/studio`,
  `postinstall`의 `prisma generate`로 갱신. **Environment**(`.env.local` 키 목록)·**Docs** 섹션 신설.
- `docs/migration-plan.md` Phase 9 체크리스트 정리: CLAUDE.md 항목 체크. `decisions.md`·`changelog.md`
  기록 항목은 이미 작성돼 있어 체크(연결 항목 명시). `design-system.md` 경로 갱신 항목은 `src/styles/`가
  그대로라 불필요로 표시.

## 2026-07-14 — 공유데스크 데모 홈 화면(/desk) 추가 (피그마 시안 이식)

가계부 본 서비스와 별개로, 피그마 시안 "Main_on"(360×2860, 공유데스크 코워킹 서비스 모바일 홈)을 새 라우트로 이식했다. Figma MCP(framelink `figma-developer-mcp`, PAT `file_content:read`)로 노드 데이터를 읽어 레이아웃·간격·텍스트를 옮겼다.

- **독립 전체화면 라우트 `/desk`**: 시안이 자체 헤더·하단 내비·푸터를 가진 완결형이라, 공통 셸(💰가계부 헤더+탭바)을 씌우지 않는다. `AppShell`에 `BARE_ROUTES`(`/desk`) 예외를 두어 해당 경로는 전역 Context/크롬 없이 페이지만 렌더한다. 라우트 래퍼는 `src/app/desk/page.tsx`, 화면은 `src/screens/DeskHomePage.tsx`(섹션·아이콘·데이터 로컬 구성).
- **구현 섹션(9개)**: 헤더(알림벨) · 메인배너(등급별 가이드) · 검색+인기지역칩 · 지금 인기 데스크(가로 캐러셀) · 회원님 맞춤 추천(캐러셀) · 공데AI CTA · 어디서 일하세요(칩+2열 그리드+페이지네이션) · 첫 달 50% 할인 프로모 배너 · 아티클 슬라이드 01~06 · 푸터+하단 내비. 시안의 아이폰 기기 크롬(상태바 09:41·홈 인디케이터)은 웹에선 불필요해 옮기지 않았다.
- **배너 캐러셀(메인·프로모)**: 공용 `AutoCarousel` — 전환주기 5초, 이동 애니메이션 0.7초, 첫 슬라이드 복제로 무한 순환. 페이징(`1/N`)은 슬라이드마다 두지 않고 캐러셀 위 고정 오버레이 하나로 현재 인덱스를 표시한다(메인 우하단 24/20px, 프로모 우하단 10px — 시안 좌표).
- **아티클 슬라이드**: 첫 렌더부터 센터 모드(좌우 이웃이 걸쳐 보임), 마우스 드래그로만 이동하고 자동 슬라이드는 없다. CSS `snap-mandatory`는 드래그 중 카드를 강제로 당겨 떨림이 생겨 쓰지 않고, 스크롤이 멈춘 뒤 JS로 무한 루프 복귀 + 가장 가까운 카드로 부드럽게 중앙 정렬한다.
- **디자인 토큰(`--desk-*`) 신설**: 시안 팔레트가 본 앱과 달라 `tokens.css`에 별도 네임스페이스로 추가하고 `index.css`에 매핑했다(`--desk-primary` #006ffd, `--desk-accent` #eb601c, `--desk-accent-strong` #dc5714, `--desk-ink/body/muted/soft/hint/line`, `--desk-surface/on-dark`). 화면 내 색은 전부 이 토큰 유틸리티만 사용(HEX/기본 팔레트 미사용).
- **이미지는 회색 플레이스홀더**로 두었다(실제 사진은 추후 `download_figma_images`로 교체 예정).


## 2026-07-08 — 고정지출/반복거래 + 커스텀 색상 선택기

로그인/DB(Phase 8)는 미룬 채, 현재 localStorage 기반 앱에 실용 기능을 보완했다.

- **고정지출/반복거래(매월)**: `RecurringRule` 타입(카테고리·금액·결제수단·매달 며칠·시작월·활성·`generatedMonths`)과 `Transaction.recurringId?`를 추가. `repository`에 `getRecurringRules/saveRecurringRules`(키 `bankapp.recurringRules`), `LedgerContext`에 `ADD/UPDATE/DELETE_RULE`·`RUN_RECURRING` 액션과 저장 구독을 추가했다. 앱을 열 때(마운트 1회) 각 활성 규칙의 시작월~이번 달 중 미생성 달의 거래를 자동 생성한다. 거래 id를 `규칙id__YYYY-MM` 결정적 값으로 만들고 `generatedMonths`에 기록해 **중복 생성을 막고, 자동 생성분을 지워도 되살아나지 않게** 했다(멱등). 조회/CRUD는 `hooks/useRecurring`으로 일원화.
- **등록 진입은 거래 입력 폼의 '매달 반복' 체크박스**: 신규 입력에서만 노출. 체크 시 그 거래를 이번 달치로 두고(해당 월을 `generatedMonths`에 시드) 다음 달부터 자동 생성되는 규칙을 함께 만든다. 거래 목록에는 자동 생성분에 **'고정' 뱃지**를 표시.
- **관리(수정·해지)는 카테고리 페이지 하단 '고정거래 관리 (N건)' 접힘 섹션**(`RecurringPanel`/`RecurringModal`): 자주 안 건드리는 설정성 항목이라 기본 접힘. 펼치면 목록·on/off 토글·삭제 + 직접 추가. 규칙 삭제 시 이미 생성된 과거 거래는 남긴다.
- **커스텀 색상 선택기(CategoryModal)**: OS 기본 `input[type=color]` 팝업을 걷어내고 **앱 내 색상 선택기 패널**(채도/명도 박스 + 색조 슬라이더 + RGB/HEX, 우상단 ✓로 확정)로 교체했다. 고른 색은 팔레트에 **새 스와치로 추가·선택**되고, 이미 카테고리가 쓰는 색은 다음에도 스와치로 노출된다(팔레트 = 기본색 ∪ 사용 중인 색 ∪ 이번에 추가한 색). HSV↔RGB↔HEX 변환은 `utils/color.ts` 신설.

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
