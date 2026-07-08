'use client';

import { useMemo } from 'react';
import { PAYMENT_METHODS } from '../constants/paymentMethods';
import { useCategories } from '../hooks/useCategories';
import { useRecurring } from '../hooks/useRecurring';
import type { RecurringRule } from '../types';
import { formatSignedWon } from '../utils/format';

interface Props {
  /** 규칙 클릭/수정 시 상위에서 모달을 연다. */
  onEdit: (rule: RecurringRule) => void;
}

function methodBadge(id?: string): string | undefined {
  return PAYMENT_METHODS.find((m) => m.id === id)?.badge;
}

/**
 * 고정지출/반복거래 규칙 목록.
 * 색·이름·"매달 N일"·금액을 보여주고, on/off 토글과 삭제를 제공한다.
 * 활성 규칙을 먼저, 그다음 생성일(일자) 순으로 정렬한다.
 */
export default function RecurringPanel({ onEdit }: Props) {
  const { byId } = useCategories();
  const { all, updateRecurringRule, deleteRecurringRule } = useRecurring();

  const rules = useMemo(
    () =>
      [...all].sort(
        (a, b) =>
          Number(b.active) - Number(a.active) || a.dayOfMonth - b.dayOfMonth,
      ),
    [all],
  );

  if (rules.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        아직 등록한 고정거래가 없습니다.
        <br />
        월세·구독료·급여처럼 매달 반복되는 항목을 추가해보세요.
      </p>
    );
  }

  function toggle(rule: RecurringRule) {
    updateRecurringRule({ ...rule, active: !rule.active });
  }

  function handleDelete(rule: RecurringRule) {
    const cat = byId(rule.category);
    if (
      !window.confirm(
        `'${cat?.name ?? '미분류'}' 고정거래를 삭제할까요?\n이미 생성된 과거 거래는 그대로 남습니다.`,
      )
    )
      return;
    deleteRecurringRule(rule.id);
  }

  return (
    <ul className="flex flex-col gap-2">
      {rules.map((rule) => {
        const cat = byId(rule.category);
        const badge = rule.type === 'expense' ? methodBadge(rule.method) : undefined;
        const signed = rule.type === 'expense' ? -rule.amount : rule.amount;
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition ${
              rule.active ? '' : 'opacity-55'
            }`}
          >
            <button
              type="button"
              onClick={() => onEdit(rule)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: cat?.color ?? 'hsl(var(--muted-foreground))' }}
              />
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {cat?.name ?? '미분류'}
                  </span>
                  {badge && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  매달 {rule.dayOfMonth}일{rule.memo ? ` · ${rule.memo}` : ''}
                </span>
              </span>
            </button>

            <span
              className={`shrink-0 text-sm font-semibold tabular-nums ${
                rule.type === 'expense' ? 'text-expense' : 'text-income'
              }`}
            >
              {formatSignedWon(signed)}
            </span>

            {/* on/off 토글 */}
            <button
              type="button"
              onClick={() => toggle(rule)}
              role="switch"
              aria-checked={rule.active}
              aria-label={rule.active ? '자동 생성 끄기' : '자동 생성 켜기'}
              className={`relative h-6 w-10 shrink-0 rounded-full transition ${
                rule.active ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${
                  rule.active ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </button>

            {/* 삭제 */}
            <button
              type="button"
              onClick={() => handleDelete(rule)}
              aria-label="삭제"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
