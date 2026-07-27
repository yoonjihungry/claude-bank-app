'use client';

import type { Transaction } from '../types';
import { useCategories } from '../hooks/useCategories';
import HighlightTitle from './HighlightTitle';
import { formatWon } from '../utils/format';

interface Props {
  /** 오늘 지출 합계 */
  todayExpense: number;
  /** 어제 대비 증감(양수=더 씀, 음수=덜 씀) */
  diff: number;
  /** 오늘 거래 목록(날짜 내림차순) */
  transactions: Transaction[];
}

/**
 * 오늘 내역 미리보기 — 상단에 오늘 총액과 어제 대비, 아래에 오늘 거래를 몇 건 보여준다.
 * (홈에서 캘린더를 걷어낸 대신 '오늘'만 요약해 남긴 섹션)
 */
export default function TodayTransactions({ todayExpense, diff, transactions }: Props) {
  const { byId } = useCategories();
  const preview = transactions.slice(0, 4);

  // diff < 0 이면 어제보다 덜 쓴 것(절약). 방향 화살표로 표시한다.
  const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '';
  const diffText =
    diff === 0
      ? '어제와 같아요'
      : `어제보다 ${formatWon(Math.abs(diff))} ${diff > 0 ? '더' : '덜'} 썼어요 ${arrow}`;

  return (
    <section className="flex flex-col gap-2">
      <div className="px-0.5">
        <HighlightTitle>오늘 내역</HighlightTitle>
      </div>

      <div className="rounded-3xl border border-border bg-card px-4 shadow-sm">
        <div className="flex items-baseline justify-between border-b border-dashed border-border py-3.5">
          <b className="text-lg font-extrabold tabular-nums text-expense">
            −{formatWon(todayExpense)}
          </b>
          <span className="text-[11.5px] text-muted-foreground">{diffText}</span>
        </div>

        {preview.length > 0 ? (
          <ul>
            {preview.map((tx) => {
              const cat = byId(tx.category);
              const isExpense = tx.type === 'expense';
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 border-t border-border py-2.5 first:border-t-0"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isExpense ? 'bg-expense/10' : 'bg-income/10'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat?.color ?? 'hsl(var(--muted-foreground))' }}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-foreground">
                      {tx.memo || cat?.name || '미분류'}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {cat?.name ?? '미분류'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-extrabold tabular-nums ${
                      isExpense ? 'text-expense' : 'text-income'
                    }`}
                  >
                    {isExpense ? '−' : '+'}
                    {formatWon(tx.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-5 text-center text-sm text-muted-foreground">오늘은 아직 기록이 없어요.</p>
        )}
      </div>
    </section>
  );
}
