import { useState } from 'react';
import CategoryChart from '../components/CategoryChart';
import MonthlyChart from '../components/MonthlyChart';
import MonthNavigator from '../components/MonthNavigator';
import SummaryCards from '../components/SummaryCards';
import TransactionList from '../components/TransactionList';
import { useLedger } from '../context/LedgerContext';
import { useStatistics } from '../hooks/useStatistics';
import { useTransactions } from '../hooks/useTransactions';
import { currentMonth } from '../utils/dateRange';

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const { deleteTransaction } = useLedger();
  const stats = useStatistics(month);
  const monthTx = useTransactions({ month });

  return (
    <div className="flex flex-col gap-6">
      <MonthNavigator month={month} onChange={setMonth} />

      <SummaryCards
        totalIncome={stats.totalIncome}
        totalExpense={stats.totalExpense}
        balance={stats.balance}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-gray-800">카테고리별 지출</h2>
          <CategoryChart data={stats.expenseByCategory} />
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-gray-800">월별 수입·지출 추이</h2>
          <MonthlyChart data={stats.monthlySeries} />
        </section>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">
          이 달의 내역 <span className="text-sm text-gray-400">({monthTx.length}건)</span>
        </h2>
        {/* 대시보드에서는 조회 중심 — 수정은 거래 탭에서, 여기선 삭제만 제공 */}
        <TransactionList transactions={monthTx} onDelete={deleteTransaction} />
      </section>
    </div>
  );
}
