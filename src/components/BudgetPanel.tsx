import { useState } from 'react';
import { categoriesByType } from '../constants/categories';
import { useLedger } from '../context/LedgerContext';
import { budgetStatus, useStatistics, type BudgetStatus } from '../hooks/useStatistics';
import type { Category } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  month: string; // 'YYYY-MM'
}

const STATUS_BAR: Record<BudgetStatus, string> = {
  ok: 'bg-green-500',
  warning: 'bg-yellow-400',
  over: 'bg-red-500',
};

const STATUS_TEXT: Record<BudgetStatus, string> = {
  ok: 'text-gray-500',
  warning: 'text-yellow-600',
  over: 'text-red-600',
};

const inputClass =
  'w-32 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

interface RowProps {
  category: Category;
  month: string;
  limit: number;
  spent: number;
}

function BudgetRow({ category, month, limit, spent }: RowProps) {
  const { setBudget } = useLedger();
  const [draft, setDraft] = useState(limit > 0 ? String(limit) : '');

  function commit() {
    const next = Number(draft);
    setBudget({
      categoryId: category.id,
      month,
      limit: Number.isFinite(next) && next > 0 ? Math.round(next) : 0,
    });
  }

  const ratio = limit > 0 ? spent / limit : 0;
  const status = budgetStatus(ratio);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span className="font-medium text-gray-800">{category.name}</span>
        </div>
        <input
          type="number"
          min="0"
          step="1000"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          placeholder="예산 미설정"
          className={inputClass}
          aria-label={`${category.name} 예산`}
        />
      </div>

      {limit > 0 && (
        <>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${STATUS_BAR[status]}`}
              style={{ width: `${Math.min(ratio, 1) * 100}%` }}
            />
          </div>
          <div className={`flex justify-between text-xs ${STATUS_TEXT[status]}`}>
            <span>
              {formatCurrency(spent)} / {formatCurrency(limit)}
            </span>
            <span>
              {Math.round(ratio * 100)}%
              {status === 'over' && ' · 초과'}
              {status === 'warning' && ' · 주의'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function BudgetPanel({ month }: Props) {
  const { budgets } = useLedger();
  const stats = useStatistics(month);

  // 카테고리별 지출액 조회용 맵
  const spentByCategory = new Map(
    stats.expenseByCategory.map((c) => [c.categoryId, c.value]),
  );
  // 카테고리별 예산 한도 조회용 맵 (해당 월)
  const limitByCategory = new Map(
    budgets.filter((b) => b.month === month).map((b) => [b.categoryId, b.limit]),
  );

  return (
    <div className="flex flex-col gap-2">
      {categoriesByType('expense').map((category) => (
        <BudgetRow
          key={category.id}
          category={category}
          month={month}
          limit={limitByCategory.get(category.id) ?? 0}
          spent={spentByCategory.get(category.id) ?? 0}
        />
      ))}
    </div>
  );
}
