/**
 * 차트용 '파랑 한 색의 농담' 램프 — 무채색+파랑 단색 시스템에서 여러 항목을
 * 서로 다른 색상(무지개)이 아니라 같은 파랑의 진하기 차이로 구분한다.
 * 진한 파랑(큰 항목)→연한 파랑(작은 항목). 포인트색(--primary #2f6bff, hsl 222 100% 59%)과
 * 같은 계열이며 명도(L)만 46%~80% 구간에서 균등하게 벌린다.
 */
const HUE = 222;
const SAT = 100;
const L_DARK = 46; // 가장 진한 조각
const L_LIGHT = 80; // 가장 연한 조각

/** count개의 파랑 농담(진→연). i=0이 가장 진하다. */
export function blueRamp(count: number): string[] {
  if (count <= 0) return [];
  if (count === 1) return [`hsl(${HUE}, ${SAT}%, 55%)`];
  return Array.from({ length: count }, (_, i) => {
    const l = Math.round(L_DARK + ((L_LIGHT - L_DARK) * i) / (count - 1));
    return `hsl(${HUE}, ${SAT}%, ${l}%)`;
  });
}

/**
 * 항목을 값 내림차순으로 순위 매겨 '큰 항목일수록 진한 파랑'을 배정한다.
 * 표시 순서와 무관하게 색은 값 크기로 정해진다(도넛/스택바 공용).
 * @returns key(문자열) → 파랑 색 문자열 맵
 */
export function rankedBlueByKey<T>(
  items: T[],
  key: (t: T) => string,
  value: (t: T) => number,
): Map<string, string> {
  const ramp = blueRamp(items.length);
  const map = new Map<string, string>();
  [...items]
    .sort((a, b) => value(b) - value(a))
    .forEach((it, i) => map.set(key(it), ramp[i]));
  return map;
}

/** 6개월 막대 등 '수입 vs 지출' 2계열용 — 지출=진파랑, 수입=연파랑. */
export const SERIES_EXPENSE = `hsl(${HUE}, ${SAT}%, 59%)`;
export const SERIES_INCOME = `hsl(${HUE}, ${SAT}%, 78%)`;
