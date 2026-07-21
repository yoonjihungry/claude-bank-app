'use client';

import type { ReactNode } from 'react';
import { useLedger } from '@/context/LedgerContext';

/**
 * 가계부 데이터를 다 불러온 뒤에 화면을 그린다.
 *
 * 로컬 저장(비로그인)일 때는 즉시 끝나므로 사실상 보이지 않고,
 * 서버 저장(로그인)일 때만 잠깐 로딩이 보인다. 데이터가 반쯤 빈 상태로
 * 합계·차트가 먼저 그려졌다가 값이 튀는 것을 막는 역할이다.
 */
export default function LedgerGate({ children }: { children: ReactNode }) {
  const { status, reload } = useLedger();

  if (status === 'loading') {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        불러오는 중…
      </p>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-sm text-muted-foreground">데이터를 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={reload}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
