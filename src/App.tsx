import { useState } from 'react';
import { LedgerProvider } from './context/LedgerContext';
import BudgetPage from './screens/BudgetPage';
import DashboardPage from './screens/DashboardPage';
import TransactionsPage from './screens/TransactionsPage';

type Tab = 'dashboard' | 'transactions' | 'budget';

/** 콘텐츠 폭 규칙(docs/design-system.md): 모바일(≤768px) 480px, PC(≥768px) 600px, 중앙 정렬 */
const CONTENT = 'mx-auto w-full max-w-[480px] md:max-w-[600px]';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: '홈' },
  { id: 'transactions', label: '거래' },
  { id: 'budget', label: '카테고리' },
];

function App() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <LedgerProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* 헤더 — 좌측 로고 + 우측 로그인 버튼 */}
        <header className="border-b border-border bg-card">
          <div className={`${CONTENT} flex items-center justify-between px-4 py-4`}>
            <h1 className="text-xl font-bold">💰 가계부</h1>
            {/* 로그인 기능은 대기 중(요구사항 미정) — 지금은 UI만, 동작 없음 */}
            <button
              type="button"
              className="rounded-md border border-input px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
            >
              로그인
            </button>
          </div>
        </header>

        {/* 하단 고정 탭바에 가리지 않도록 아래 여백 확보(pb-20 + 안전영역) */}
        <main
          className={`${CONTENT} flex flex-col px-4 pt-5 pb-20`}
          style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        >
          {tab === 'dashboard' && <DashboardPage />}
          {tab === 'transactions' && <TransactionsPage />}
          {tab === 'budget' && <BudgetPage />}
        </main>

        {/* 하단 고정 탭바 — 화면 하단에 밀착(full-width, 사각+상단 보더). 버튼 행은 콘텐츠 폭 유지 */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className={`${CONTENT} grid grid-cols-3`}>
            {TABS.map(({ id, label }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-16 items-center justify-center text-sm font-medium transition ${
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </LedgerProvider>
  );
}

export default App;
