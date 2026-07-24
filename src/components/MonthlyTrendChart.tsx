'use client';

import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import type { MonthlyTotals } from '../hooks/useMonthlyTrend';
import { formatWon } from '../utils/format';
import { tokenColor } from '../utils/tokenColor';

interface Props {
  data: MonthlyTotals[];
}

/** 'YYYY-MM' → 'M월' (X축 라벨용) */
function monthTick(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

/**
 * 최근 몇 개월의 월별 수입·지출 막대. 색은 tokens.css의 --income / --expense를 따른다.
 */
export default function MonthlyTrendChart({ data }: Props) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);
  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-input text-sm text-muted-foreground">
        최근 거래가 없습니다.
      </div>
    );
  }

  const income = tokenColor('income');
  const expense = tokenColor('expense');

  return (
    <div className="h-64 w-full rounded-lg border border-border bg-card p-2 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 12, left: 12, bottom: 0 }}>
          <XAxis dataKey="month" tickFormatter={monthTick} fontSize={12} tickLine={false} />
          <Tooltip
            formatter={(value, name) => [
              formatWon(Number(value)),
              name === 'income' ? '수입' : '지출',
            ]}
            labelFormatter={(label) => monthTick(String(label))}
          />
          <Legend formatter={(value) => (value === 'income' ? '수입' : '지출')} />
          <Bar dataKey="income" fill={income} radius={[4, 4, 0, 0]} barSize={16} />
          <Bar dataKey="expense" fill={expense} radius={[4, 4, 0, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
