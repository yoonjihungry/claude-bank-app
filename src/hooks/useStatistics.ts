import { useMemo } from 'react';
import { installmentAmount, isLumpSum } from '../constants/installments';
import { PAYMENT_METHODS } from '../constants/paymentMethods';
import { useLedger } from '../context/LedgerContext';
import type { PaymentMethod } from '../types';
import { currentMonth, monthDays, todayISO } from '../utils/dateRange';

/** 'YYYY-MM'을 개월 인덱스(연*12+월)로 변환해 월 간격 계산에 쓴다. */
function monthIndex(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
}

/** 청구 기준으로 한 거래가 targetIdx 달에 실리는 금액과 (신용카드면) 회차 정보. 안 실리면 null. */
interface BillPortion {
  amount: number;
  /** 현재 회차(1-base). 일시불·현금·체크는 1. */
  round: number;
  /** 총 할부 개월. 일시불·현금·체크는 1. */
  months: number;
}
function billForMonth(
  tx: { date: string; amount: number; method?: PaymentMethod; installmentMonths?: number },
  targetIdx: number,
): BillPortion | null {
  const purchaseIdx = monthIndex(tx.date.slice(0, 7));
  // 신용카드 할부만 여러 달에 걸쳐 나뉜다. 그 외(현금·체크·일시불)는 거래한 달에 전액.
  if (tx.method === 'credit' && !isLumpSum(tx.installmentMonths)) {
    const months = tx.installmentMonths as number;
    const round = targetIdx - purchaseIdx + 1; // 구매월이 1회차
    if (round < 1 || round > months) return null;
    return { amount: installmentAmount(tx.amount, months, round), round, months };
  }
  if (purchaseIdx !== targetIdx) return null;
  return { amount: tx.amount, round: 1, months: 1 };
}

export interface CategorySlice {
  categoryId: string;
  name: string;
  color: string;
  value: number;
}

/** 결제수단별 지출 한 조각. method가 'none'이면 미지정. 색은 뷰(토큰)에서 정한다. */
export interface MethodSlice {
  method: PaymentMethod | 'none';
  label: string;
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
  /**
   * 선택 월의 지출 합계 — **청구 기준**. 할부는 이번 달 회차분만, 다른 달에 산 할부의
   * 이번 달 회차도 포함한다(= 현금·체크 당월분 + creditBillingTotal).
   */
  totalExpense: number;
  balance: number;
  /** 선택 월에 '구매한' 신용카드 결제 합계(전액, 구매 기준) — 참고용. 총소비는 청구 기준이다. */
  creditCardTotal: number;
  /** 선택 월에 '청구되는' 신용카드 금액 합계(할부는 이번 달 회차분만). totalExpense의 부분집합. */
  creditBillingTotal: number;
  /** 선택 월 청구 항목 목록(청구액 내림차순). */
  creditBillingItems: CreditBillItem[];
  /** 선택 월의 지출을 카테고리별로 집계(청구 기준, 내림차순, 0원 제외) */
  expenseByCategory: CategorySlice[];
  /** 선택 월의 수입을 카테고리별로 집계(내림차순, 0원 제외) */
  incomeByCategory: CategorySlice[];
  /** 선택 월의 지출을 결제수단별로 집계(청구 기준, 내림차순, 0원 제외) */
  expenseByMethod: MethodSlice[];
  /** 선택 월의 거래가 있는 날짜별 순액·누적 추이(거래일 기준, 날짜 오름차순) */
  dailyTrend: DailyTrendPoint[];
  /** 선택 월에 예산이 설정된 카테고리의 사용 현황(사용률 내림차순) */
  budgetUsage: BudgetUsage[];
  /** 하루 평균 지출(당월은 오늘까지 경과일, 지난달은 그 달 전체 일수로 나눔) */
  avgDailyExpense: number;
  /** 저축률 = 잔액 ÷ 수입 (수입 0이면 0). 음수(적자)일 수 있다 */
  savingsRate: number;
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
    const targetIdx = monthIndex(month);

    // 1) 거래일 기준 — 수입 집계와 일별 순액(캘린더·추이 차트용). 지출은 여기서 '구매 전액'을
    //    그날에 찍어 추이/캘린더가 실제 거래일을 반영하게 둔다(할부를 미래로 흩지 않는다).
    let totalIncome = 0;
    let creditCardTotal = 0; // 이번 달 '구매한' 신용카드 전액(참고용)
    const incomeMap = new Map<string, number>();
    const dailyNet = new Map<string, number>();

    for (const tx of transactions) {
      if (tx.date.slice(0, 7) !== month) continue;
      const signed = tx.type === 'income' ? tx.amount : -tx.amount;
      dailyNet.set(tx.date, (dailyNet.get(tx.date) ?? 0) + signed);
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        incomeMap.set(tx.category, (incomeMap.get(tx.category) ?? 0) + tx.amount);
      } else if (tx.method === 'credit') {
        creditCardTotal += tx.amount;
      }
    }

    // 2) 청구 기준 지출 집계 — 소비 총액·카테고리·결제수단·예산이 모두 이 값을 쓴다.
    //    현금·체크·일시불은 거래한 달에 전액, 할부는 이번 달 회차분만(다른 달에 산 할부도 포함).
    let totalExpense = 0;
    let creditBillingTotal = 0;
    const expenseMap = new Map<string, number>();
    const methodMap = new Map<PaymentMethod | 'none', number>();
    const creditBillingItems: CreditBillItem[] = [];

    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      const bill = billForMonth(tx, targetIdx);
      if (!bill) continue;

      totalExpense += bill.amount;
      expenseMap.set(tx.category, (expenseMap.get(tx.category) ?? 0) + bill.amount);
      const mkey = tx.method ?? 'none';
      methodMap.set(mkey, (methodMap.get(mkey) ?? 0) + bill.amount);

      if (tx.method === 'credit') {
        creditBillingTotal += bill.amount;
        creditBillingItems.push({
          id: tx.id,
          name: categoryById.get(tx.category)?.name ?? '알 수 없음',
          memo: tx.memo,
          amount: bill.amount,
          round: bill.round,
          months: bill.months,
        });
      }
    }
    creditBillingItems.sort((a, b) => b.amount - a.amount);

    let running = 0;
    const dailyTrend: DailyTrendPoint[] = [...dailyNet.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, net]) => {
        running += net;
        return { date, net, cumulative: running };
      });

    /** Map<categoryId, 합계>를 카테고리 메타로 살 붙여 내림차순 조각 배열로. */
    const toCategorySlices = (map: Map<string, number>): CategorySlice[] =>
      [...map.entries()]
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

    const expenseByCategory = toCategorySlices(expenseMap);
    const incomeByCategory = toCategorySlices(incomeMap);

    // 표준 결제수단(현금·체크·신용)은 안 쓴 달에도 0원으로 항상 표시한다.
    // '미지정'은 실제로 있을 때만 덧붙인다. 큰 금액 순으로 정렬.
    const noneAmount = methodMap.get('none') ?? 0;
    const expenseByMethod: MethodSlice[] = [
      ...PAYMENT_METHODS.map((m) => ({
        method: m.id,
        label: m.label,
        value: methodMap.get(m.id) ?? 0,
      })),
      ...(noneAmount > 0
        ? [{ method: 'none' as const, label: '미지정', value: noneAmount }]
        : []),
    ].sort((a, b) => b.value - a.value);

    // 하루 평균 지출 — 당월은 오늘까지 경과일, 그 외 달은 그 달 전체 일수로 나눈다.
    const elapsedDays =
      month === currentMonth() ? Number(todayISO().slice(8, 10)) : monthDays(month).length;
    const avgDailyExpense = elapsedDays > 0 ? Math.round(totalExpense / elapsedDays) : 0;

    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;

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
      incomeByCategory,
      expenseByMethod,
      dailyTrend,
      budgetUsage,
      avgDailyExpense,
      savingsRate,
    };
  }, [transactions, budgets, categories, month]);
}
