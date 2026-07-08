'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_PALETTE } from '../constants/categories';
import { useLedger } from '../context/LedgerContext';
import { useCategories } from '../hooks/useCategories';
import type { Category } from '../types';
import { hexToHsv, hsvToHex, hsvToRgb, type Hsv } from '../utils/color';

/** 색상 선택기 초기값(선택된 색을 못 읽을 때 쓰는 기본 파랑). */
const DEFAULT_HSV: Hsv = { h: 213, s: 0.63, v: 0.85 };

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
  const { all, addCategory, updateCategory, deleteCategory, byType, nextColor } =
    useCategories();
  const { transactions, setBudget } = useLedger();

  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? nextColor());
  const [limit, setLimit] = useState(currentLimit > 0 ? String(currentLimit) : '');
  // 직접 추가한 색(이번 세션에서 색상 선택기로 확정한 스와치).
  const [extraColors, setExtraColors] = useState<string[]>([]);
  // 커스텀 색상 선택기 열림 여부 + 현재 고르는 중인 HSV.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>(DEFAULT_HSV);
  const [error, setError] = useState('');

  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const isEdit = mode === 'edit';

  // 표시할 색 스와치: 기본 팔레트 + 이미 카테고리가 쓰는 색 + 이번에 직접 추가한 색.
  const swatches = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const c of [...CATEGORY_PALETTE, ...all.map((cat) => cat.color), ...extraColors]) {
      const key = c.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(c);
      }
    }
    return list;
  }, [all, extraColors]);

  // 선택기에서 지금 고르는 중인 색(HEX·RGB·색조 순색).
  const draftHex = hsvToHex(hsv);
  const hueHex = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const [dr, dg, db] = hsvToRgb(hsv);

  function openPicker() {
    // 현재 선택된 색을 시작점으로 열어 이어서 조정할 수 있게 한다.
    setHsv(hexToHsv(color) ?? DEFAULT_HSV);
    setPickerOpen(true);
  }

  function confirmColor() {
    setExtraColors((prev) =>
      prev.some((c) => c.toLowerCase() === draftHex.toLowerCase()) ? prev : [...prev, draftHex],
    );
    setColor(draftHex);
    setPickerOpen(false);
  }

  // 채도/명도 박스 드래그: x=채도, y=명도(위가 밝음).
  function trackSv(e: React.PointerEvent<HTMLDivElement>) {
    const el = svRef.current;
    if (!el) return;
    const apply = (cx: number, cy: number) => {
      const rect = el.getBoundingClientRect();
      const s = Math.min(1, Math.max(0, (cx - rect.left) / rect.width));
      const v = 1 - Math.min(1, Math.max(0, (cy - rect.top) / rect.height));
      setHsv((prev) => ({ ...prev, s, v }));
    };
    apply(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => apply(ev.clientX, ev.clientY);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  // 색조 슬라이더 드래그: x=색조(0~360).
  function trackHue(e: React.PointerEvent<HTMLDivElement>) {
    const el = hueRef.current;
    if (!el) return;
    const apply = (cx: number) => {
      const rect = el.getBoundingClientRect();
      const h = Math.min(360, Math.max(0, ((cx - rect.left) / rect.width) * 360));
      setHsv((prev) => ({ ...prev, h }));
    };
    apply(e.clientX);
    const move = (ev: PointerEvent) => apply(ev.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

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
            {swatches.map((c) => {
              const selected = color.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`색상 ${c}`}
                  aria-pressed={selected}
                  className={`flex aspect-square items-center justify-center rounded-lg transition ${
                    selected ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {selected && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
            {/* 직접 고르기 — 앱 내 커스텀 색상 선택기를 연다. */}
            <button
              type="button"
              onClick={openPicker}
              aria-label="색 직접 고르기"
              aria-expanded={pickerOpen}
              className="flex aspect-square items-center justify-center rounded-lg border-2 border-border text-lg font-bold text-white"
              style={{
                background:
                  'conic-gradient(from 0deg, #ef4444, #f59e0b, #84cc16, #22b479, #0ea5e9, #6366f1, #d946ef, #ef4444)',
              }}
            >
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">＋</span>
            </button>
          </div>

          {/* 커스텀 색상 선택기 패널 — 우상단 ✓(확인)로 팔레트에 추가·선택 */}
          {pickerOpen && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-sm font-semibold text-foreground">색 고르기</span>
                <button
                  type="button"
                  onClick={confirmColor}
                  aria-label="이 색 추가"
                  className="flex h-9 w-9 items-center justify-center rounded-md text-primary transition hover:bg-primary/10"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>

              {/* 채도/명도 박스 */}
              <div
                ref={svRef}
                onPointerDown={trackSv}
                className="relative h-40 w-full cursor-crosshair touch-none select-none"
                style={{
                  background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0)), ${hueHex}`,
                }}
              >
                <span
                  className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                  style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
                />
              </div>

              <div className="flex flex-col gap-3 p-3">
                {/* 색조 슬라이더 */}
                <div
                  ref={hueRef}
                  onPointerDown={trackHue}
                  className="relative h-3.5 w-full cursor-pointer touch-none select-none rounded-full"
                  style={{
                    background:
                      'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
                  }}
                >
                  <span
                    className="pointer-events-none absolute top-1/2 h-4.5 w-4.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                    style={{ left: `${(hsv.h / 360) * 100}%` }}
                  />
                </div>

                {/* 미리보기 + RGB + HEX */}
                <div className="flex items-center gap-3">
                  <span
                    className="h-10 w-10 shrink-0 rounded-lg border border-border"
                    style={{ backgroundColor: draftHex }}
                  />
                  <div className="grid flex-1 grid-cols-3 gap-2">
                    {([['R', dr], ['G', dg], ['B', db]] as const).map(([lab, val]) => (
                      <div key={lab} className="flex flex-col items-center gap-0.5">
                        <span className="w-full rounded-md border border-input py-1.5 text-center text-sm tabular-nums text-foreground">
                          {val}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{lab}</span>
                      </div>
                    ))}
                  </div>
                  <span className="shrink-0 text-xs uppercase tabular-nums text-muted-foreground">
                    {draftHex}
                  </span>
                </div>
              </div>
            </div>
          )}
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
