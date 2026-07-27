'use client';

import {
  Bar,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import type { DailyTrendPoint } from '../hooks/useStatistics';
import { formatWon } from '../utils/format';
import { tokenColor } from '../utils/tokenColor';

interface Props {
  data: DailyTrendPoint[];
  /**
   * true면 순액 막대를 빼고 누적 순액 꺾은선 하나만 그린다. 좁은 구간(주 단위)에서
   * 막대와 선을 함께 그리면 서로 스케일이 안 맞아 막대가 얇게 눌려붙어 통일성이 없다.
   * 마이페이지가 이 옵션을 쓰고, 거래 페이지는 기본값(false)으로 막대+선을 그대로 유지.
   */
  lineOnly?: boolean;
}

/** 'YYYY-MM-DD' → 'M/D' (X축 라벨용) */
function dayTick(iso: string): string {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

/** 누적선 라벨 축약: 만원 단위, 0은 생략 */
function trendLabel(value: number): string {
  if (value === 0) return '';
  return value.toLocaleString('ko-KR');
}

/**
 * 일자별 순액(수입−지출) 막대 + 누적 순액 꺾은선.
 * lineOnly면 막대를 빼고 누적선만 그린다. 색은 tokens.css의 --primary 계열을 따른다.
 */
export default function DailyTrendChart({ data, lineOnly = false }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-input text-sm text-muted-foreground">
        이 달의 거래가 없습니다.
      </div>
    );
  }

  const primary = tokenColor('primary');
  // 점마다 붙는 누적 금액 라벨은 점이 많으면 서로 겹친다 → 짧은 구간에서만 보여준다.
  const showLabels = data.length <= 8;

  return (
    <div className="h-64 w-full rounded-lg border border-border bg-card p-2 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 24, right: 12, left: 12, bottom: 0 }}>
          <XAxis dataKey="date" tickFormatter={dayTick} fontSize={12} tickLine={false} />
          {/* 0 기준선(점선) — 막대의 +/- 구분용이라 막대가 없는 lineOnly에선 생략 */}
          {!lineOnly && (
            <ReferenceLine y={0} stroke={primary} strokeDasharray="4 4" strokeOpacity={0.4} />
          )}
          <Tooltip
            formatter={(value, name) => [
              formatWon(Number(value)),
              name === 'net' ? '순액' : '누적',
            ]}
            labelFormatter={(label) => dayTick(String(label))}
          />
          {!lineOnly && (
            <Bar dataKey="net" fill={primary} fillOpacity={0.18} radius={[4, 4, 0, 0]} barSize={22} />
          )}
          <Line
            dataKey="cumulative"
            stroke={primary}
            strokeWidth={2}
            dot={{ r: 4, fill: 'white', stroke: primary, strokeWidth: 2 }}
          >
            {(showLabels || !lineOnly) && (
              <LabelList
                dataKey="cumulative"
                position="top"
                formatter={(value) => trendLabel(Number(value))}
                fontSize={11}
                fill={primary}
              />
            )}
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
