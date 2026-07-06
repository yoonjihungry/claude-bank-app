import { useState } from 'react';
import { LedgerProvider } from './context/LedgerContext';
import BudgetPage from './pages/BudgetPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';

type Tab = 'dashboard' | 'transactions' | 'budget';

/** 콘텐츠 폭 규칙(docs/design-system.md): 모바일(≤768px) 360px, PC(≥768px) 600px, 중앙 정렬 */
const CONTENT = 'mx-auto w-full max-w-[360px] md:max-w-[600px]';

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
        {/* 헤더 — 로고만 */}
        <header className="border-b border-border bg-card">
          <div className={`${CONTENT} flex items-center px-4 py-4`}>
            <h1 className="text-xl font-bold">💰 가계부</h1>
          </div>
        </header>

        {/* 하단 고정 탭바에 가리지 않도록 아래 여백 확보(pb-28) */}
        <main className={`${CONTENT} flex flex-col px-4 pt-5 pb-28`}>
          {tab === 'dashboard' && <DashboardPage />}
          {tab === 'transactions' && <TransactionsPage />}
          {tab === 'budget' && <BudgetPage />}
        </main>

        {/* 하단 고정 탭바 — 콘텐츠와 같은 폭·중앙 정렬 */}
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4">
          <div
            className={`${CONTENT} pointer-events-auto grid grid-cols-3 rounded-2xl border border-border bg-card shadow-lg`}
          >
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
