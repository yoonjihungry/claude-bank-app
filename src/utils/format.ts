import { format, parseISO } from 'date-fns';

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

/** 금액을 원화(₩1,234) 형식으로 포맷한다. */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

/** 부호(+/-)를 붙인 금액. income은 +, expense는 - 로 표시할 때 사용. */
export function formatSignedCurrency(amount: number, sign: '+' | '-'): string {
  return `${sign}${formatCurrency(Math.abs(amount))}`;
}

/** ISO 'YYYY-MM-DD' → 'YYYY.MM.DD' */
export function formatDate(iso: string): string {
  return format(parseISO(iso), 'yyyy.MM.dd');
}

/** 'YYYY-MM' → 'YYYY년 M월' */
export function formatMonthLabel(month: string): string {
  return format(parseISO(`${month}-01`), 'yyyy년 M월');
}
