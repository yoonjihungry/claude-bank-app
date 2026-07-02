import { useState } from 'react';
import FilterBar from '../components/FilterBar';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { useLedger } from '../context/LedgerContext';
import { useTransactions, type TransactionFilter } from '../hooks/useTransactions';
import type { Transaction } from '../types';

export default function TransactionsPage() {
  const { addTransaction, updateTransaction, deleteTransaction } = useLedger();
  const [filter, setFilter] = useState<TransactionFilter>({});
  const transactions = useTransactions(filter);
  const [editing, setEditing] = useState<Transaction | null>(null);

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
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">
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
        <h2 className="text-lg font-semibold text-gray-800">
          내역 <span className="text-sm text-gray-400">({transactions.length}건)</span>
        </h2>
        <FilterBar filter={filter} onChange={setFilter} />
        <TransactionList
          transactions={transactions}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}
