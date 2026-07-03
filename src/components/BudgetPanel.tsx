import { useLedger } from '../context/LedgerContext';
import { useCategories } from '../hooks/useCategories';
import { budgetStatus, useStatistics, type BudgetStatus } from '../hooks/useStatistics';
import type { Category } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  month: string; // 'YYYY-MM'
  /** 톱니바퀴 클릭 시 그 카테고리를 현재 예산 한도와 함께 넘긴다. */
  onEdit: (category: Category, limit: number) => void;
}

const STATUS_BAR: Record<BudgetStatus, string> = {
  ok: 'bg-income',
  warning: 'bg-warning',
  over: 'bg-destructive',
};

const STATUS_TEXT: Record<BudgetStatus, string> = {
  ok: 'text-muted-foreground',
  warning: 'text-warning-foreground',
  over: 'text-destructive',
};

interface RowProps {
  category: Category;
  limit: number;
  spent: number;
  onEdit: (category: Category, limit: number) => void;
}

function BudgetRow({ category, limit, spent, onEdit }: RowProps) {
  const ratio = limit > 0 ? spent / limit : 0;
  const status = budgetStatus(ratio);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium text-foreground">{category.name}</span>
          {limit > 0 && (
            <span className={`shrink-0 text-xs tabular-nums ${STATUS_TEXT[status]}`}>
              {formatCurrency(spent)} / {formatCurrency(limit)} · {Math.round(ratio * 100)}%
              {status === 'over' && ' · 초과'}
              {status === 'warning' && ' · 주의'}
            </span>
          )}
        </div>

        {limit > 0 ? (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${STATUS_BAR[status]}`}
              style={{ width: `${Math.min(ratio, 1) * 100}%` }}
            />
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            예산 미설정 — 톱니바퀴로 한도를 설정하세요
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onEdit(category, limit)}
        aria-label={`${category.name} 수정`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  );
}

export default function BudgetPanel({ month, onEdit }: Props) {
  const { budgets } = useLedger();
  const { byType } = useCategories();
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
      {byType('expense').map((category) => (
        <BudgetRow
          key={category.id}
          category={category}
          limit={limitByCategory.get(category.id) ?? 0}
          spent={spentByCategory.get(category.id) ?? 0}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
