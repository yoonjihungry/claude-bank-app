import { getCategory } from '../constants/categories';
import type { Transaction } from '../types';
import { formatDate, formatSignedCurrency } from '../utils/format';

interface Props {
  transactions: Transaction[];
  /** 없으면 수정 버튼을 숨긴다(조회 전용 목록). */
  onEdit?: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        거래 내역이 없습니다.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {transactions.map((tx) => {
        const category = getCategory(tx.category);
        const isExpense = tx.type === 'expense';
        return (
          <li
            key={tx.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: category?.color ?? '#9ca3af' }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">
                  {category?.name ?? '알 수 없음'}
                </span>
                <span className="text-xs text-gray-400">{formatDate(tx.date)}</span>
              </div>
              {tx.memo && (
                <p className="truncate text-sm text-gray-500">{tx.memo}</p>
              )}
            </div>
            <span
              className={`shrink-0 font-semibold ${
                isExpense ? 'text-red-500' : 'text-green-600'
              }`}
            >
              {formatSignedCurrency(tx.amount, isExpense ? '-' : '+')}
            </span>
            <div className="flex shrink-0 gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(tx)}
                  className="rounded px-2 py-1 text-xs text-gray-500 transition hover:bg-gray-100"
                >
                  수정
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(tx.id)}
                className="rounded px-2 py-1 text-xs text-red-500 transition hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
