'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategorySlice } from '../hooks/useStatistics';
import { formatCurrency, formatWonCompact } from '../utils/format';

interface Props {
  data: CategorySlice[];
}

export default function CategoryChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-input text-sm text-muted-foreground">
        이 달의 지출이 없습니다.
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                {data.map((slice) => (
                  <Cell key={slice.categoryId} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>

          {/* 도넛 가운데 총 지출 — SVG viewBox 대신 HTML 오버레이로 확실히 중앙 정렬 */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[11px] text-muted-foreground">총 지출</span>
            <span className="text-base font-bold text-foreground tabular-nums">
              {formatWonCompact(total)}
            </span>
          </div>
        </div>

        <ul className="flex flex-1 flex-col gap-2">
          {data.map((slice) => (
            <li key={slice.categoryId} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-foreground">{slice.name}</span>
              <span className="ml-auto font-bold text-muted-foreground tabular-nums">
                {Math.round((slice.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
