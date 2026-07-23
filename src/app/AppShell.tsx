'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { LedgerProvider } from '@/context/LedgerContext';
import HeaderAuth from '@/components/HeaderAuth';
import LedgerGate from '@/components/LedgerGate';
import type { LedgerData } from '@/storage/repository';

/** 콘텐츠 폭 규칙(docs/design-system.md): 모바일 480px, PC(≥768px) 600px, 중앙 정렬 */
const CONTENT = 'mx-auto w-full max-w-[480px] md:max-w-[600px]';

/** 하단 탭 라인 아이콘(NH앱 nav 참고 — 얇은 아웃라인). stroke는 currentColor로 활성색을 따른다. */
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11.3 12 5l8 6.3v6.9a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 18.2z" />
      <line x1="9.6" y1="15.3" x2="14.4" y2="15.3" />
    </svg>
  );
}
function ExchangeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 7H8a3 3 0 0 0 0 6h8a3 3 0 0 1 0 6H7" />
      <path d="M15 4.5 17.5 7 15 9.5" />
      <path d="M9 14.5 6.5 17 9 19.5" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="4.5" width="6.5" height="6.5" rx="1.8" />
      <rect x="13" y="4.5" width="6.5" height="6.5" rx="1.8" />
      <rect x="4.5" y="13" width="6.5" height="6.5" rx="1.8" />
      <rect x="13" y="13" width="6.5" height="6.5" rx="1.8" />
    </svg>
  );
}

const TABS: { href: string; label: string; Icon: () => ReactNode }[] = [
  { href: '/', label: '홈', Icon: HomeIcon },
  { href: '/transactions', label: '거래', Icon: ExchangeIcon },
  { href: '/budget', label: '카테고리', Icon: GridIcon },
];

/**
 * 앱 셸(헤더 + 하단 탭바 + 전역 Context). `(shell)` 그룹의 layout이 children을 감쌀 때 쓴다.
 * 공통 셸이 필요 없는 독립 화면(`/desk`)은 애초에 그 그룹 밖에 있어 여기를 거치지 않는다.
 *
 * 렌더 시점이 두 갈래다.
 * - 로그인(initialData 있음): 서버가 데이터를 실어 보냈으니 곧바로 그린다. 서버 HTML과
 *   클라이언트 첫 렌더가 같은 값을 쓰므로 불일치가 없고, 화면이 처음부터 채워져 나온다.
 * - 비로그인(initialData null): 데이터가 localStorage에만 있어 서버는 알 수 없다.
 *   마운트 전후 결과가 달라지므로 마운트 이후에만 children을 그려 불일치를 피한다.
 */
export default function AppShell({
  initialData,
  children,
}: {
  initialData: LedgerData | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <LedgerProvider initialData={initialData}>
      <div className="min-h-screen bg-background text-foreground">
        {/* 헤더 — 좌측 로고 + 우측 로그인/계정 영역(HeaderAuth) */}
        <header className="border-b border-border bg-card">
          <div className={`${CONTENT} flex items-center justify-between px-4 py-4`}>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
                ₩
              </span>
              <h1 className="text-xl font-bold">가계부</h1>
            </div>
            <HeaderAuth />
          </div>
        </header>

        {/* 하단 고정 탭바에 가리지 않도록 아래 여백 확보(pb-20 + 안전영역) */}
        <main
          className={`${CONTENT} flex flex-col px-4 pt-5 pb-20`}
          style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        >
          {initialData !== null || mounted ? (
            <LedgerGate>{children}</LedgerGate>
          ) : null}
        </main>

        {/* 하단 고정 탭바 — 화면 하단 밀착(full-width 사각 + 상단 보더). 버튼 행은 콘텐츠 폭 유지 */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className={`${CONTENT} grid grid-cols-3`}>
            {TABS.map(({ href, label, Icon }) => {
              const active =
                href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition ${
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {/* 활성 탭 상단 인디케이터(뉴스캐시 시안) */}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                    />
                  )}
                  <Icon />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </LedgerProvider>
  );
}
