'use client';

import { useMemo } from 'react';
import BudgetHeroCard from '../components/BudgetHeroCard';
import CreditBillingCard from '../components/CreditBillingCard';
import IncomeSummaryLine from '../components/IncomeSummaryLine';
import MonthlySpendingCard from '../components/MonthlySpendingCard';
import TodayTransactions from '../components/TodayTransactions';
import { useDailySpending } from '../hooks/useDailySpending';
import { useStatistics } from '../hooks/useStatistics';
import { useTransactions } from '../hooks/useTransactions';
import { currentMonth, shiftMonth, todayISO } from '../utils/dateRange';

/**
 * 홈(대시보드) — '예산 잔액 히어로' 중심의 A안 구성.
 * 위(매번 보는 상태)→아래(궁금하면 보는 상세) 순서:
 * 예산 히어로 → 이번 달 수입 → 이번 달 소비 → 카드 청구 예정 → 오늘 내역.
 * 항상 이번 달 기준이라 월 네비게이터를 두지 않는다.
 */
export default function DashboardPage() {
  const month = currentMonth();
  const stats = useStatistics(month);
  const prevStats = useStatistics(shiftMonth(month, -1));
  const daily = useDailySpending();
  const todayTx = useTransactions({ date: todayISO() });

  // 이번 달 예산 합계 = 카테고리별 예산(월)의 총합. 훅이 이미 계산한 budgetUsage를 더한다.
  const budgetTotal = useMemo(
    () => stats.budgetUsage.reduce((sum, b) => sum + b.limit, 0),
    [stats.budgetUsage],
  );

  return (
    <div className="flex flex-col gap-4">
      <BudgetHeroCard budgetTotal={budgetTotal} spent={stats.totalExpense} />

      <IncomeSummaryLine
        income={stats.totalIncome}
        delta={stats.totalIncome - prevStats.totalIncome}
      />

      <MonthlySpendingCard
        expense={stats.totalExpense}
        creditCard={stats.creditCardTotal}
        categories={stats.expenseByCategory}
      />

      <CreditBillingCard total={stats.creditBillingTotal} items={stats.creditBillingItems} />

      <TodayTransactions
        todayExpense={daily.todayExpense}
        diff={daily.diff}
        transactions={todayTx}
      />
    </div>
  );
}
