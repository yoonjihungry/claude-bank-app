import type { CreditBillItem } from '../hooks/useStatistics';
import HighlightTitle from './HighlightTitle';
import { formatWon } from '../utils/format';

interface Props {
  /** 이번 달 신용카드 청구 예정 합계(할부는 회차분만) */
  total: number;
  /** 청구 항목 목록 */
  items: CreditBillItem[];
}

/**
 * 이번 달 카드 청구 예정 — 신용카드 후불 결제를 청구 시점 기준으로 보여준다.
 * 할부는 이번 달 회차분(예: 3/6)만 합산하고, 각 항목에 회차를 표시한다.
 *
 * 색 규칙: 금액·총액·이름은 잉크색(text-foreground/ink)으로 또렷하게 두고,
 * 신용(보라, --credit)은 '할부 회차 배지'에만 액센트로 남긴다. 결제수단은 색이 아니라
 * 라벨로 구분한다.
 */
export default function CreditBillingCard({ total, items }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <div className="px-0.5">
        <HighlightTitle>카드 청구 예정</HighlightTitle>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground">이달 청구 · 결제일에 빠져나가요</span>
          <span className="text-xl font-extrabold tabular-nums text-ink">
            {total.toLocaleString('ko-KR')}
            <span className="ml-0.5 text-[0.6em] font-semibold text-muted-foreground">원</span>
          </span>
        </div>

        {items.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium text-foreground">{item.name}</span>
                    {item.months >= 2 && (
                      <span className="shrink-0 rounded-full bg-credit/12 px-1.5 py-0.5 text-[11px] font-semibold text-credit">
                        {item.round}/{item.months}
                      </span>
                    )}
                  </div>
                  {item.memo && <p className="truncate text-xs text-muted-foreground">{item.memo}</p>}
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-ink">
                  {formatWon(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">이번 달 신용카드 청구 예정 금액이 없습니다.</p>
        )}
      </div>
    </section>
  );
}
