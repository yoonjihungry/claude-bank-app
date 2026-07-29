import { formatWon } from '../utils/format';

interface Props {
  /** 이번 달 예산 합계(카테고리별 예산의 총합). 0이면 예산 미설정으로 본다. */
  budgetTotal: number;
  /** 이번 달 지출 합계 */
  spent: number;
}

/** 작은 체크(격려 뱃지용) */
function CheckIcon() {
  return (
    <svg viewBox="0 0 256 256" className="h-3 w-3" fill="currentColor" aria-hidden="true">
      <path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z" />
    </svg>
  );
}

/**
 * 홈 히어로 — '이번 달 쓸 수 있는 돈'.
 * 예산 합계에서 지출을 뺀 잔액과 사용률 진행바를 보여준다.
 * 예산이 하나도 없으면 진행바 없이 '이번 달 소비'(지출 합계)를 크게 보여줘 빈 화면을 피한다.
 * 색은 카카오페이 옐로(--accent) 단색. 글자·진행바는 근검정(--accent-foreground).
 */
export default function BudgetHeroCard({ budgetTotal, spent }: Props) {
  const hasBudget = budgetTotal > 0;
  const remaining = budgetTotal - spent;
  const pct = hasBudget ? Math.round((spent / budgetTotal) * 100) : 0;
  const barWidth = hasBudget ? Math.min(pct, 100) : 0;
  const over = hasBudget && spent > budgetTotal;

  return (
    <section className="overflow-hidden rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-muted-foreground">
          {hasBudget ? '이번 달 쓸 수 있는 돈' : '이번 달 소비'}
        </p>
        {hasBudget && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10.5px] font-bold text-accent-foreground">
            {over ? '예산 초과' : pct < 80 ? (<><CheckIcon />잘하고 있어요</>) : '거의 다 썼어요'}
          </span>
        )}
      </div>

      <p className="mt-1.5 flex items-baseline text-[34px] font-extrabold tracking-tight tabular-nums text-ink">
        {(hasBudget ? remaining : spent).toLocaleString('ko-KR')}
        <span className="ml-1 text-base font-bold text-muted-foreground">원</span>
      </p>

      {hasBudget && (
        <>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <div className="mt-2.5 flex justify-between text-[11.5px] font-medium text-muted-foreground tabular-nums">
            <span>
              {formatWon(spent)} 사용 ({pct}%)
            </span>
            <span>예산 {formatWon(budgetTotal)}</span>
          </div>
        </>
      )}
    </section>
  );
}
