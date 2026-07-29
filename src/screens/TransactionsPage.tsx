'use client';

import { useState } from 'react';
import FilterSheet from '../components/FilterSheet';
import TransactionGroupList from '../components/TransactionGroupList';
import TransactionSheet from '../components/TransactionSheet';
import { useLedger } from '../context/LedgerContext';
import { useCategories } from '../hooks/useCategories';
import { useTransactions, type TransactionFilter } from '../hooks/useTransactions';
import type { Transaction, TxType } from '../types';
import { currentMonth } from '../utils/dateRange';
import { formatMonthLabel } from '../utils/format';

const TYPE_TABS: { label: string; value?: TxType }[] = [
  { label: '전체', value: undefined },
  { label: '지출', value: 'expense' },
  { label: '수입', value: 'income' },
];

export default function TransactionsPage() {
  const { addTransaction, updateTransaction, deleteTransaction } = useLedger();
  const { byId } = useCategories();
  // 기본은 이번 달만 본다(전체 기간을 쏟아내면 매달 쌓이는 고정거래로 목록이 지저분해진다).
  const [filter, setFilter] = useState<TransactionFilter>({ month: currentMonth() });
  const transactions = useTransactions(filter);

  // 입력/수정·고급필터는 상시 노출 대신 바텀시트로 연다 — 내역이 길어져도 리스트가 화면을 다 쓴다.
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }
  function openEdit(tx: Transaction) {
    setEditing(tx);
    setSheetOpen(true);
  }
  function closeSheet() {
    setSheetOpen(false);
    setEditing(null);
  }

  function handleSubmit(data: Omit<Transaction, 'id'>) {
    if (editing) updateTransaction({ ...data, id: editing.id });
    else addTransaction(data);
  }
  function handleDelete(id: string) {
    if (editing?.id === id) closeSheet();
    deleteTransaction(id);
  }

  // 상단 pill(전체/지출/수입). 타입이 바뀌면 현재 카테고리가 새 타입에 안 맞을 때 해제한다(FilterBar와 동일 규칙).
  function setType(type?: TxType) {
    const keepCategory =
      filter.categoryId && (!type || byId(filter.categoryId)?.type === type);
    setFilter((f) => ({ ...f, type, categoryId: keepCategory ? f.categoryId : undefined }));
  }

  const month = filter.month ?? currentMonth();
  const expenseTotal = transactions.reduce(
    (sum, t) => (t.type === 'expense' ? sum + t.amount : sum),
    0,
  );
  // 고급 필터(pill 밖의 것)가 하나라도 걸려 있으면 '필터' 버튼에 점을 찍는다.
  const advancedActive =
    filter.categoryId != null ||
    filter.minAmount != null ||
    filter.maxAmount != null ||
    (filter.keyword ?? '') !== '' ||
    filter.hideRecurring === true ||
    filter.date != null ||
    (filter.month != null && filter.month !== currentMonth());

  return (
    <div className="flex flex-col gap-4">
      {/* 월 지출 요약 */}
      <section className="rounded-2xl bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">{formatMonthLabel(month)} 지출</p>
        <div className="mt-1 flex items-baseline justify-between">
          <b className="text-2xl font-extrabold tabular-nums text-ink">
            {expenseTotal.toLocaleString('ko-KR')}
            <span className="ml-0.5 text-[0.6em] font-semibold text-muted-foreground">원</span>
          </b>
          <span className="text-xs font-semibold text-muted-foreground">{transactions.length}건</span>
        </div>
      </section>

      {/* pill 필터 + 고급 필터 버튼 */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-2">
          {TYPE_TABS.map((t) => {
            const on = (filter.type ?? undefined) === t.value;
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setType(t.value)}
                aria-pressed={on}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                  on
                    ? 'bg-foreground text-background'
                    : 'border border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="relative flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-bold text-foreground transition hover:bg-muted"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          필터
          {advancedActive && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
          )}
        </button>
      </div>

      <TransactionGroupList transactions={transactions} onSelect={openEdit} />

      {/* 플로팅 추가 버튼(FAB) — 콘텐츠 폭 오른쪽 아래에 고정. 옐로 포인트. */}
      <div
        className="pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-[480px] px-4 md:max-w-[600px]"
        style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openAdd}
            aria-label="거래 추가"
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_12px_24px_-4px_rgba(0,0,0,0.35),0_4px_8px_rgba(0,0,0,0.2)] transition hover:bg-accent/90"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="h-7 w-7"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <TransactionSheet
        open={sheetOpen}
        onClose={closeSheet}
        initial={editing ?? undefined}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} filter={filter} onChange={setFilter} />
    </div>
  );
}
