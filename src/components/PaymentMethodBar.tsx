'use client';

// 결제수단별 지출 분해 — 가로 스택 바 + 범례(금액·비율).
// 색은 결제수단마다 tokens.css 토큰을 배정한다: 현금=warning, 체크=primary, 신용=credit, 미지정=회색.
import type { MethodSlice } from '../hooks/useStatistics';
import { formatWon } from '../utils/format';

interface Props {
  data: MethodSlice[];
}

/** 결제수단 → 디자인 토큰 변수명. */
const METHOD_VAR: Record<string, string> = {
  cash: '--warning',
  check: '--primary',
  credit: '--credit',
  none: '--muted-foreground',
};

function colorOf(method: string): string {
  return `hsl(var(${METHOD_VAR[method] ?? '--muted-foreground'}))`;
}

export default function PaymentMethodBar({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-input text-sm text-muted-foreground">
        이 달의 지출이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      {/* 스택 바 — 금액 있는 조각만(0원은 범례에만 남긴다) */}
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {data
          .filter((d) => d.value > 0)
          .map((d) => (
            <div
              key={d.method}
              style={{ width: `${(d.value / total) * 100}%`, backgroundColor: colorOf(d.method) }}
              title={`${d.label} ${formatWon(d.value)}`}
            />
          ))}
      </div>

      {/* 범례 — 금액·비율 */}
      <ul className="mt-4 flex flex-col gap-2.5">
        {data.map((d) => (
          <li key={d.method} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: colorOf(d.method) }}
            />
            <span className="text-foreground">{d.label}</span>
            <span className="ml-auto font-semibold text-muted-foreground tabular-nums">
              {formatWon(d.value)}
            </span>
            <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
