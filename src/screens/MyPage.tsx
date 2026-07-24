'use client';

// 마이페이지 — 계정 정보 + 통계(월 요약·전월 대비·최근 추세·카테고리·일자별).
// 집계는 useStatistics / useMonthlyTrend 훅에, 시각화는 기존 차트 컴포넌트에 맡기고
// 여기서는 조립만 한다.
import { useState } from 'react';
import CategoryChart from '../components/CategoryChart';
import DailyTrendChart from '../components/DailyTrendChart';
import MonthNavigator from '../components/MonthNavigator';
import MonthlyTrendChart from '../components/MonthlyTrendChart';
import { useMonthlyTrend } from '../hooks/useMonthlyTrend';
import { useStatistics } from '../hooks/useStatistics';
import { currentMonth } from '../utils/dateRange';
import { formatSignedWon, formatWon } from '../utils/format';

/** 요약 숫자 한 칸(제목·금액·전월 대비). */
function SummaryCell({
  label,
  amount,
  delta,
  tone,
}: {
  label: string;
  amount: number;
  delta: number;
  tone: 'income' | 'expense' | 'foreground';
}) {
  const amountColor =
    tone === 'income'
      ? 'text-income'
      : tone === 'expense'
        ? 'text-expense'
        : 'text-foreground';

  return (
    <div className="flex flex-col items-center gap-1 px-2 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-base font-bold ${amountColor}`}>{formatWon(amount)}</span>
      <span className="text-xs text-muted-foreground">
        전월 {formatSignedWon(delta)}
      </span>
    </div>
  );
}

export default function MyPage() {
  const [month, setMonth] = useState(currentMonth());
  const stats = useStatistics(month);
  const trend = useMonthlyTrend(month, 6);

  return (
    <div className="flex flex-col gap-6">
      <MonthNavigator month={month} onChange={setMonth} />

      {/* 이번 달 요약 + 전월 대비 */}
      <section className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-card shadow-sm">
        <SummaryCell label="수입" amount={trend.current.income} delta={trend.delta.income} tone="income" />
        <SummaryCell label="지출" amount={trend.current.expense} delta={trend.delta.expense} tone="expense" />
        <SummaryCell label="잔액" amount={trend.current.net} delta={trend.delta.net} tone="foreground" />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">최근 6개월 추세</h2>
        <MonthlyTrendChart data={trend.months} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">카테고리별 지출</h2>
        <CategoryChart data={stats.expenseByCategory} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">일자별 수입·지출 추이</h2>
        <DailyTrendChart data={stats.dailyTrend} />
      </section>
    </div>
  );
}
