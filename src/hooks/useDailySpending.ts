import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { shiftDay, todayISO } from '../utils/dateRange';

export interface DailySpending {
  /** 오늘 지출 합계 */
  todayExpense: number;
  /** 어제 지출 합계 */
  yesterdayExpense: number;
  /** 오늘 − 어제 (양수=더 씀, 음수=덜 씀) */
  diff: number;
  /** 기준 ISO 날짜(YYYY-MM-DD) */
  today: string;
}

/**
 * "오늘의 소비"와 "어제와 비교"에 필요한 값을 파생 계산한다.
 * 월 네비게이터와 무관하게 항상 실제 오늘 기준.
 * updatedAt(갱신 시각)은 표시 전용이라 컴포넌트에서 관리한다.
 */
export function useDailySpending(): DailySpending {
  const { transactions } = useLedger();

  return useMemo(() => {
    const today = todayISO();
    const yesterday = shiftDay(today, -1);

    let todayExpense = 0;
    let yesterdayExpense = 0;

    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      if (tx.date === today) todayExpense += tx.amount;
      else if (tx.date === yesterday) yesterdayExpense += tx.amount;
    }

    return {
      todayExpense,
      yesterdayExpense,
      diff: todayExpense - yesterdayExpense,
      today,
    };
  }, [transactions]);
}
