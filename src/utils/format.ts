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

/**
 * 만/억 단위로 줄인 '원' 표기(차트 말풍선·도넛 중앙처럼 폭이 좁은 곳용).
 * 예: 1,845,000 → '185만원', 123,400,000 → '1.2억원', 8,200 → '8,200원'.
 */
export function formatWonCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';
  if (abs >= 1e8) {
    const uk = Math.round(abs / 1e7) / 10; // 억을 소수 첫째 자리까지
    return `${sign}${uk.toLocaleString('ko-KR')}억원`;
  }
  if (abs >= 1e4) {
    return `${sign}${Math.round(abs / 1e4).toLocaleString('ko-KR')}만원`;
  }
  return formatWon(amount);
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
