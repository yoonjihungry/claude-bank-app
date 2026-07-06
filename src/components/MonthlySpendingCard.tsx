import { formatWon } from '../utils/format';

interface Props {
  /** 선택 월의 지출 합계(신용카드 포함) */
  expense: number;
  /** 그중 신용카드(후불) 결제 합계 */
  creditCard: number;
}

/**
 * 섹션 3 — 이번달 소비금액 카드.
 * 총액은 신용카드를 포함하고, 아래에 현금·체크 / 신용카드로 분해해 보여준다.
 */
export default function MonthlySpendingCard({ expense, creditCard }: Props) {
  const cashCheck = expense - creditCard;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">이번달 소비금액</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatWon(expense)}</p>
          {expense > 0 && (
            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
              <span>
                현금·체크 <span className="font-semibold text-ink">{formatWon(cashCheck)}</span>
              </span>
              <span>
                신용카드 <span className="font-semibold text-credit">{formatWon(creditCard)}</span>
              </span>
            </div>
          )}
        </div>
        <span className="text-2xl text-muted-foreground">›</span>
      </div>
    </section>
  );
}
