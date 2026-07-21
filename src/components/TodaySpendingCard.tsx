'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useDailySpending } from '../hooks/useDailySpending';
import { formatSignedWon, formatWon } from '../utils/format';

/** 원형 새로고침 아이콘 */
function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

/** 돈주머니 + 아래 화살표 배지 아이콘 */
function MoneyBagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M9 2h6l-1.2 2.4a1 1 0 0 1-.9.6h-1.8a1 1 0 0 1-.9-.6L9 2Z" opacity="0.85" />
      <path d="M12 6c-3 2.2-5 5.2-5 8.4C7 18.6 9.2 21 12 21s5-2.4 5-6.6C17 11.2 15 8.2 12 6Z" />
    </svg>
  );
}

/**
 * 섹션 1 — 오늘의 소비 카드.
 * 항상 실제 오늘 기준(월 네비게이터와 무관). 어제 대비 증감을 함께 보여준다.
 */
export default function TodaySpendingCard() {
  const { todayExpense, diff } = useDailySpending();
  // 새로고침은 '기준 시각'만 갱신한다(데이터 자체는 항상 최신).
  //
  // 초기값을 null로 두고 마운트 후에 채우는 이유: 로그인 사용자는 이 화면이 서버에서 그려지는데,
  // 서버가 그린 시각과 브라우저가 붙는 시각은 초 단위로 반드시 어긋난다(hydration mismatch).
  // '마지막으로 확인한 시각'은 브라우저에서만 의미가 있으므로 서버에서는 아예 그리지 않는다.
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  useEffect(() => setUpdatedAt(new Date()), []);

  // diff > 0: 어제보다 더 씀(지출↑) → expense, diff < 0: 덜 씀(절약) → income
  const compareClass =
    diff > 0 ? 'text-expense' : diff < 0 ? 'text-income' : 'text-muted-foreground';

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">오늘의 소비</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {/* 마운트 전에는 빈 자리를 유지해 시각이 채워질 때 레이아웃이 흔들리지 않게 한다. */}
          <span className="tabular-nums">
            {updatedAt ? format(updatedAt, 'MM.dd HH:mm:ss') : ' '}
          </span>
          <button
            type="button"
            onClick={() => setUpdatedAt(new Date())}
            aria-label="새로고침"
            className="rounded-full p-1 text-muted-foreground transition hover:bg-muted"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1">
        <span className="text-3xl font-bold text-ink">{formatWon(todayExpense)}</span>
        <span className="text-2xl text-muted-foreground">›</span>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          어제와 비교 <span className={`font-semibold ${compareClass}`}>{formatSignedWon(diff)}</span>
        </span>
        <MoneyBagIcon className={`h-6 w-6 ${compareClass}`} />
      </div>
    </section>
  );
}
