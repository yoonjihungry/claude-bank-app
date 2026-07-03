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

/** 금액을 '1,234원' 형식으로 포맷한다(₩ 기호 대신 '원' 접미사 — 대시보드 카드용). */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/** 부호(+/−)를 붙인 '원' 표기. 0이면 '±0원'. */
export function formatSignedWon(amount: number): string {
  if (amount === 0) return '±0원';
  const sign = amount > 0 ? '+' : '−';
  return `${sign}${formatWon(Math.abs(amount))}`;
}

/** ISO 'YYYY-MM-DD' → 'YYYY.MM.DD' */
export function formatDate(iso: string): string {
  return format(parseISO(iso), 'yyyy.MM.dd');
}

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** ISO 'YYYY-MM-DD' → 'M월 D일 (요일)' (선택 날짜 헤더용) */
export function formatDayLabel(iso: string): string {
  const d = parseISO(iso);
  return `${format(d, 'M월 d일')} (${KO_WEEKDAYS[d.getDay()]})`;
}

/** 'YYYY-MM' → 'YYYY년 M월' */
export function formatMonthLabel(month: string): string {
  return format(parseISO(`${month}-01`), 'yyyy년 M월');
}
