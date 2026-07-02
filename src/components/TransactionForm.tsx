import { useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import { categoriesByType } from '../constants/categories';
import type { Transaction, TxType } from '../types';

interface Props {
  /** 수정 모드일 때 초기값. 없으면 신규 입력. */
  initial?: Transaction;
  onSubmit: (data: Omit<Transaction, 'id'>) => void;
  onCancel?: () => void;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

export default function TransactionForm({ initial, onSubmit, onCancel }: Props) {
  const [type, setType] = useState<TxType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [category, setCategory] = useState(
    initial?.category ?? categoriesByType('expense')[0].id,
  );
  const [date, setDate] = useState(initial?.date ?? today());
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [error, setError] = useState('');

  const isEdit = initial != null;
  const options = categoriesByType(type);

  function handleTypeChange(next: TxType) {
    setType(next);
    // 타입이 바뀌면 현재 카테고리가 유효하지 않을 수 있으므로 첫 카테고리로 초기화
    setCategory(categoriesByType(next)[0].id);
  }

  function reset() {
    setType('expense');
    setAmount('');
    setCategory(categoriesByType('expense')[0].id);
    setDate(today());
    setMemo('');
    setError('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError('금액을 0보다 크게 입력하세요.');
      return;
    }
    onSubmit({
      type,
      amount: Math.round(amountNum),
      category,
      date,
      memo: memo.trim() || undefined,
    });
    if (!isEdit) reset();
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="flex gap-2">
        {(['expense', 'income'] as TxType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              type === t
                ? t === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'expense' ? '지출' : '수입'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          날짜
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          카테고리
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        금액 (원)
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className={inputClass}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        메모 (선택)
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 점심 식사"
          className={inputClass}
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {isEdit ? '수정 완료' : '추가'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
