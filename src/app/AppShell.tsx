'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { LedgerProvider } from '@/context/LedgerContext';
import HeaderAuth from '@/components/HeaderAuth';
import LedgerGate from '@/components/LedgerGate';

/** 콘텐츠 폭 규칙(docs/design-system.md): 모바일 480px, PC(≥768px) 600px, 중앙 정렬 */
const CONTENT = 'mx-auto w-full max-w-[480px] md:max-w-[600px]';

/**
 * 공통 셸(헤더·탭바)을 씌우지 않는 독립 화면 라우트.
 * 자체 헤더/내비/푸터를 가진 완결형 시안(예: /desk)은 여기에 등록한다.
 */
const BARE_ROUTES = ['/desk'];

const TABS: { href: string; label: string }[] = [
  { href: '/', label: '홈' },
  { href: '/transactions', label: '거래' },
  { href: '/budget', label: '카테고리' },
];

/**
 * 앱 셸(헤더 + 하단 탭바 + 전역 Context). App Router의 layout에서 children을 감싼다.
 * 페이지 콘텐츠는 localStorage 기반이라 서버/클라 첫 렌더가 달라 하이드레이션 불일치가
 * 생길 수 있으므로, 마운트 이후에만 children을 렌더해 서버 HTML과 일치시킨다.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 독립 화면 라우트는 공통 셸/전역 Context 없이 페이지만 그대로 렌더한다.
  if (BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return <>{children}</>;
  }

  return (
    <LedgerProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* 헤더 — 좌측 로고 + 우측 로그인/계정 영역(HeaderAuth) */}
        <header className="border-b border-border bg-card">
          <div className={`${CONTENT} flex items-center justify-between px-4 py-4`}>
            <h1 className="text-xl font-bold">💰 가계부</h1>
            <HeaderAuth />
          </div>
        </header>

        {/* 하단 고정 탭바에 가리지 않도록 아래 여백 확보(pb-20 + 안전영역) */}
        <main
          className={`${CONTENT} flex flex-col px-4 pt-5 pb-20`}
          style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        >
          {mounted ? <LedgerGate>{children}</LedgerGate> : null}
        </main>

        {/* 하단 고정 탭바 — 화면 하단 밀착(full-width 사각 + 상단 보더). 버튼 행은 콘텐츠 폭 유지 */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className={`${CONTENT} grid grid-cols-3`}>
            {TABS.map(({ href, label }) => {
              const active =
                href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-16 items-center justify-center text-sm font-medium transition ${
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
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
