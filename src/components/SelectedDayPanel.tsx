'use client';

import { useEffect, useId, useState } from 'react';
import TransactionList from './TransactionList';
import { useLedger } from '../context/LedgerContext';
import { useTransactions } from '../hooks/useTransactions';
import { todayISO } from '../utils/dateRange';
import { formatDayLabel, formatWon } from '../utils/format';

interface Props {
  /** 선택된 날짜 'YYYY-MM-DD' */
  date: string;
}

/**
 * 캘린더에서 선택한 날짜의 수입/지출 내역을 보여준다.
 * 대시보드는 조회 중심이라 수정은 제공하지 않고 삭제만 둔다.
 *
 * 헤더를 눌러 본문(요약+내역)을 접었다 펼치는 아코디언이다. 섹션 자체를 없애지 않으므로
 * 캘린더 선택은 그대로 유지된다. 다른 날짜를 고르면 다시 펼쳐 그 날 내역이 바로 보인다.
 */
export default function SelectedDayPanel({ date }: Props) {
  const { deleteTransaction } = useLedger();
  const dayTx = useTransactions({ date });
  const [open, setOpen] = useState(true);
  const bodyId = useId();

  // 다른 날짜를 선택하면 다시 펼친다(접힌 채로 날짜만 바뀌어 내역이 숨는 걸 막는다).
  useEffect(() => setOpen(true), [date]);

  const income = dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center justify-between gap-2 p-4 text-left"
      >
        <h2 className="font-semibold text-foreground">
          {formatDayLabel(date)}
          {date === todayISO() && (
            <span className="ml-1.5 rounded-full bg-primary/12 px-2 py-0.5 align-middle text-xs font-semibold text-primary">
              오늘
            </span>
          )}{' '}
          <span className="text-sm font-normal text-muted-foreground">({dayTx.length}건)</span>
        </h2>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* 아코디언 본문 — grid-rows 0fr↔1fr 트랜지션으로 높이를 부드럽게 펼치고 접는다. */}
      <div
        id={bodyId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 px-4 pb-4">
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

            {/* flush: 카드(패널) 안이라 납작하게 + 시안대로 '메모 · 카테고리' 제목·결제수단 뱃지·원화 표기. */}
            <TransactionList transactions={dayTx} onDelete={deleteTransaction} flush />
          </div>
        </div>
      </div>
    </section>
  );
}
