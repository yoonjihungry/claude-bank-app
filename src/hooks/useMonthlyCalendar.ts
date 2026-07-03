import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';

export interface DayMarks {
  hasIncome: boolean;
  hasExpense: boolean;
}

/**
 * 선택 월의 '날짜(YYYY-MM-DD) → { hasIncome, hasExpense }' 맵을 파생 계산한다.
 * 캘린더에서 날짜 아래 수입/지출 dot을 찍는 데 쓴다.
 */
export function useMonthlyCalendar(month: string): Map<string, DayMarks> {
  const { transactions } = useLedger();

  return useMemo(() => {
    const map = new Map<string, DayMarks>();
    for (const tx of transactions) {
      if (!tx.date.startsWith(month)) continue;
      const marks = map.get(tx.date) ?? { hasIncome: false, hasExpense: false };
      if (tx.type === 'income') marks.hasIncome = true;
      else marks.hasExpense = true;
      map.set(tx.date, marks);
    }
    return map;
  }, [transactions, month]);
}
