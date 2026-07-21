'use client';

import { useEffect } from 'react';

/**
 * 저장 실패를 알리는 토스트. 화면 하단(탭바 위)에 잠깐 떴다 사라진다.
 * 낙관적 반영을 되돌린 뒤 사용자에게 "방금 그거 저장 안 됐다"를 알리는 용도라,
 * 자동으로 닫히더라도 화면 데이터는 이미 서버 기준으로 되돌아가 있다.
 */
export default function ErrorToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-20 z-50 mx-auto flex w-[min(24rem,calc(100%-2rem))] items-center gap-3 rounded-xl bg-destructive px-4 py-3 text-sm text-destructive-foreground shadow-lg"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium hover:bg-destructive-foreground/20"
      >
        닫기
      </button>
    </div>
  );
}
