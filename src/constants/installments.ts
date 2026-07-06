/**
 * 할부 개월수 옵션 — 신용카드 지출 입력에서 고른다.
 * '일시불'은 개월수 없음(=1)으로 취급하고, 2개월 이상만 할부로 저장한다.
 */
export const INSTALLMENT_MONTHS: number[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24,
];

/** 일시불 여부 판정: 개월수가 없거나 2 미만이면 일시불이다. */
export function isLumpSum(months?: number): boolean {
  return !months || months < 2;
}

/**
 * 총액을 개월수로 원 단위 균등분할한 뒤, 특정 회차(1-base)의 청구액을 돌려준다.
 * 나눠떨어지지 않는 나머지는 1회차에 몰아 합계가 총액과 일치하도록 한다.
 */
export function installmentAmount(total: number, months: number, round: number): number {
  const base = Math.floor(total / months);
  const remainder = total - base * months;
  return round === 1 ? base + remainder : base;
}
