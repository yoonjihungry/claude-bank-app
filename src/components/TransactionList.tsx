'use client';

import { paymentMethodMeta } from '../constants/paymentMethods';
import { useCategories } from '../hooks/useCategories';
import type { Transaction } from '../types';
import { formatDate, formatSignedWon } from '../utils/format';

interface Props {
  transactions: Transaction[];
  /** 없으면 수정 버튼을 숨긴다(조회 전용 목록). */
  onEdit?: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  /** 선택일 패널용 납작한 목록(뉴스캐시 시안) — 행마다 카드(테두리·그림자)를 두르지 않고 구분선만 두며,
   *  색 점·날짜를 빼고 '메모 · 카테고리'를 한 줄 제목으로, 결제수단 뱃지는 그 아래에 둔다. */
  flush?: boolean;
}

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
  flush,
}: Props) {
  const { byId } = useCategories();

  if (transactions.length === 0) {
    return flush ? (
      <p className="py-6 text-center text-sm text-muted-foreground">거래 내역이 없습니다.</p>
    ) : (
      <p className="rounded-lg border border-dashed border-input p-8 text-center text-sm text-muted-foreground">
        거래 내역이 없습니다.
      </p>
    );
  }

  return (
    <ul className={flush ? 'flex flex-col divide-y divide-border' : 'flex flex-col gap-2'}>
      {transactions.map((tx) => {
        const category = byId(tx.category);
        const isExpense = tx.type === 'expense';
        const method = isExpense ? paymentMethodMeta(tx.method) : undefined;
        return (
          <li
            key={tx.id}
            className={
              flush
                ? 'flex items-center gap-3 py-3 first:pt-0 last:pb-0'
                : 'flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm'
            }
          >
            {/* 색 점은 거래 페이지(카드)에서만. 선택일 패널(시안)은 색 점 없이 납작하게. */}
            {!flush && (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: category?.color ?? '#9ca3af' }}
              />
            )}
            <div className="min-w-0 flex-1">
              {flush ? (
                /* 선택일 패널(시안): '메모 · 카테고리'가 한 줄 제목, 결제수단 뱃지는 그 아래. */
                <>
                  <p className="truncate font-semibold text-foreground">
                    {tx.memo ? `${tx.memo} · ` : ''}
                    {category?.name ?? '알 수 없음'}
                  </p>
                  {(method ||
                    (isExpense && !!tx.installmentMonths && tx.installmentMonths >= 2) ||
                    !!tx.recurringId) && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {method && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                            method.id === 'credit'
                              ? 'bg-credit/10 text-credit'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {method.label}
                        </span>
                      )}
                      {isExpense && tx.installmentMonths && tx.installmentMonths >= 2 && (
                        <span className="rounded-md bg-credit/10 px-1.5 py-0.5 text-[11px] font-semibold text-credit">
                          할부 {tx.installmentMonths}개월
                        </span>
                      )}
                      {tx.recurringId && (
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                          고정
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* 거래 페이지(카드): 카테고리가 제목, 아래에 날짜·결제수단·할부·고정, 그 아래 메모. */
                <>
                  <p className="truncate font-medium text-foreground">
                    {category?.name ?? '알 수 없음'}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                    {method && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                          method.id === 'credit'
                            ? 'bg-credit/10 text-credit'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {method.badge}
                      </span>
                    )}
                    {isExpense && tx.installmentMonths && tx.installmentMonths >= 2 && (
                      <span className="rounded-full bg-credit/10 px-1.5 py-0.5 text-[11px] font-semibold text-credit">
                        할부 {tx.installmentMonths}개월
                      </span>
                    )}
                    {tx.recurringId && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                        고정
                      </span>
                    )}
                  </div>
                  {tx.memo && (
                    <p className="truncate text-sm text-muted-foreground">{tx.memo}</p>
                  )}
                </>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={`whitespace-nowrap font-semibold tabular-nums ${
                  isExpense ? 'text-expense' : 'text-income'
                }`}
              >
                {formatSignedWon(isExpense ? -tx.amount : tx.amount)}
              </span>
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(tx)}
                    className="rounded px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted"
                  >
                    수정
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(tx.id)}
                  className="rounded px-2 py-1 text-xs text-destructive transition hover:bg-destructive/10"
                >
                  삭제
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
