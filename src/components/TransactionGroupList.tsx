'use client';

// 거래 페이지 내역 — 날짜별로 묶어 보여준다. 그룹 헤더에 '그날 합계'(순액),
// 각 행은 카드 없이 구분선만 두고 제목(메모/카테고리)·카테고리·결제수단·금액을 담는다.
// 행을 탭하면 수정 시트가 열린다(수정/삭제 버튼을 행마다 두지 않아 목록이 깔끔하다).
import { paymentMethodMeta } from '../constants/paymentMethods';
import { useCategories } from '../hooks/useCategories';
import type { Transaction } from '../types';
import { formatDayLabel } from '../utils/format';

/** 숫자 + 작은 '원'. 지출은 잉크, 수입은 초록. */
function Amount({ value, sign, income }: { value: number; sign: '+' | '−'; income?: boolean }) {
  return (
    <span
      className={`whitespace-nowrap font-extrabold tabular-nums ${
        income ? 'text-income' : 'text-ink'
      }`}
    >
      {sign}
      {value.toLocaleString('ko-KR')}
      <span className="ml-0.5 text-[0.72em] font-semibold text-muted-foreground">원</span>
    </span>
  );
}

export default function TransactionGroupList({
  transactions,
  onSelect,
}: {
  transactions: Transaction[];
  /** 행 탭 → 수정 시트 열기 */
  onSelect: (tx: Transaction) => void;
}) {
  const { byId } = useCategories();

  if (transactions.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        거래 내역이 없습니다.
      </p>
    );
  }

  // 날짜별 그룹 — useTransactions가 날짜 내림차순으로 주므로 순서대로 묶는다.
  const groups: { date: string; items: Transaction[] }[] = [];
  for (const tx of transactions) {
    const last = groups[groups.length - 1];
    if (last && last.date === tx.date) last.items.push(tx);
    else groups.push({ date: tx.date, items: [tx] });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {groups.map(({ date, items }) => {
        const net = items.reduce((s, t) => s + (t.type === 'expense' ? -t.amount : t.amount), 0);
        return (
          <div key={date} className="overflow-hidden rounded-2xl bg-card shadow-sm">
            <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
              <span className="text-[13px] font-extrabold tracking-tight text-foreground">
                {formatDayLabel(date)}
              </span>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {net < 0 ? '−' : '+'}
                {Math.abs(net).toLocaleString('ko-KR')}원
              </span>
            </div>
            {items.map((tx) => {
              const cat = byId(tx.category);
              const isExpense = tx.type === 'expense';
              const method = isExpense ? paymentMethodMeta(tx.method) : undefined;
              const sub = [
                cat?.name ?? '미분류',
                method?.label,
                isExpense && tx.installmentMonths && tx.installmentMonths >= 2
                  ? `할부 ${tx.installmentMonths}개월`
                  : undefined,
                tx.recurringId ? '고정' : undefined,
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => onSelect(tx)}
                  className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left transition hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {tx.memo || cat?.name || '미분류'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{sub}</p>
                  </div>
                  <Amount value={tx.amount} sign={isExpense ? '−' : '+'} income={!isExpense} />
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
