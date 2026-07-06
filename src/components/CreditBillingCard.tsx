import type { CreditBillItem } from '../hooks/useStatistics';
import { formatWon } from '../utils/format';

interface Props {
  /** 이번 달 신용카드 청구 예정 합계(할부는 회차분만) */
  total: number;
  /** 청구 항목 목록 */
  items: CreditBillItem[];
}

/**
 * 이번 달 카드 청구 예정 — 신용카드 후불 결제를 청구 시점 기준으로 보여준다.
 * 할부는 이번 달 회차분(예: 1/6)만 합산하고, 각 항목에 회차를 표시한다.
 */
export default function CreditBillingCard({ total, items }: Props) {
  return (
    <section className="rounded-2xl border border-credit/35 bg-credit/6 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">이번 달 카드 청구 예정</p>
        <span className="rounded-full bg-credit/15 px-2 py-0.5 text-xs font-semibold text-credit">
          할부 반영
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold text-credit">{formatWon(total)}</p>

      {items.length > 0 ? (
        <ul className="mt-3 flex flex-col">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 border-t border-credit/15 py-2 text-sm first:border-t-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium text-foreground">{item.name}</span>
                  {item.months >= 2 ? (
                    <span className="shrink-0 rounded-full bg-credit/12 px-1.5 py-0.5 text-[11px] font-semibold text-credit">
                      {item.round}/{item.months}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      일시불
                    </span>
                  )}
                </div>
                {item.memo && (
                  <p className="truncate text-xs text-muted-foreground">{item.memo}</p>
                )}
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-credit">
                {formatWon(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">이번 달 신용카드 청구 예정 금액이 없습니다.</p>
      )}

      {items.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          할부는 이번 달 청구분만 합산 · 총 {items.length}건
        </p>
      )}
    </section>
  );
}
