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

  // diff > 0: 어제보다 더 씀, diff < 0: 덜 씀(절약). 파란 히어로 위에선 색 대신 화살표로 방향만 표시한다.
  const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '';

  return (
    // 파란 그라데이션 히어로. 색은 tokens.css의 --hero-* 트리플릿을 hsl()로 감싸 합성한다.
    <section
      className="overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-sm"
      style={{
        backgroundImage:
          'linear-gradient(150deg, hsl(var(--hero-from)) 0%, hsl(var(--hero-mid)) 55%, hsl(var(--hero-to)) 100%)',
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">오늘의 소비</h2>
        <div className="flex items-center gap-2 text-xs text-primary-foreground/80">
          {/* 마운트 전에는 빈 자리를 유지해 시각이 채워질 때 레이아웃이 흔들리지 않게 한다. */}
          <span className="tabular-nums">
            {updatedAt ? format(updatedAt, 'MM.dd HH:mm:ss') : ' '}
          </span>
          <button
            type="button"
            onClick={() => setUpdatedAt(new Date())}
            aria-label="새로고침"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20 transition hover:bg-primary-foreground/30"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className="mt-2">
        <span className="text-4xl font-bold tracking-tight">{formatWon(todayExpense)}</span>
      </div>

      <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-foreground/20 px-4 py-2.5 text-sm font-medium">
        <span>
          어제와 비교 <span className="font-bold">{formatSignedWon(diff)}</span>
        </span>
        {arrow && <span aria-hidden="true">{arrow}</span>}
      </div>
    </section>
  );
}
