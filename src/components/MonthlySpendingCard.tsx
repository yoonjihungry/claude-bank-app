import type { CategorySlice } from '../hooks/useStatistics';
import HighlightTitle from './HighlightTitle';
import { formatWon } from '../utils/format';

interface Props {
  /** 선택 월의 지출 합계(신용카드 포함) */
  expense: number;
  /** 그중 신용카드(후불) 결제 합계 */
  creditCard: number;
  /** 지출을 카테고리별로 집계한 조각(내림차순). 상위 3개만 막대로 보여준다. */
  categories: CategorySlice[];
}

/**
 * 섹션 — 이번 달 소비.
 * 총액은 히어로가 이미 말하므로 반복하지 않고, 곧바로 카테고리 Top3 막대와
 * 현금·체크 / 신용(이달 구매) 분해로 들어간다.
 */
export default function MonthlySpendingCard({ expense, creditCard, categories }: Props) {
  const cashCheck = expense - creditCard;
  const top = categories.slice(0, 3);
  const max = top[0]?.value ?? 0;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-0.5">
        <HighlightTitle>이번 달 소비</HighlightTitle>
        <span className="text-xs text-muted-foreground">통계 ›</span>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        {expense > 0 ? (
          <>
            <ul className="flex flex-col gap-3">
              {top.map((c) => (
                <li key={c.categoryId}>
                  <div className="mb-1.5 flex items-center gap-2 text-[12.5px]">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-foreground">{c.name}</span>
                    <b className="ml-auto font-bold tabular-nums text-ink">{formatWon(c.value)}</b>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${max > 0 ? (c.value / max) * 100 : 0}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-2.5">
              <div className="flex-1 rounded-2xl bg-warning/10 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">현금·체크</p>
                <p className="mt-0.5 font-extrabold text-ink tabular-nums">{formatWon(cashCheck)}</p>
              </div>
              <div className="flex-1 rounded-2xl bg-credit/10 px-3 py-2.5">
                <p className="text-xs text-credit">신용 · 이달 구매</p>
                <p className="mt-0.5 font-extrabold text-credit tabular-nums">{formatWon(creditCard)}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">이 달의 지출이 없습니다.</p>
        )}
      </div>
    </section>
  );
}
