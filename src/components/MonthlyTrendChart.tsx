'use client';

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import type { MonthlyTotals } from '../hooks/useMonthlyTrend';
import { formatWon, formatWonCompact } from '../utils/format';
import { tokenColor } from '../utils/tokenColor';

interface Props {
  data: MonthlyTotals[];
}

/** 'YYYY-MM' → 'M월' (X축 라벨용) */
function monthTick(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

/**
 * 최근 몇 개월의 월별 '지출' 막대. 마지막(기준) 달만 primary로 강조하고 값 말풍선을 띄운다.
 * 나머지 달은 muted 회색. 색은 tokens.css의 --primary / --muted / --foreground를 따른다.
 */
export default function MonthlyTrendChart({ data }: Props) {
  const hasData = data.some((d) => d.expense > 0);
  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-input text-sm text-muted-foreground">
        최근 거래가 없습니다.
      </div>
    );
  }

  const activeIndex = data.length - 1;
  const spentMonths = data.filter((d) => d.expense > 0);
  const avg = Math.round(
    spentMonths.reduce((s, d) => s + d.expense, 0) / spentMonths.length,
  );

  const primary = tokenColor('primary');
  const muted = tokenColor('muted');
  const foreground = tokenColor('foreground');

  /** 기준 달 막대 위에만 뜨는 값 말풍선(SVG). */
  const renderBubble = (props: {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    value?: unknown;
    index?: number;
  }) => {
    if (props.index !== activeIndex) return null;
    const x = Number(props.x);
    const y = Number(props.y);
    const width = Number(props.width);
    const cx = x + width / 2;
    const text = formatWonCompact(Number(props.value));
    const w = text.length * 8.5 + 16;
    const h = 22;
    const left = cx - w / 2;
    const top = y - h - 9;
    return (
      <g>
        <rect x={left} y={top} width={w} height={h} rx={7} fill={foreground} />
        <text
          x={cx}
          y={top + h / 2 + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={700}
          fill="#fff"
        >
          {text}
        </text>
        <polygon
          points={`${cx - 4},${top + h} ${cx + 4},${top + h} ${cx},${top + h + 5}`}
          fill={foreground}
        />
      </g>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 36, right: 8, left: 8, bottom: 0 }}>
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
              formatter={(value) => [formatWon(Number(value)), '지출']}
              labelFormatter={(label) => monthTick(String(label))}
            />
            <Bar dataKey="expense" radius={8} barSize={18} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={d.month} fill={i === activeIndex ? primary : muted} />
              ))}
              <LabelList dataKey="expense" content={renderBubble} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
        <span className="text-sm font-semibold text-muted-foreground">월 평균 지출</span>
        <span className="text-base font-bold text-primary tabular-nums">
          {formatWonCompact(avg)}
        </span>
      </div>
    </div>
  );
}
