'use client';

import { useState } from 'react';
import BudgetPanel from '../components/BudgetPanel';
import CategoryModal from '../components/CategoryModal';
import MonthNavigator from '../components/MonthNavigator';
import RecurringModal from '../components/RecurringModal';
import RecurringPanel from '../components/RecurringPanel';
import { useLedger } from '../context/LedgerContext';
import { useRecurring } from '../hooks/useRecurring';
import { useStatistics } from '../hooks/useStatistics';
import type { Category, RecurringRule } from '../types';
import { currentMonth } from '../utils/dateRange';

/** 모달 상태: 닫힘(null) / 추가 / 특정 카테고리 수정 */
type ModalState =
  | null
  | { mode: 'add' }
  | { mode: 'edit'; category: Category; limit: number };

/** 고정거래 모달 상태: 닫힘(null) / 추가 / 특정 규칙 수정 */
type RecurringModalState = null | { mode: 'add' } | { mode: 'edit'; rule: RecurringRule };

export default function BudgetPage() {
  const [month, setMonth] = useState(currentMonth());
  const [modal, setModal] = useState<ModalState>(null);
  const [recurringModal, setRecurringModal] = useState<RecurringModalState>(null);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const { all: rules } = useRecurring();
  const { budgets } = useLedger();
  const stats = useStatistics(month);

  // 이번 달 예산 합계(카테고리별 한도의 합) 대비 지출 — 상단 요약 카드용.
  const budgetTotal = budgets
    .filter((b) => b.month === month)
    .reduce((sum, b) => sum + b.limit, 0);
  const spent = stats.totalExpense;
  const pct = budgetTotal > 0 ? Math.round((spent / budgetTotal) * 100) : 0;
  const remaining = budgetTotal - spent;

  return (
    <div className="flex flex-col gap-4">
      <MonthNavigator month={month} onChange={setMonth} />

      {budgetTotal > 0 && (
        <section className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold text-muted-foreground">이번 달 예산 사용</p>
            <span className="text-xs font-bold text-primary tabular-nums">{pct}%</span>
          </div>
          <p className="mt-1.5 flex items-baseline text-2xl font-extrabold tabular-nums text-ink">
            {spent.toLocaleString('ko-KR')}
            <span className="ml-0.5 text-[0.6em] font-semibold text-muted-foreground">원</span>
          </p>
          <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground tabular-nums">
            예산 {budgetTotal.toLocaleString('ko-KR')}원 ·{' '}
            {remaining >= 0
              ? `${remaining.toLocaleString('ko-KR')}원 남음`
              : `${Math.abs(remaining).toLocaleString('ko-KR')}원 초과`}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </section>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 px-0.5">
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">카테고리별 예산</h2>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-1.5 text-xs font-bold text-primary"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="h-3.5 w-3.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            추가
          </button>
        </div>
        <BudgetPanel
          month={month}
          onEdit={(category, limit) => setModal({ mode: 'edit', category, limit })}
        />
      </div>

      {/* 고정지출 · 반복거래 — 자주 안 건드리는 설정성 항목이라 접힘 상태로 둔다.
          등록은 주로 거래 입력 폼의 '매달 반복' 체크로 하고, 여기선 관리(수정·해지)만. */}
      <div className="border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setRecurringOpen((v) => !v)}
          aria-expanded={recurringOpen}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex items-center gap-2 text-base font-semibold text-foreground">
            고정거래 관리
            <span className="text-sm font-medium text-muted-foreground">
              {rules.length}건
            </span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-5 w-5 text-muted-foreground transition-transform ${
              recurringOpen ? 'rotate-180' : ''
            }`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {recurringOpen && (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              월세·구독료·급여처럼 매달 반복되는 항목이에요. 앱을 열 때 이번 달치가 자동으로
              기록됩니다. 보통은 거래 입력에서 <b>‘매달 반복’</b>으로 등록해요.
            </p>
            <button
              type="button"
              onClick={() => setRecurringModal({ mode: 'add' })}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/35 bg-primary/5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4">
                <path d="M12 5v14M5 12h14" />
              </svg>
              고정거래 직접 추가
            </button>
            <RecurringPanel onEdit={(rule) => setRecurringModal({ mode: 'edit', rule })} />
          </div>
        )}
      </div>

      {modal && (
        <CategoryModal
          mode={modal.mode}
          month={month}
          category={modal.mode === 'edit' ? modal.category : undefined}
          currentLimit={modal.mode === 'edit' ? modal.limit : 0}
          onClose={() => setModal(null)}
        />
      )}

      {recurringModal && (
        <RecurringModal
          mode={recurringModal.mode}
          rule={recurringModal.mode === 'edit' ? recurringModal.rule : undefined}
          onClose={() => setRecurringModal(null)}
        />
      )}
    </div>
  );
}
