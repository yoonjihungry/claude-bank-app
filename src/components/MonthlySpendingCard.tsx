import { formatWon } from '../utils/format';

interface Props {
  /** 선택 월의 지출 합계 */
  expense: number;
}

/**
 * 섹션 3 — 이번달 소비금액 카드.
 * (참조 이미지의 '주 사용 카드' 목록은 제외)
 */
export default function MonthlySpendingCard({ expense }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">이번달 소비금액</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatWon(expense)}</p>
        </div>
        <span className="text-2xl text-muted-foreground">›</span>
      </div>
    </section>
  );
}
