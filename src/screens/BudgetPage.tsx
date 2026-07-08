'use client';

import { useState } from 'react';
import BudgetPanel from '../components/BudgetPanel';
import CategoryModal from '../components/CategoryModal';
import MonthNavigator from '../components/MonthNavigator';
import RecurringModal from '../components/RecurringModal';
import RecurringPanel from '../components/RecurringPanel';
import { useRecurring } from '../hooks/useRecurring';
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

  return (
    <div className="flex flex-col gap-6">
      <MonthNavigator month={month} onChange={setMonth} />
      <div>
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">카테고리별 예산</h2>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            aria-label="카테고리 추가"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/35 bg-primary/5 text-primary transition hover:bg-primary/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-5 w-5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          지출 카테고리를 추가·수정하고 이 달의 한도를 설정하세요. 사용률이 80%를 넘으면 주의,
          100%를 넘으면 초과로 표시됩니다.
        </p>
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
