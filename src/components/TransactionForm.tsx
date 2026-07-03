import { useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import { useCategories } from '../hooks/useCategories';
import type { Transaction, TxType } from '../types';

interface Props {
  /** 수정 모드일 때 초기값. 없으면 신규 입력. */
  initial?: Transaction;
  onSubmit: (data: Omit<Transaction, 'id'>) => void;
  onCancel?: () => void;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

export default function TransactionForm({ initial, onSubmit, onCancel }: Props) {
  const { byType } = useCategories();
  const [type, setType] = useState<TxType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [category, setCategory] = useState(
    initial?.category ?? byType('expense')[0]?.id ?? '',
  );
  const [date, setDate] = useState(initial?.date ?? today());
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [error, setError] = useState('');

  const isEdit = initial != null;
  const options = byType(type);

  function handleTypeChange(next: TxType) {
    setType(next);
    // 타입이 바뀌면 현재 카테고리가 유효하지 않을 수 있으므로 첫 카테고리로 초기화
    setCategory(byType(next)[0]?.id ?? '');
  }

  function reset() {
    setType('expense');
    setAmount('');
    setCategory(byType('expense')[0]?.id ?? '');
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
    'w-full rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
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
                  ? 'bg-expense text-expense-foreground'
                  : 'bg-income text-income-foreground'
                : 'bg-muted text-muted-foreground hover:bg-input'
            }`}
          >
            {t === 'expense' ? '지출' : '수입'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          날짜
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
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

      <label className="flex flex-col gap-1 text-sm text-muted-foreground">
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

      <label className="flex flex-col gap-1 text-sm text-muted-foreground">
        메모 (선택)
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 점심 식사"
          className={inputClass}
        />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {isEdit ? '수정 완료' : '추가'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
