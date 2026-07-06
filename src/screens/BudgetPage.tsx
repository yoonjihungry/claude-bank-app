'use client';

import { useState } from 'react';
import BudgetPanel from '../components/BudgetPanel';
import CategoryModal from '../components/CategoryModal';
import MonthNavigator from '../components/MonthNavigator';
import type { Category } from '../types';
import { currentMonth } from '../utils/dateRange';

/** 모달 상태: 닫힘(null) / 추가 / 특정 카테고리 수정 */
type ModalState =
  | null
  | { mode: 'add' }
  | { mode: 'edit'; category: Category; limit: number };

export default function BudgetPage() {
  const [month, setMonth] = useState(currentMonth());
  const [modal, setModal] = useState<ModalState>(null);

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

      {modal && (
        <CategoryModal
          mode={modal.mode}
          month={month}
          category={modal.mode === 'edit' ? modal.category : undefined}
          currentLimit={modal.mode === 'edit' ? modal.limit : 0}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
