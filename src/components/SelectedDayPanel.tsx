'use client';

import TransactionList from './TransactionList';
import { useLedger } from '../context/LedgerContext';
import { useTransactions } from '../hooks/useTransactions';
import { todayISO } from '../utils/dateRange';
import { formatDayLabel, formatWon } from '../utils/format';

interface Props {
  /** 선택된 날짜 'YYYY-MM-DD' */
  date: string;
  /** 닫기(선택 해제) */
  onClose: () => void;
}

/**
 * 캘린더에서 선택한 날짜의 수입/지출 내역을 보여준다.
 * 대시보드는 조회 중심이라 수정은 제공하지 않고 삭제만 둔다.
 */
export default function SelectedDayPanel({ date, onClose }: Props) {
  const { deleteTransaction } = useLedger();
  const dayTx = useTransactions({ date });

  const income = dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">
          {formatDayLabel(date)}
          {date === todayISO() && (
            <span className="ml-1.5 rounded-full bg-primary/12 px-2 py-0.5 align-middle text-xs font-semibold text-primary">
              오늘
            </span>
          )}{' '}
          <span className="text-sm font-normal text-muted-foreground">({dayTx.length}건)</span>
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="rounded px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted"
        >
          닫기
        </button>
      </div>

      {dayTx.length > 0 && (
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            수입 <span className="font-semibold text-income">{formatWon(income)}</span>
          </span>
          <span className="text-muted-foreground">
            지출 <span className="font-semibold text-expense">{formatWon(expense)}</span>
          </span>
        </div>
      )}

      <TransactionList transactions={dayTx} onDelete={deleteTransaction} />
    </section>
  );
}
