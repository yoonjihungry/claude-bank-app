'use client';

// 고급 필터 바텀시트. 거래 페이지 상단의 pill(전체/지출/수입) 옆 '필터' 버튼으로 연다.
// 시안은 pill만 보이지만, 기간·금액·메모검색·고정숨기기 같은 강력한 필터는 이 시트로 옮겨 보존한다.
// 필터는 즉시 반영(FilterBar가 onChange로 바로 적용)되므로 시트는 열고/닫기만 담당한다.
import { useEffect } from 'react';
import FilterBar from './FilterBar';
import type { TransactionFilter } from '../hooks/useTransactions';

export default function FilterSheet({
  open,
  onClose,
  filter,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  filter: TransactionFilter;
  onChange: (filter: TransactionFilter) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <button
        type="button"
        aria-label="닫기"
        tabIndex={-1}
        onClick={onClose}
        className={`absolute inset-0 cursor-default bg-foreground/45 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[88vh] w-full max-w-[480px] flex-col rounded-t-[22px] border border-border bg-card px-5 pt-2.5 transition-transform duration-300 ease-out md:max-w-[600px] ${
          open
            ? 'translate-y-0 shadow-[0_-10px_40px_-12px_hsl(222_47%_20%/0.3)]'
            : 'translate-y-full'
        }`}
      >
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-[18px] top-4 p-1 text-lg leading-none text-muted-foreground transition hover:text-foreground"
        >
          ✕
        </button>

        <div className="mx-auto mb-3 h-1 w-[38px] shrink-0 rounded-full bg-input" />
        <h3 id="filter-sheet-title" className="mb-3 shrink-0 text-base font-extrabold tracking-tight">
          필터
        </h3>

        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <FilterBar filter={filter} onChange={onChange} bare />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full shrink-0 rounded-xl bg-accent py-3 text-[15px] font-bold text-accent-foreground transition hover:bg-accent/90"
        >
          적용
        </button>
      </div>
    </div>
  );
}
