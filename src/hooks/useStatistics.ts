import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { getCategory } from '../constants/categories';
import { lastNMonths } from '../utils/dateRange';

export interface CategorySlice {
  categoryId: string;
  name: string;
  color: string;
  value: number;
}

export interface MonthlyPoint {
  month: string; // 'YYYY-MM'
  income: number;
  expense: number;
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
  /** 선택 월을 마지막으로 하는 최근 N개월 수입/지출 추이 */
  monthlySeries: MonthlyPoint[];
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
export function useStatistics(month: string, trailingMonths = 6): Statistics {
  const { transactions, budgets } = useLedger();

  return useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const expenseMap = new Map<string, number>();

    const months = lastNMonths(month, trailingMonths);
    const seriesMap = new Map<string, MonthlyPoint>(
      months.map((m) => [m, { month: m, income: 0, expense: 0 }]),
    );

    for (const tx of transactions) {
      const txMonth = tx.date.slice(0, 7);

      // 최근 N개월 추이 누적
      const point = seriesMap.get(txMonth);
      if (point) {
        if (tx.type === 'income') point.income += tx.amount;
        else point.expense += tx.amount;
      }

      // 선택 월 집계
      if (txMonth === month) {
        if (tx.type === 'income') {
          totalIncome += tx.amount;
        } else {
          totalExpense += tx.amount;
          expenseMap.set(tx.category, (expenseMap.get(tx.category) ?? 0) + tx.amount);
        }
      }
    }

    const expenseByCategory: CategorySlice[] = [...expenseMap.entries()]
      .map(([categoryId, value]) => {
        const cat = getCategory(categoryId);
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
        const cat = getCategory(b.categoryId);
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
      monthlySeries: months.map((m) => seriesMap.get(m)!),
      budgetUsage,
    };
  }, [transactions, budgets, month, trailingMonths]);
}
