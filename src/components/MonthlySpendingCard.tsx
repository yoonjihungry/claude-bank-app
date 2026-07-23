import { formatWon } from '../utils/format';

interface Props {
  /** 선택 월의 지출 합계(신용카드 포함) */
  expense: number;
  /** 그중 신용카드(후불) 결제 합계 */
  creditCard: number;
}

/**
 * 섹션 3 — 이번달 소비금액 카드.
 * 총액은 신용카드를 포함하고, 아래에 현금·체크 / 신용카드 두 타일로 분해해 보여준다.
 */
export default function MonthlySpendingCard({ expense, creditCard }: Props) {
  const cashCheck = expense - creditCard;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">이번달 소비금액</p>
        <span className="text-2xl text-muted-foreground">›</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-ink">{formatWon(expense)}</p>

      {expense > 0 && (
        <div className="mt-3 flex gap-2.5">
          <div className="flex-1 rounded-xl bg-muted/50 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">현금·체크</p>
            <p className="mt-0.5 font-bold text-ink">{formatWon(cashCheck)}</p>
          </div>
          <div className="flex-1 rounded-xl bg-muted/50 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">신용카드</p>
            <p className="mt-0.5 font-bold text-credit">{formatWon(creditCard)}</p>
          </div>
        </div>
      )}
    </section>
  );
}
