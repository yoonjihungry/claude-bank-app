import { addMonths, format, parseISO } from 'date-fns';

/** 현재 월을 'YYYY-MM'으로 반환한다. */
export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

/** 'YYYY-MM'에 delta개월을 더한(또는 뺀) 월을 반환한다. */
export function shiftMonth(month: string, delta: number): string {
  return format(addMonths(parseISO(`${month}-01`), delta), 'yyyy-MM');
}

/**
 * month를 마지막으로 하는 최근 n개월 목록을 오름차순으로 반환한다.
 * 예: lastNMonths('2026-07', 3) => ['2026-05', '2026-06', '2026-07']
 */
export function lastNMonths(month: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => shiftMonth(month, -(n - 1 - i)));
}
