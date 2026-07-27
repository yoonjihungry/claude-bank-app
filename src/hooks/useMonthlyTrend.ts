import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { lastNMonths } from '../utils/dateRange';

export interface MonthlyTotals {
  month: string; // 'YYYY-MM'
  income: number;
  expense: number;
  /** 순액(수입 − 지출) */
  net: number;
}

export interface MonthlyTrend {
  /** 기준 월을 마지막으로 하는 최근 n개월 월별 합계(오름차순) */
  months: MonthlyTotals[];
  /** 기준 월 합계(months의 마지막 원소) */
  current: MonthlyTotals;
  /** 직전 달 합계(기준월 − 1). 범위 밖이면 0으로 채운다. */
  previous: MonthlyTotals;
  /** 전월 대비 증감(기준월 − 직전월) */
  delta: { income: number; expense: number; net: number };
}

const emptyTotals = (month: string): MonthlyTotals => ({
  month,
  income: 0,
  expense: 0,
  net: 0,
});

/**
 * 기준 월 기준 최근 n개월의 월별 수입/지출을 useMemo로 집계한다.
 * 전월 대비 증감과 추세 차트가 모두 여기서 파생된다 — 집계는 컴포넌트가 아닌 훅에 둔다.
 */
export function useMonthlyTrend(month: string, n = 6): MonthlyTrend {
  const { transactions } = useLedger();

  return useMemo(() => {
    const months = lastNMonths(month, n);
    const map = new Map<string, MonthlyTotals>(
      months.map((m) => [m, emptyTotals(m)]),
    );

    for (const tx of transactions) {
      const bucket = map.get(tx.date.slice(0, 7));
      if (!bucket) continue;
      if (tx.type === 'income') bucket.income += tx.amount;
      else bucket.expense += tx.amount;
    }

    const list = months.map((m) => {
      const b = map.get(m)!;
      b.net = b.income - b.expense;
      return b;
    });

    const current = list[list.length - 1];
    const previous = list.length >= 2 ? list[list.length - 2] : emptyTotals('');
    const delta = {
      income: current.income - previous.income,
      expense: current.expense - previous.expense,
      net: current.net - previous.net,
    };

    return { months: list, current, previous, delta };
  }, [transactions, month, n]);
}
