'use client';

import { useEffect, useState } from 'react';
import { CATEGORY_PALETTE } from '../constants/categories';
import { useLedger } from '../context/LedgerContext';
import { useCategories } from '../hooks/useCategories';
import type { Category } from '../types';

interface Props {
  /** 'add'면 신규 추가, 'edit'면 category를 수정 */
  mode: 'add' | 'edit';
  /** 예산을 설정할 월 'YYYY-MM' */
  month: string;
  /** 수정 모드일 때 대상 카테고리 */
  category?: Category;
  /** 수정 모드일 때 해당 월의 기존 예산 한도(없으면 0) */
  currentLimit?: number;
  onClose: () => void;
}

/**
 * 지출 카테고리 추가/수정 모달.
 * 헤더(닫기·제목·완료) + 이름 + 색상(프리셋/직접) + 이 달 예산을 편집한다.
 */
export default function CategoryModal({
  mode,
  month,
  category,
  currentLimit = 0,
  onClose,
}: Props) {
  const { addCategory, updateCategory, deleteCategory, byType, nextColor } = useCategories();
  const { transactions, setBudget } = useLedger();

  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? nextColor());
  const [limit, setLimit] = useState(currentLimit > 0 ? String(currentLimit) : '');
  const [error, setError] = useState('');

  const isEdit = mode === 'edit';
  const isPreset = CATEGORY_PALETTE.includes(color);

  // Escape로 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('카테고리 이름을 입력하세요.');
      return;
    }
    const num = Number(limit);
    const safeLimit = Number.isFinite(num) && num > 0 ? Math.round(num) : 0;

    if (isEdit && category) {
      updateCategory({ ...category, name: trimmed, color });
      setBudget({ categoryId: category.id, month, limit: safeLimit });
    } else {
      const id = addCategory({ name: trimmed, type: 'expense', color });
      setBudget({ categoryId: id, month, limit: safeLimit });
    }
    onClose();
  }

  function handleDelete() {
    if (!category) return;
    if (byType('expense').length <= 1) {
      setError('지출 카테고리는 최소 1개가 필요해 삭제할 수 없습니다.');
      return;
    }
    const usedCount = transactions.filter((t) => t.category === category.id).length;
    const message =
      usedCount > 0
        ? `'${category.name}' 카테고리를 삭제할까요?\n이 카테고리로 기록된 거래 ${usedCount}건은 '미분류'로 표시됩니다.`
        : `'${category.name}' 카테고리를 삭제할까요?`;
    if (!window.confirm(message)) return;
    deleteCategory(category.id);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? '카테고리 수정' : '카테고리 추가'}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-card p-5 shadow-lg sm:rounded-2xl"
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
            {isEdit ? '카테고리 수정' : '카테고리 추가'}
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

        {/* 이름 */}
        <div className="mt-5">
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">
            카테고리 이름
          </label>
          <input
            type="text"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="카테고리 이름"
            className="w-full border-b-2 border-primary bg-transparent px-1 py-2 text-lg font-bold text-foreground focus:outline-none"
          />
        </div>

        {/* 색상 */}
        <div className="mt-5">
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">색상</label>
          <div className="grid grid-cols-6 gap-2.5">
            {CATEGORY_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`색상 ${c}`}
                aria-pressed={color === c}
                className={`flex aspect-square items-center justify-center rounded-lg transition ${
                  color === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''
                }`}
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
            {/* 직접 선택 */}
            <label
              className={`relative flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-border text-lg font-bold text-white ${
                !isPreset ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''
              }`}
              style={{
                background: !isPreset
                  ? color
                  : 'conic-gradient(from 0deg, #ef4444, #f59e0b, #84cc16, #22b479, #0ea5e9, #6366f1, #d946ef, #ef4444)',
              }}
              title="직접 선택"
            >
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">＋</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="색상 직접 선택"
              />
            </label>
          </div>
        </div>

        {/* 예산 */}
        <div className="mt-5">
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">
            이 달 예산 (선택)
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1000"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="0"
              className="w-full rounded-md border border-input py-3 pl-3 pr-9 text-right text-base tabular-nums text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              원
            </span>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="mt-6 w-full rounded-md border border-destructive/40 bg-destructive/5 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
          >
            이 카테고리 삭제
          </button>
        )}
      </div>
    </div>
  );
}
