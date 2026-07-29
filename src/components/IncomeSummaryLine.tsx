import { formatSignedWon } from '../utils/format';

interface Props {
  /** 이번 달 수입 합계 */
  income: number;
  /** 지난달 수입 대비 증감(양수=늘어남) */
  delta: number;
}

/** 우상향 추세 아이콘 */
function TrendUpIcon() {
  return (
    <svg viewBox="0 0 256 256" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M240,56v64a8,8,0,0,1-13.66,5.66L200,99.31l-58.34,58.35a8,8,0,0,1-11.32,0L96,123.31,29.66,189.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0L136,140.69,188.69,88,162.34,61.66A8,8,0,0,1,168,48h64A8,8,0,0,1,240,56Z" />
    </svg>
  );
}

/**
 * 이번 달 수입 한 줄 요약 — 홈에서 지출 외에 유일하게 고유한 지표라 슬림하게 남긴다.
 */
export default function IncomeSummaryLine({ income, delta }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-income/10 text-income">
        <TrendUpIcon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-ink">이번 달 수입</p>
        <p className="text-[11.5px] text-muted-foreground">지난달 대비 {formatSignedWon(delta)}</p>
      </div>
      <span className="font-extrabold tabular-nums text-income">
        {income.toLocaleString('ko-KR')}
        <span className="ml-0.5 text-[0.72em] font-semibold text-muted-foreground">원</span>
      </span>
    </div>
  );
}
