import { DEFAULT_CATEGORIES } from '@/constants/categories';
import type { Budget, Category, RecurringRule, Transaction } from '@/types';
import { runRecurring } from '@/utils/recurring';

/**
 * 가계부 데이터 저장소 계층.
 *
 * 두 가지 구현을 같은 인터페이스 뒤에 둔다.
 * - `local`  : 비로그인 사용자 — localStorage (기존 동작)
 * - `server` : 로그인 사용자 — `/api/*` 라우트 → Postgres
 *
 * 컴포넌트/훅은 여기를 거치지 않고 LedgerContext만 쓰며, localStorage를 직접 호출하지 않는다.
 * 모든 메서드가 비동기인 이유는 서버 구현 때문이다 — 로컬 구현도 인터페이스를 맞추려고
 * Promise를 돌려주지만 실제로는 동기적으로 끝난다.
 */

export interface LedgerData {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  recurringRules: RecurringRule[];
}

export interface LedgerRepository {
  loadAll(): Promise<LedgerData>;

  addTransaction(tx: Transaction): Promise<void>;
  updateTransaction(tx: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;

  /** categoryId+month 기준 upsert. limit<=0이면 예산을 제거한다. */
  setBudget(budget: Budget): Promise<void>;

  addCategory(category: Category): Promise<void>;
  updateCategory(category: Category): Promise<void>;
  /** 카테고리와 그에 걸린 예산을 함께 제거한다(거래는 '미분류'로 남는다). */
  deleteCategory(id: string): Promise<void>;

  addRecurringRule(rule: RecurringRule): Promise<void>;
  updateRecurringRule(rule: RecurringRule): Promise<void>;
  /** 규칙만 삭제한다(이미 생성된 과거 거래는 유지). */
  deleteRecurringRule(id: string): Promise<void>;

  /**
   * 밀린 고정거래를 throughMonth까지 생성하고, 갱신된 거래·규칙 전체를 돌려준다.
   * 바뀐 것이 없으면 null.
   */
  runRecurring(
    throughMonth: string,
  ): Promise<Pick<LedgerData, 'transactions' | 'recurringRules'> | null>;
}

// ─────────────────────────────────────────────
// localStorage 구현 (비로그인)
// ─────────────────────────────────────────────

const KEYS = {
  transactions: 'bankapp.transactions',
  budgets: 'bankapp.budgets',
  categories: 'bankapp.categories',
  recurringRules: 'bankapp.recurringRules',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // 파싱 실패(손상된 데이터 등) 시 안전하게 기본값 반환
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패(용량 초과 등)는 조용히 무시 — 앱 크래시 방지
  }
}

/** 로컬은 개별 저장이 불가능해 배열 통째로 읽고 쓴다. 규모가 작아 문제되지 않는다. */
const localRepository: LedgerRepository = {
  async loadAll() {
    return {
      transactions: read<Transaction[]>(KEYS.transactions, []),
      budgets: read<Budget[]>(KEYS.budgets, []),
      // 저장된 카테고리가 없으면 기본 카테고리로 시드한다.
      categories: read<Category[]>(KEYS.categories, DEFAULT_CATEGORIES),
      recurringRules: read<RecurringRule[]>(KEYS.recurringRules, []),
    };
  },

  async addTransaction(tx) {
    write(KEYS.transactions, [tx, ...read<Transaction[]>(KEYS.transactions, [])]);
  },

  async updateTransaction(tx) {
    const list = read<Transaction[]>(KEYS.transactions, []);
    write(
      KEYS.transactions,
      list.map((t) => (t.id === tx.id ? tx : t)),
    );
  },

  async deleteTransaction(id) {
    const list = read<Transaction[]>(KEYS.transactions, []);
    write(
      KEYS.transactions,
      list.filter((t) => t.id !== id),
    );
  },

  async setBudget(budget) {
    const list = read<Budget[]>(KEYS.budgets, []);
    const rest = list.filter(
      (b) => !(b.categoryId === budget.categoryId && b.month === budget.month),
    );
    write(KEYS.budgets, budget.limit > 0 ? [...rest, budget] : rest);
  },

  async addCategory(category) {
    write(KEYS.categories, [
      ...read<Category[]>(KEYS.categories, DEFAULT_CATEGORIES),
      category,
    ]);
  },

  async updateCategory(category) {
    const list = read<Category[]>(KEYS.categories, DEFAULT_CATEGORIES);
    write(
      KEYS.categories,
      list.map((c) => (c.id === category.id ? category : c)),
    );
  },

  async deleteCategory(id) {
    const categories = read<Category[]>(KEYS.categories, DEFAULT_CATEGORIES);
    write(
      KEYS.categories,
      categories.filter((c) => c.id !== id),
    );
    const budgets = read<Budget[]>(KEYS.budgets, []);
    write(
      KEYS.budgets,
      budgets.filter((b) => b.categoryId !== id),
    );
  },

  async addRecurringRule(rule) {
    write(KEYS.recurringRules, [
      ...read<RecurringRule[]>(KEYS.recurringRules, []),
      rule,
    ]);
  },

  async updateRecurringRule(rule) {
    const list = read<RecurringRule[]>(KEYS.recurringRules, []);
    write(
      KEYS.recurringRules,
      list.map((r) => (r.id === rule.id ? rule : r)),
    );
  },

  async deleteRecurringRule(id) {
    const list = read<RecurringRule[]>(KEYS.recurringRules, []);
    write(
      KEYS.recurringRules,
      list.filter((r) => r.id !== id),
    );
  },

  async runRecurring(throughMonth) {
    const result = runRecurring(
      read<Transaction[]>(KEYS.transactions, []),
      read<RecurringRule[]>(KEYS.recurringRules, []),
      throughMonth,
    );
    if (!result) return null;
    write(KEYS.transactions, result.transactions);
    write(KEYS.recurringRules, result.recurringRules);
    return result;
  },
};

// ─────────────────────────────────────────────
// 서버 API 구현 (로그인)
// ─────────────────────────────────────────────

/**
 * 실패하면 반드시 throw한다 — LedgerContext가 이 예외를 잡아 낙관적 반영을 되돌린다.
 * 조용히 삼키면 화면에는 저장된 것처럼 보이는데 서버에는 없는 상태가 된다.
 */
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => null);
    throw new Error(message ?? `요청에 실패했습니다 (${response.status})`);
  }

  // 204 No Content — 본문이 없다.
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const json = (body: unknown) => JSON.stringify(body);

const serverRepository: LedgerRepository = {
  async loadAll() {
    const [transactions, budgets, categories, recurringRules] = await Promise.all([
      api<Transaction[]>('/api/transactions'),
      api<Budget[]>('/api/budgets'),
      api<Category[]>('/api/categories'),
      api<RecurringRule[]>('/api/recurring'),
    ]);

    // 카테고리가 없으면 쓸 수 있는 화면이 안 나오므로 기본 카테고리를 시드한다.
    // 로컬 구현이 DEFAULT_CATEGORIES를 fallback으로 쓰는 것과 같은 역할이며,
    // id 충돌을 피하려고 서버가 새로 발급한다(/api/categories/seed 주석 참고).
    if (categories.length === 0) {
      const seeded = await api<Category[]>('/api/categories/seed', { method: 'POST' });
      return { transactions, budgets, categories: seeded, recurringRules };
    }

    return { transactions, budgets, categories, recurringRules };
  },

  async addTransaction(tx) {
    await api('/api/transactions', { method: 'POST', body: json(tx) });
  },

  async updateTransaction(tx) {
    await api(`/api/transactions/${tx.id}`, { method: 'PATCH', body: json(tx) });
  },

  async deleteTransaction(id) {
    await api(`/api/transactions/${id}`, { method: 'DELETE' });
  },

  async setBudget(budget) {
    await api('/api/budgets', { method: 'PUT', body: json(budget) });
  },

  async addCategory(category) {
    await api('/api/categories', { method: 'POST', body: json(category) });
  },

  async updateCategory(category) {
    await api(`/api/categories/${category.id}`, {
      method: 'PATCH',
      body: json(category),
    });
  },

  async deleteCategory(id) {
    // 예산은 DB에서 Cascade로 함께 지워진다(Budget.category onDelete: Cascade).
    await api(`/api/categories/${id}`, { method: 'DELETE' });
  },

  async addRecurringRule(rule) {
    await api('/api/recurring', { method: 'POST', body: json(rule) });
  },

  async updateRecurringRule(rule) {
    await api(`/api/recurring/${rule.id}`, { method: 'PATCH', body: json(rule) });
  },

  async deleteRecurringRule(id) {
    await api(`/api/recurring/${id}`, { method: 'DELETE' });
  },

  async runRecurring(throughMonth) {
    // 서버가 생성과 generatedMonths 갱신을 한 트랜잭션으로 처리하고 갱신본 전체를 돌려준다.
    // 로컬 구현과 달리 '바뀐 게 없음'을 구분하지 않으므로 항상 결과를 그대로 반영한다.
    return api<Pick<LedgerData, 'transactions' | 'recurringRules'>>(
      '/api/recurring/run',
      { method: 'POST', body: json({ throughMonth }) },
    );
  },
};

export type StorageMode = 'local' | 'server';

export function getRepository(mode: StorageMode): LedgerRepository {
  return mode === 'server' ? serverRepository : localRepository;
}
