import {
  addDays,
  addMonths,
  format,
  getDaysInMonth,
  getDay,
  parseISO,
} from 'date-fns';

/** 현재 월을 'YYYY-MM'으로 반환한다. */
export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

/** 오늘 날짜를 ISO 'YYYY-MM-DD'로 반환한다. */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** ISO 'YYYY-MM-DD'에 delta일을 더한(뺀) 날짜를 반환한다. */
export function shiftDay(iso: string, delta: number): string {
  return format(addDays(parseISO(iso), delta), 'yyyy-MM-dd');
}

/**
 * 'YYYY-MM'의 모든 날짜를 ISO 'YYYY-MM-DD' 오름차순 배열로 반환한다.
 * 예: monthDays('2026-07') => ['2026-07-01', ..., '2026-07-31']
 */
export function monthDays(month: string): string[] {
  const first = parseISO(`${month}-01`);
  const count = getDaysInMonth(first);
  return Array.from({ length: count }, (_, i) => format(addDays(first, i), 'yyyy-MM-dd'));
}

/** 'YYYY-MM' 1일의 요일(0=일 ~ 6=토)을 반환한다. 캘린더 앞쪽 빈칸 계산용. */
export function firstWeekday(month: string): number {
  return getDay(parseISO(`${month}-01`));
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
