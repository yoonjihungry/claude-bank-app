import { useMemo } from 'react';
import { installmentAmount, isLumpSum } from '../constants/installments';
import { useLedger } from '../context/LedgerContext';

/** 'YYYY-MM'을 개월 인덱스(연*12+월)로 변환해 월 간격 계산에 쓴다. */
function monthIndex(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
}

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

/** 이번 달 신용카드 청구 항목(일시불 또는 할부 회차). */
export interface CreditBillItem {
  id: string;
  name: string;
  /** 거래 메모(있으면 어떤 지출인지 구분용으로 표시) */
  memo?: string;
  /** 이번 달 청구액 */
  amount: number;
  /** 현재 회차(1-base). 일시불이면 1. */
  round: number;
  /** 총 할부 개월. 일시불이면 1. */
  months: number;
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
  /** 선택 월에 '구매한' 신용카드 결제 합계(전액) — totalExpense·소비 분해에 쓴다. */
  creditCardTotal: number;
  /** 선택 월에 '청구되는' 신용카드 금액 합계(할부는 이번 달 회차분만). */
  creditBillingTotal: number;
  /** 선택 월 청구 항목 목록(청구액 내림차순). */
  creditBillingItems: CreditBillItem[];
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
    let creditCardTotal = 0;
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
        if (tx.method === 'credit') {
          creditCardTotal += tx.amount;
        }
      }
    }

    // 이번 달 신용카드 청구 계산 — 다른 달에 구매한 할부도 이번 달 회차분을 청구한다.
    const targetIdx = monthIndex(month);
    const creditBillingItems: CreditBillItem[] = [];
    for (const tx of transactions) {
      if (tx.type !== 'expense' || tx.method !== 'credit') continue;

      const purchaseIdx = monthIndex(tx.date.slice(0, 7));
      const cat = categoryById.get(tx.category);
      const name = cat?.name ?? '알 수 없음';

      if (isLumpSum(tx.installmentMonths)) {
        // 일시불 — 구매한 달에 전액 청구
        if (purchaseIdx === targetIdx) {
          creditBillingItems.push({
            id: tx.id,
            name,
            memo: tx.memo,
            amount: tx.amount,
            round: 1,
            months: 1,
          });
        }
        continue;
      }

      const months = tx.installmentMonths as number;
      const round = targetIdx - purchaseIdx + 1; // 구매월이 1회차
      if (round >= 1 && round <= months) {
        creditBillingItems.push({
          id: tx.id,
          name,
          memo: tx.memo,
          amount: installmentAmount(tx.amount, months, round),
          round,
          months,
        });
      }
    }
    creditBillingItems.sort((a, b) => b.amount - a.amount);
    const creditBillingTotal = creditBillingItems.reduce((s, i) => s + i.amount, 0);

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
      creditCardTotal,
      creditBillingTotal,
      creditBillingItems,
      expenseByCategory,
      dailyTrend,
      budgetUsage,
    };
  }, [transactions, budgets, categories, month]);
}
