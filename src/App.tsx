import { useState } from 'react';
import { LedgerProvider } from './context/LedgerContext';
import BudgetPage from './pages/BudgetPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';

type Tab = 'dashboard' | 'transactions' | 'budget';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'transactions', label: '거래' },
  { id: 'budget', label: '예산' },
];

function App() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <LedgerProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
            <h1 className="text-xl font-bold">💰 가계부</h1>
            <nav className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    tab === t.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-6">
          {tab === 'dashboard' && <DashboardPage />}
          {tab === 'transactions' && <TransactionsPage />}
          {tab === 'budget' && <BudgetPage />}
        </main>
      </div>
    </LedgerProvider>
  );
}

export default App;
