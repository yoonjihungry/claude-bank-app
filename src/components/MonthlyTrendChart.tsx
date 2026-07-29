'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import type { MonthlyTotals } from '../hooks/useMonthlyTrend';
import { SERIES_EXPENSE, SERIES_INCOME } from '../utils/chartColor';
import { formatWon, formatWonCompact } from '../utils/format';
import { tokenColor } from '../utils/tokenColor';

interface Props {
  data: MonthlyTotals[];
}

/** 'YYYY-MM' → 'M월' (X축 라벨용) */
function monthTick(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

/** value>0인 달만 평균을 낸다(거래 없는 달이 평균을 끌어내리지 않게). */
function averageOf(data: MonthlyTotals[], pick: (d: MonthlyTotals) => number): number {
  const active = data.filter((d) => pick(d) > 0);
  if (active.length === 0) return 0;
  return Math.round(active.reduce((s, d) => s + pick(d), 0) / active.length);
}

/**
 * 최근 몇 개월의 월별 '수입·지출' 그룹 막대. 수입은 --income(초록), 지출은 --expense(코랄).
 * 아래에 월 평균 수입/지출을 함께 보여준다. 색은 tokens.css 토큰을 따른다.
 */
export default function MonthlyTrendChart({ data }: Props) {
  const hasData = data.some((d) => d.expense > 0 || d.income > 0);
  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-input text-sm text-muted-foreground">
        최근 거래가 없습니다.
      </div>
    );
  }

  // 수입 vs 지출을 파랑 두 농담으로 구분한다(지출=진파랑, 수입=연파랑).
  const income = SERIES_INCOME;
  const expense = SERIES_EXPENSE;
  const avgIncome = averageOf(data, (d) => d.income);
  const avgExpense = averageOf(data, (d) => d.expense);

  return (
    <div className="rounded-2xl bg-card p-3 shadow-sm">
      {/* 범례 */}
      <div className="mb-1 flex items-center justify-end gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: income }} />
          수입
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: expense }} />
          지출
        </span>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 0 }} barGap={2}>
            <XAxis
              dataKey="month"
              tickFormatter={monthTick}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tick={{ fill: tokenColor('muted-foreground') }}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              formatter={(value, name) => [
                formatWon(Number(value)),
                name === 'income' ? '수입' : '지출',
              ]}
              labelFormatter={(label) => monthTick(String(label))}
            />
            <Bar dataKey="income" fill={income} radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
            <Bar dataKey="expense" fill={expense} radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 월 평균 수입 · 지출 */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
          <span className="text-sm font-semibold text-muted-foreground">월 평균 수입</span>
          <span className="text-base font-bold text-income tabular-nums">
            {formatWonCompact(avgIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
          <span className="text-sm font-semibold text-muted-foreground">월 평균 지출</span>
          <span className="text-base font-bold text-expense tabular-nums">
            {formatWonCompact(avgExpense)}
          </span>
        </div>
      </div>
    </div>
  );
}
