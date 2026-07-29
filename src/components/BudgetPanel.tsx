'use client';

import { useLedger } from '../context/LedgerContext';
import { useCategories } from '../hooks/useCategories';
import { useStatistics } from '../hooks/useStatistics';
import type { Category } from '../types';

interface Props {
  month: string; // 'YYYY-MM'
  /** 톱니바퀴 클릭 시 그 카테고리를 현재 예산 한도와 함께 넘긴다. */
  onEdit: (category: Category, limit: number) => void;
}

interface RowProps {
  category: Category;
  limit: number;
  spent: number;
  onEdit: (category: Category, limit: number) => void;
}

/**
 * 예산 한 줄 — 색점 없이 이름·사용률·진행바만. 진행바는 단색(파랑),
 * 초과일 때만 잉크 태그로 구분한다(상태색 초록/주황/빨강 미사용).
 */
function BudgetRow({ category, limit, spent, onEdit }: RowProps) {
  const ratio = limit > 0 ? spent / limit : 0;
  const over = ratio > 1;

  return (
    <div className="flex items-center gap-3 border-t border-border py-3.5 first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            {category.name}
            {over && (
              <span className="shrink-0 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background">
                초과
              </span>
            )}
          </span>
          {limit > 0 && (
            <span
              className={`shrink-0 text-[11.5px] font-semibold tabular-nums ${
                over ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {spent.toLocaleString('ko-KR')} / {limit.toLocaleString('ko-KR')} ·{' '}
              {Math.round(ratio * 100)}%
            </span>
          )}
        </div>

        {limit > 0 ? (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(ratio, 1) * 100}%` }}
            />
          </div>
        ) : (
          <p className="mt-1 text-[11.5px] text-muted-foreground">예산 미설정</p>
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
    <div className="rounded-2xl bg-card px-4 shadow-sm">
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
