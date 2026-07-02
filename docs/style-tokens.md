# 스타일 토큰 사용 가이드

> **Source of Truth는 [`src/styles/tokens.css`](../src/styles/tokens.css)이다.**
> 이 문서는 그 토큰들을 **어떻게 쓰는지 설명하는 사용 가이드**일 뿐이며, 값 자체를
> 정의하지 않는다. 색을 바꾸려면 `tokens.css`를 수정하고, 이 문서를 갱신한다.
> (두 곳의 값이 다르면 언제나 `tokens.css`가 맞다.)

토큰은 shadcn HSL 컨벤션(`--token: "H S% L%"`)으로 정의되어 있고,
[`src/styles/index.css`](../src/styles/index.css)의 `@theme inline`에서
`hsl(var(--x))`로 매핑되어 Tailwind 색 유틸리티(`bg-primary`, `text-income` 등)로
노출된다. 톤: **신뢰감 있고 차분한 / 지출·경고는 눈에 띄게**.

---

## 1. 토큰 값과 색상

| 토큰 | HSL (`tokens.css`) | HEX(참고) | 색상 설명 |
|---|---|---|---|
| `--background` | `210 40% 98%` | `#f8fafc` | 아주 옅은 쿨 오프화이트 (앱 배경) |
| `--foreground` | `222 47% 11%` | `#0f1729` | 짙은 슬레이트 네이비 (본문 텍스트) |
| `--primary` | `221 70% 46%` | `#2357c7` | 채도 절제한 쿨블루 (주요 액션/강조) |
| `--primary-foreground` | `210 40% 98%` | `#f8fafc` | primary 배경 위 밝은 텍스트 |
| `--income` | `152 56% 36%` | `#288f5f` | 짙은 초록 (수입) |
| `--income-foreground` | `0 0% 100%` | `#ffffff` | income 배경 위 흰 텍스트 |
| `--expense` | `0 74% 52%` | `#df2a2a` | 선명한 빨강 (지출) |
| `--expense-foreground` | `0 0% 100%` | `#ffffff` | expense 배경 위 흰 텍스트 |
| `--warning` | `35 92% 48%` | `#eb8d0a` | 앰버 (예산 주의, 80% 도달) |
| `--warning-foreground` | `30 60% 12%` | `#311f0c` | 앰버 위 어두운 갈색 텍스트 (대비 확보) |
| `--destructive` | `0 72% 45%` | `#c52020` | 짙은 빨강 (삭제, 예산 초과 100%) |
| `--destructive-foreground` | `0 0% 100%` | `#ffffff` | destructive 배경 위 흰 텍스트 |
| `--border` | `214 32% 88%` | `#d7dfea` | 옅은 쿨그레이 경계선 |

> HEX는 이해를 돕기 위한 참고값이다. 코드에서 HEX를 직접 쓰지 말고 항상 토큰을 쓴다.

---

## 2. 토큰별 사용처

각 토큰은 **의미**를 가진다. 색이 예뻐서가 아니라 그 의미에 해당할 때만 쓴다.

- **`--background` / `--foreground`** — 페이지·카드의 기본 배경과 본문 텍스트. 대부분의 중립 텍스트는 `foreground`(또는 그 알파 변형 `foreground/60` 등)를 쓴다.
- **`--primary` (+`-foreground`)** — 주요 버튼(거래 추가 등), 활성 탭, 링크/포커스 강조처럼 "가장 중요한 행동" 하나에만. 남발하면 강조가 죽는다.
- **`--income` (+`-foreground`)** — **수입** 관련 숫자·아이콘·배지에만. 수입 금액 텍스트, 수입 카드 강조, 월별 차트의 수입 막대 등. 일반 성공/확인 색으로 전용하지 않는다.
- **`--expense` (+`-foreground`)** — **지출** 관련 숫자·아이콘·배지에만. 지출 금액 텍스트, 지출 카드, 월별 차트의 지출 막대 등.
- **`--warning` (+`-foreground`)** — 예산 사용률 **80% 이상(주의)** 상태 표시(진행 바, 배지). 항상 라벨/퍼센트와 함께 쓴다(색만으로 의미 전달 금지).
- **`--destructive` (+`-foreground`)** — 되돌리기 어려운 행동(**삭제** 버튼)과 예산 **100% 초과** 상태. expense(일반 지출)와 구분되는 "위험/초과" 신호.
- **`--border`** — 카드·입력창·구분선 등 경계선. 텍스트 색으로 쓰지 않는다.

**income vs expense vs destructive 구분**
- income = 들어온 돈(초록), expense = 나간 돈(빨강)은 **데이터의 성격**이다.
- destructive = 위험한 조작 또는 예산 초과라는 **경고 신호**다.
- 지출이라고 해서 destructive를 쓰지 말 것. "일반 지출 금액"은 `expense`, "예산 초과/삭제"만 `destructive`.

---

## 3. 새 컴포넌트 작업 규칙

1. **하드코딩 금지.** `#2357c7`, `rgb(...)`, `hsl(50 80% 60%)` 같은 리터럴 색값을 컴포넌트/CSS에 직접 쓰지 않는다.
2. **Tailwind 기본 팔레트 금지.** `text-red-500`, `bg-blue-600`, `border-gray-200` 등 Tailwind 내장 색 유틸리티를 쓰지 않는다. 대신 토큰 유틸리티(`text-expense`, `bg-primary`, `border-border`)를 쓴다.
3. **`tokens.css`에 없는 색이 필요하면** 임의로 만들지 말고 먼저 토큰을 추가한다: `tokens.css`에 `--new-token` 정의 → `index.css`의 `@theme inline`에 `--color-new-token: hsl(var(--new-token))` 매핑 → 이 문서에 항목 추가. 그 다음 유틸리티로 사용한다.
4. **투명도**는 새 색을 만들지 말고 알파 슬래시로: `bg-income/12`, `text-foreground/60`처럼 기존 토큰에 알파를 붙인다.
5. **텍스트는 텍스트 토큰**(`foreground` 및 그 알파)을 쓰고, 데이터 색(income/expense 등)은 숫자·아이콘·마크에만 쓴다. 라벨 텍스트 전체를 데이터 색으로 칠하지 않는다.
6. **상태 색(warning/destructive)은 색만으로 쓰지 않는다.** 항상 아이콘 또는 텍스트 라벨(예: "주의", "초과", 퍼센트)과 함께 제공한다.

> 리뷰 체크: 새 코드에 `#`, `rgb(`, 또는 `-red-`/`-blue-`/`-gray-` 같은 기본 팔레트 클래스가 있으면 토큰으로 교체 대상이다.

---

## 4. 이 문서와 tokens.css의 관계

- **`src/styles/tokens.css` = Source of Truth.** 실제 색 값은 오직 여기서만 정의된다.
- **`docs/style-tokens.md`(이 문서) = 사용 가이드.** 값을 정의하지 않고, 어디에·어떻게 쓰는지와 규칙만 설명한다.
- 값 변경 절차: `tokens.css` 수정 → 필요 시 `index.css` 매핑 추가 → 이 문서의 표/사용처 갱신 → `docs/changelog.md`·`docs/decisions.md`에 의미 있는 변경이면 기록.
