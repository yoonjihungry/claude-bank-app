import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';

export interface CategorySlice {
  categoryId: string;
  name: string;
  color: string;
  value: number;
}

export interface DailyTrendPoint {
  date: string; // 'YYYY-MM-DD'
  /** 그 날 순액(수입 − 지출) */
  net: number;
  /** 선택 월 시작부터의 누적 순액 */
  cumulative: number;
}

export type BudgetStatus = 'ok' | 'warning' | 'over';

export interface BudgetUsage {
  categoryId: string;
  name: string;
  color: string;
  spent: number;
  limit: number;
  /** spent / limit (0~) */
  ratio: number;
  status: BudgetStatus; // >=1 over, >=0.8 warning, else ok
}

export interface Statistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  /** 선택 월의 지출을 카테고리별로 집계(내림차순, 0원 제외) */
  expenseByCategory: CategorySlice[];
  /** 선택 월의 거래가 있는 날짜별 순액·누적 추이(날짜 오름차순) */
  dailyTrend: DailyTrendPoint[];
  /** 선택 월에 예산이 설정된 카테고리의 사용 현황(사용률 내림차순) */
  budgetUsage: BudgetUsage[];
}

/** 사용률(spent/limit)로 예산 상태를 판정한다. >=1 초과, >=0.8 주의. */
export function budgetStatus(ratio: number): BudgetStatus {
  if (ratio >= 1) return 'over';
  if (ratio >= 0.8) return 'warning';
  return 'ok';
}

/**
 * 선택 월 기준 통계를 useMemo로 파생 계산한다.
 * 집계 로직은 컴포넌트가 아닌 이 훅에 둔다.
 */
export function useStatistics(month: string): Statistics {
  const { transactions, budgets, categories } = useLedger();

  return useMemo(() => {
    const categoryById = new Map(categories.map((c) => [c.id, c]));
    let totalIncome = 0;
    let totalExpense = 0;
    const expenseMap = new Map<string, number>();
    // 선택 월의 날짜별 순액(수입 − 지출)
    const dailyNet = new Map<string, number>();

    for (const tx of transactions) {
      const txMonth = tx.date.slice(0, 7);
      if (txMonth !== month) continue;

      const signed = tx.type === 'income' ? tx.amount : -tx.amount;
      dailyNet.set(tx.date, (dailyNet.get(tx.date) ?? 0) + signed);

      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        expenseMap.set(tx.category, (expenseMap.get(tx.category) ?? 0) + tx.amount);
      }
    }

    let running = 0;
    const dailyTrend: DailyTrendPoint[] = [...dailyNet.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, net]) => {
        running += net;
        return { date, net, cumulative: running };
      });

    const expenseByCategory: CategorySlice[] = [...expenseMap.entries()]
      .map(([categoryId, value]) => {
        const cat = categoryById.get(categoryId);
        return {
          categoryId,
          name: cat?.name ?? '알 수 없음',
          color: cat?.color ?? '#9ca3af',
          value,
        };
      })
      .sort((a, b) => b.value - a.value);

    const budgetUsage: BudgetUsage[] = budgets
      .filter((b) => b.month === month)
      .map((b) => {
        const cat = categoryById.get(b.categoryId);
        const spent = expenseMap.get(b.categoryId) ?? 0;
        const ratio = b.limit > 0 ? spent / b.limit : 0;
        return {
          categoryId: b.categoryId,
          name: cat?.name ?? '알 수 없음',
          color: cat?.color ?? '#9ca3af',
          spent,
          limit: b.limit,
          ratio,
          status: budgetStatus(ratio),
        };
      })
      .sort((a, b) => b.ratio - a.ratio);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      expenseByCategory,
      dailyTrend,
      budgetUsage,
    };
  }, [transactions, budgets, categories, month]);
}
