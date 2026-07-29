'use client';

import { useMemo } from 'react';
import BudgetHeroCard from '../components/BudgetHeroCard';
import MonthGlanceCard from '../components/MonthGlanceCard';
import QuickMenu from '../components/QuickMenu';
import TodayTransactions from '../components/TodayTransactions';
import { useDailySpending } from '../hooks/useDailySpending';
import { useStatistics } from '../hooks/useStatistics';
import { useTransactions } from '../hooks/useTransactions';
import { currentMonth, shiftMonth, todayISO } from '../utils/dateRange';

/**
 * 홈(대시보드) — 카카오페이 톤 재구성.
 * 위(매번 보는 것)→아래(궁금하면 보는 것) 순서:
 * 옐로 히어로(쓸 수 있는 돈) → 빠른 메뉴 → 오늘 소비 → 이번 달 한눈에(소비·수입·카드청구 3줄).
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

      <QuickMenu />

      <TodayTransactions
        todayExpense={daily.todayExpense}
        diff={daily.diff}
        transactions={todayTx}
      />

      <MonthGlanceCard
        expense={stats.totalExpense}
        income={stats.totalIncome}
        incomeDelta={stats.totalIncome - prevStats.totalIncome}
        creditBilling={stats.creditBillingTotal}
        topCategories={stats.expenseByCategory}
      />
    </div>
  );
}
