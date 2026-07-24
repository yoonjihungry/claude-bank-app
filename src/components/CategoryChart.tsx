'use client';

import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategorySlice } from '../hooks/useStatistics';
import { formatCurrency, formatWonCompact } from '../utils/format';
import { tokenColor } from '../utils/tokenColor';

interface Props {
  data: CategorySlice[];
}

/** 도넛 가운데(총 지출) 라벨. viewBox의 중심 좌표에 두 줄로 그린다. */
function CenterLabel({
  viewBox,
  total,
}: {
  viewBox?: { cx?: number; cy?: number };
  total: number;
}) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <text x={cx} y={cy} textAnchor="middle">
      <tspan x={cx} dy="-0.5em" fontSize="11" fill={tokenColor('muted-foreground')}>
        총 지출
      </tspan>
      <tspan
        x={cx}
        dy="1.6em"
        fontSize="16"
        fontWeight="700"
        fill={tokenColor('foreground')}
      >
        {formatWonCompact(total)}
      </tspan>
    </text>
  );
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
        <div className="h-40 w-40 shrink-0">
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
                <Label content={<CenterLabel total={total} />} position="center" />
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
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
