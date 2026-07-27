'use client';

import { useState } from 'react';
import CategoryChart from '../components/CategoryChart';
import DailyTrendChart from '../components/DailyTrendChart';
import FilterBar from '../components/FilterBar';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { useLedger } from '../context/LedgerContext';
import { useStatistics } from '../hooks/useStatistics';
import { useTransactions, type TransactionFilter } from '../hooks/useTransactions';
import type { Transaction } from '../types';
import { currentMonth } from '../utils/dateRange';

export default function TransactionsPage() {
  const { addTransaction, updateTransaction, deleteTransaction } = useLedger();
  // 기본은 이번 달만 본다(전체 기간을 쏟아내면 매달 쌓이는 고정거래로 목록이 지저분해진다).
  // 다른 달은 FilterBar의 월 선택기로 이동한다.
  const [filter, setFilter] = useState<TransactionFilter>({ month: currentMonth() });
  const transactions = useTransactions(filter);
  const [editing, setEditing] = useState<Transaction | null>(null);

  // 차트는 필터의 월(없으면 이번 달) 기준으로 집계한다.
  const statMonth = filter.month ?? currentMonth();
  const stats = useStatistics(statMonth);

  function handleSubmit(data: Omit<Transaction, 'id'>) {
    if (editing) {
      updateTransaction({ ...data, id: editing.id });
      setEditing(null);
    } else {
      addTransaction(data);
    }
  }

  function handleDelete(id: string) {
    if (editing?.id === id) setEditing(null);
    deleteTransaction(id);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 그래프 2개 임시 숨김 처리 (추후 복구) */}
      {false && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-foreground">카테고리별 지출</h2>
            <CategoryChart data={stats.expenseByCategory} />
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-foreground">일자별 수입·지출 추이</h2>
            <DailyTrendChart data={stats.dailyTrend} />
          </section>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            {editing ? '거래 수정' : '거래 추가'}
          </h2>
          <TransactionForm
            key={editing?.id ?? 'new'}
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={editing ? () => setEditing(null) : undefined}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            내역 <span className="text-sm text-muted-foreground">({transactions.length}건)</span>
          </h2>
          <FilterBar filter={filter} onChange={setFilter} />
          <TransactionList
            transactions={transactions}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        </section>
      </div>
    </div>
  );
}
