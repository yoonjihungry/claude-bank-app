# Design System

> **색상 값의 Source of Truth는 [`src/styles/tokens.css`](../src/styles/tokens.css)이다.**
> 이 문서는 그 토큰의 **사용처**와 타이포그래피/레이아웃/spacing 규칙을 정리한다.
> 값 자체는 정의하지 않는다 — 색을 바꾸려면 `tokens.css`를 수정하고 이 문서를 갱신한다.
> (두 곳의 값이 다르면 언제나 `tokens.css`가 맞다.)

토큰은 shadcn HSL 컨벤션(`--token: "H S% L%"`)으로 정의되고,
[`src/styles/index.css`](../src/styles/index.css)의 `@theme inline`에서
`hsl(var(--x))`로 매핑되어 Tailwind 색 유틸리티(`bg-primary`, `text-income` 등)로
노출된다. 톤: **밝고 친근한 핀테크 / 지출·경고는 눈에 띄게**. 포인트(강조) 컬러는 `--primary`(밝은 블루 `#3987e5`)이다.

> **라이트 전용.** 이 앱은 다크 모드를 지원하지 않는다 — `tokens.css`는 `:root`만 두고 `.dark` 블록이나 `prefers-color-scheme` 분기를 추가하지 않는다.

---

## Layout

- **모바일 전용 대응**: 이 프로젝트는 모바일 레이아웃만 대응한다. 데스크톱 전용 레이아웃은 별도로 만들지 않는다.
- **콘텐츠 폭 규칙**: 콘텐츠 영역은 중앙 정렬하며, **모바일(≤768px) 480px / PC(≥768px) 600px**로 상한을 둔다. (넓은 화면에서도 모바일 폭을 크게 넘지 않도록)
- **Breakpoints**
  - 기준 브레이크포인트는 모바일 하나(`768px`)만 둔다.
  - 기본(모바일)은 `max-width: 480px`, `768px` 이상에서 `max-width: 600px`로 넓힌다.

```css
/* 예시 */
.content-container {
  width: 100%;
  max-width: 480px; /* 모바일 상한 */
  margin-inline: auto;
}

@media (min-width: 768px) {
  .content-container {
    max-width: 600px; /* PC 확인 시 상한 */
  }
}
```

> Tailwind 사용 시: `max-w-[480px]` / `md:max-w-[600px]` 형태로 구현한다. 반복 사용되는 값이라면
> `index.css`의 `@theme`에 `--content-width-base: 480px`, `--content-width-md: 600px` 형태로 등록해
> 재사용한다. (이 프로젝트는 Tailwind v4라 `tailwind.config.js`가 없다 — 설정은 CSS의 `@theme`으로만 한다.)

---

## Typography

| 속성 | 값 |
|---|---|
| 폰트 패밀리 | Pretendard GOV |
| 기본 폰트 크기 | 16px |
| 기본 폰트 굵기 | 400 (Regular) |

- 본문 텍스트는 위 기본값을 따른다. 제목/강조 등 별도 스케일이 필요하면 이 표에 추가로 정의한다.
- 폰트는 `pretendard-gov` npm 패키지로 **번들**한다(CDN 런타임 의존 없음). `index.css`에서 `pretendard-gov/dist/web/variable/pretendardvariable-gov-dynamic-subset.css`를 import하고, `@theme`의 `--font-sans`를 `"Pretendard GOV Variable"`로 지정해 앱 기본 sans 폰트로 쓴다. fallback은 시스템 sans-serif.
- dynamic-subset이라 한글이 unicode-range로 쪼개져 실제 쓰는 글자만 로드된다.

---

## Color

### 1. 토큰 값과 사용처

각 토큰은 **의미**를 가진다. 색이 예뻐서가 아니라 그 의미에 해당할 때만 쓴다.
실제 HSL 값은 [`tokens.css`](../src/styles/tokens.css)를 보고, HEX는 참고값이다(코드에 직접 쓰지 말 것).

| 토큰 | HEX(참고) | 용도 |
|---|---|---|
| `--background` / `--foreground` | `#f8fafc` / `#0f1729` | 페이지 전체 배경과 본문 텍스트 |
| `--ink` | `#1b1b12` | 순수 블랙 대신 쓰는 **따뜻한 근검정 텍스트**(`text-ink`). 강한 검정이 필요할 때만 |
| `--card` (+`-foreground`) | `#ffffff` / `#0f1729` | 카드·헤더 등 표면. 흰 배경은 `bg-white`가 아니라 `bg-card` |
| `--muted` / `--muted-foreground` | `#e1e7ef` / `#65758b` | 옅은 회색 표면(진행 바 트랙·보조 버튼·hover) / 보조 텍스트(라벨·날짜·건수). 기존 `text-gray-*` 대체 |
| `--input` | `#cdd7e5` | 입력창·셀렉트·컨트롤 테두리(`border-input`) |
| `--ring` | `#3987e5` | 포커스 링(`focus:ring-ring`, = primary) |
| `--primary` (+`-foreground`) | `#3987e5` / `#ffffff` | **포인트(강조) 컬러.** 주요 버튼·활성 탭·링크 강조. "가장 중요한 행동" 하나에만 |
| `--income` (+`-foreground`) | `#22b479` / `#ffffff` | **수입** 관련 숫자·아이콘·배지·차트 막대에만 |
| `--expense` (+`-foreground`) | `#ef6b63` / `#ffffff` | **지출** 관련 숫자·아이콘·배지·차트 막대에만 |
| `--warning` (+`-foreground`) | `#f5b53a` / `#241905` | 예산 사용률 **80% 이상(주의)**. 항상 라벨/퍼센트와 함께 |
| `--destructive` (+`-foreground`) | `#e05656` / `#ffffff` | **삭제** 액션과 예산 **100% 초과**. expense와 구분되는 "위험/초과" 신호 |
| `--weekend-sun` / `--weekend-sat` | `#e05656` / `#3886e5` | 캘린더 **주말** 요일·날짜 텍스트(일=빨강, 토=파랑). 관례색이라 별도 토큰으로 분리 |
| `--border` | `#d7dfea` | 카드·입력창·구분선 등 경계선. 텍스트 색으로 쓰지 않음 |

### 2. income vs expense vs destructive 구분

- income = 들어온 돈(초록), expense = 나간 돈(빨강)은 **데이터의 성격**이다.
- destructive = 위험한 조작 또는 예산 초과라는 **경고 신호**다.
- 지출이라고 해서 destructive를 쓰지 말 것. "일반 지출 금액"은 `expense`, "예산 초과/삭제"만 `destructive`.

---

## Spacing

- (추후 정의 — Tailwind 기본 spacing 스케일 사용 여부 확정 필요)

---

## Rules

1. **하드코딩 금지.** `#2357c7`, `rgb(...)`, `hsl(50 80% 60%)` 같은 리터럴 색값을 컴포넌트/CSS에 직접 쓰지 않는다. 검정 텍스트도 `#000`/`#1b1b12`가 아니라 `text-ink`를 쓴다.
2. **Tailwind 기본 팔레트 금지.** `text-red-500`, `bg-blue-600`, `border-gray-200` 등 내장 색 유틸리티 대신 토큰 유틸리티(`text-expense`, `bg-primary`, `border-border`)를 쓴다.
3. **`tokens.css`에 없는 색이 필요하면** 임의로 만들지 말고 먼저 토큰을 추가한다: `tokens.css`에 `--new-token` 정의 → `index.css`의 `@theme inline`에 `--color-new-token: hsl(var(--new-token))` 매핑 → 이 문서에 항목 추가. 그다음 유틸리티로 사용한다.
4. **투명도**는 새 색을 만들지 말고 알파 슬래시로: `bg-income/12`, `text-foreground/60`처럼 기존 토큰에 알파를 붙인다.
5. **상태 색(warning/destructive)은 색만으로 쓰지 않는다.** 항상 아이콘 또는 텍스트 라벨("주의", "초과", 퍼센트)과 함께 제공한다.
6. **레이아웃**은 데스크톱 전용 스타일을 만들지 않고, 항상 모바일 폭 기준(위 max-width 규칙)을 따른다.
7. **폰트 크기/굵기**를 임의로 바꾸지 않고, 별도 스케일이 필요하면 Typography 표에 먼저 추가한다.

> 리뷰 체크: 새 코드에 `#`, `rgb(`, 또는 `-red-`/`-blue-`/`-gray-` 같은 기본 팔레트 클래스가 있으면 토큰으로 교체 대상이다.
