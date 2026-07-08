'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from '../constants/paymentMethods';
import { useCategories } from '../hooks/useCategories';
import { useRecurring } from '../hooks/useRecurring';
import type { PaymentMethod, RecurringRule, TxType } from '../types';
import { currentMonth } from '../utils/dateRange';

interface Props {
  /** 'add'면 신규 추가, 'edit'면 rule을 수정 */
  mode: 'add' | 'edit';
  /** 수정 모드일 때 대상 규칙 */
  rule?: RecurringRule;
  onClose: () => void;
}

/** 매달 며칠 선택지(1~31). */
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * 고정지출/반복거래 규칙 추가·수정 모달(바텀시트).
 * 종류·금액·카테고리·결제수단·매달 며칠·시작월·메모를 편집한다. 주기는 '매월' 고정.
 */
export default function RecurringModal({ mode, rule, onClose }: Props) {
  const { byType } = useCategories();
  const { addRecurringRule, updateRecurringRule } = useRecurring();

  const [type, setType] = useState<TxType>(rule?.type ?? 'expense');
  const [amount, setAmount] = useState(rule ? String(rule.amount) : '');
  const [category, setCategory] = useState(
    rule?.category ?? byType('expense')[0]?.id ?? '',
  );
  const [method, setMethod] = useState<PaymentMethod>(
    rule?.method ?? DEFAULT_PAYMENT_METHOD,
  );
  const [dayOfMonth, setDayOfMonth] = useState(rule?.dayOfMonth ?? 1);
  const [startMonth, setStartMonth] = useState(rule?.startMonth ?? currentMonth());
  const [memo, setMemo] = useState(rule?.memo ?? '');
  const [error, setError] = useState('');

  const isEdit = mode === 'edit';
  const options = byType(type);

  // Escape로 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleTypeChange(next: TxType) {
    setType(next);
    setCategory(byType(next)[0]?.id ?? '');
  }

  function handleSave() {
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError('금액을 0보다 크게 입력하세요.');
      return;
    }
    if (!category) {
      setError('카테고리를 선택하세요.');
      return;
    }
    const base = {
      type,
      amount: Math.round(amountNum),
      category,
      method: type === 'expense' ? method : undefined,
      dayOfMonth,
      startMonth,
      memo: memo.trim() || undefined,
    };
    if (isEdit && rule) {
      updateRecurringRule({ ...rule, ...base });
    } else {
      addRecurringRule({ ...base, active: true, generatedMonths: [] });
    }
    onClose();
  }

  const inputClass =
    'w-full min-w-0 rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? '반복 규칙 수정' : '반복 규칙 추가'}
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-5 shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더: 닫기 · 제목 · 완료 */}
        <div className="grid grid-cols-[40px_1fr_40px] items-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <h2 className="text-center text-base font-bold text-foreground">
            {isEdit ? '고정거래 수정' : '고정거래 추가'}
          </h2>
          <button
            type="button"
            onClick={handleSave}
            aria-label="완료"
            className="flex h-10 w-10 items-center justify-center rounded-md text-primary transition hover:bg-primary/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {/* 종류 */}
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

          {/* 매달 며칠 · 카테고리 */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex min-w-0 flex-col gap-1 text-sm text-muted-foreground">
              매달 며칠
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className={inputClass}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}일
                  </option>
                ))}
              </select>
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

          {/* 금액 */}
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            금액 (원)
            <input
              type="text"
              inputMode="numeric"
              value={amount === '' ? '' : Number(amount).toLocaleString('ko-KR')}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="0"
              className={inputClass}
            />
          </label>

          {/* 결제수단 (지출만) */}
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
            </div>
          )}

          {/* 시작 월 */}
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            시작 월
            <input
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className={`${inputClass} appearance-none [-webkit-appearance:none]`}
            />
          </label>

          {/* 메모 */}
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            메모 (선택)
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 넷플릭스 구독"
              className={inputClass}
            />
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
