'use client';

// 거래 입력/수정 바텀시트. 거래 페이지의 '+' FAB(신규)나 목록의 '수정'으로 열린다.
// 폼을 상단에 상시 노출하지 않고 시트로 옮겨, 내역이 길어져도 리스트가 화면을 다 쓰게 한다.
// 시트/스크림은 항상 마운트하고 open으로 토글 → CSS transition으로 슬라이드(LoginSheet와 동일 패턴).
import { useEffect } from 'react';
import TransactionForm from './TransactionForm';
import type { Transaction } from '../types';

export default function TransactionSheet({
  open,
  onClose,
  initial,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  /** 있으면 수정 모드. 없으면 신규 입력. */
  initial?: Transaction;
  onSubmit: (data: Omit<Transaction, 'id'>) => void;
  /** 수정 모드에서 이 거래를 삭제. 시트 안에서 처리한다(목록 행에는 삭제 버튼을 두지 않는다). */
  onDelete?: (id: string) => void;
}) {
  // Esc로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* 스크림 — 바깥 클릭 시 닫힘 */}
      <button
        type="button"
        aria-label="닫기"
        tabIndex={-1}
        onClick={onClose}
        className={`absolute inset-0 cursor-default bg-foreground/45 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 바텀시트 — 앱 콘텐츠 폭과 동일하게 중앙 정렬. 폼이 길면 시트 안에서 스크롤. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-sheet-title"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[88vh] w-full max-w-[480px] flex-col rounded-t-[22px] border border-border bg-card px-5 pt-2.5 transition-transform duration-300 ease-out md:max-w-[600px] ${
          open
            ? 'translate-y-0 shadow-[0_-10px_40px_-12px_hsl(222_47%_20%/0.3)]'
            : 'translate-y-full'
        }`}
      >
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-[18px] top-4 p-1 text-lg leading-none text-muted-foreground transition hover:text-foreground"
        >
          ✕
        </button>

        {/* 그립 핸들 */}
        <div className="mx-auto mb-3 h-1 w-[38px] shrink-0 rounded-full bg-input" />

        <h3 id="tx-sheet-title" className="mb-3 shrink-0 text-base font-extrabold tracking-tight">
          {initial ? '거래 수정' : '거래 추가'}
        </h3>

        <div className="min-h-0 flex-1 overflow-y-auto pb-1">
          <TransactionForm
            key={initial?.id ?? 'new'}
            initial={initial}
            onSubmit={(data) => {
              onSubmit(data);
              onClose();
            }}
            onCancel={onClose}
          />

          {initial && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(initial.id);
                onClose();
              }}
              className="mt-2 w-full py-2.5 text-sm font-semibold text-destructive transition hover:underline"
            >
              이 거래 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
