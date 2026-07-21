'use client';

import { useState, type FormEvent } from 'react';
import { INSTALLMENT_MONTHS } from '../constants/installments';
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from '../constants/paymentMethods';
import { useCategories } from '../hooks/useCategories';
import { useRecurring } from '../hooks/useRecurring';
import { formatWon } from '../utils/format';
import { todayISO } from '../utils/dateRange';
import type { PaymentMethod, Transaction, TxType } from '../types';

interface Props {
  /** 수정 모드일 때 초기값. 없으면 신규 입력. */
  initial?: Transaction;
  onSubmit: (data: Omit<Transaction, 'id'>) => void;
  onCancel?: () => void;
}

// 날짜 기본값도 앱 전체와 같은 기준(한국 시간)을 쓴다 — utils/dateRange 참고.
const today = todayISO;

export default function TransactionForm({ initial, onSubmit, onCancel }: Props) {
  const { byType } = useCategories();
  const { addRecurringRule } = useRecurring();
  const [type, setType] = useState<TxType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [category, setCategory] = useState(
    initial?.category ?? byType('expense')[0]?.id ?? '',
  );
  const [date, setDate] = useState(initial?.date ?? today());
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [method, setMethod] = useState<PaymentMethod>(
    initial?.method ?? DEFAULT_PAYMENT_METHOD,
  );
  // 할부 개월수(1 = 일시불). 신용카드에서만 의미가 있다.
  const [installmentMonths, setInstallmentMonths] = useState(
    initial?.installmentMonths ?? 1,
  );
  // 매달 반복(고정거래) 등록 여부. 신규 입력에서만 노출한다.
  const [repeat, setRepeat] = useState(false);
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
    setMethod(DEFAULT_PAYMENT_METHOD);
    setInstallmentMonths(1);
    setRepeat(false);
    setError('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError('금액을 0보다 크게 입력하세요.');
      return;
    }
    const roundedAmount = Math.round(amountNum);
    // 결제수단은 지출에만 저장한다.
    const txMethod = type === 'expense' ? method : undefined;
    onSubmit({
      type,
      amount: roundedAmount,
      category,
      date,
      memo: memo.trim() || undefined,
      method: txMethod,
      // 할부는 신용카드 지출에서 2개월 이상일 때만 저장한다.
      installmentMonths:
        type === 'expense' && method === 'credit' && installmentMonths >= 2
          ? installmentMonths
          : undefined,
    });
    // '매달 반복' 체크 시(신규 입력만) 고정거래 규칙을 함께 등록한다.
    // 방금 입력한 거래가 이 달치이므로, 그 달을 generatedMonths에 넣어 중복 생성을 막는다.
    if (!isEdit && repeat) {
      const startMonth = date.slice(0, 7);
      addRecurringRule({
        type,
        amount: roundedAmount,
        category,
        method: txMethod,
        dayOfMonth: Number(date.slice(8, 10)),
        memo: memo.trim() || undefined,
        startMonth,
        active: true,
        generatedMonths: [startMonth],
      });
    }
    if (!isEdit) reset();
  }

  const inputClass =
    'w-full min-w-0 rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

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
        <label className="flex min-w-0 flex-col gap-1 text-sm text-muted-foreground">
          날짜
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            // iOS Safari: 네이티브 date는 appearance를 끄지 않으면 width/min-width를
            // 무시하고 고유 너비로 넘쳐 옆 칸을 덮는다. appearance-none으로 폭 제약을 따르게 함.
            className={`${inputClass} appearance-none [-webkit-appearance:none]`}
            required
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm text-muted-foreground">
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
          type="text"
          inputMode="numeric"
          // 저장은 숫자만, 표시는 천단위 콤마. (type=number는 콤마 표기가 불가)
          value={amount === '' ? '' : Number(amount).toLocaleString('ko-KR')}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="0"
          className={inputClass}
          required
        />
      </label>

      {type === 'expense' && (
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          결제수단
          <div className="grid grid-cols-3 gap-2 [&>button]:min-w-0">
            {PAYMENT_METHODS.map((m) => {
              const on = method === m.id;
              const isCredit = m.id === 'credit';
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  aria-pressed={on}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                    on
                      ? isCredit
                        ? 'border-credit bg-credit/10 text-credit'
                        : 'border-primary bg-primary/10 text-primary'
                      : 'border-input text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          {method === 'credit' && (
            <div className="mt-1 flex flex-col gap-1">
              <span className="text-sm">할부</span>
              <select
                value={installmentMonths}
                onChange={(e) => setInstallmentMonths(Number(e.target.value))}
                className={inputClass}
              >
                <option value={1}>일시불</option>
                {INSTALLMENT_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}개월
                  </option>
                ))}
              </select>
              {installmentMonths >= 2 && Number(amount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  매달 약 {formatWon(Math.floor(Number(amount) / installmentMonths))}씩{' '}
                  {installmentMonths}회 청구 (1/{installmentMonths} · 2/{installmentMonths} …)
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!isEdit && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-input px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">매달 반복</span>
            <span className="text-xs text-muted-foreground">
              {repeat
                ? `다음 달부터 매달 ${Number(date.slice(8, 10))}일에 자동 기록돼요.`
                : '월세·구독료·급여처럼 매달 반복되는 항목이면 켜세요.'}
            </span>
          </span>
        </label>
      )}

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
