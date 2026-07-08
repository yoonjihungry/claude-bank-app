'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { v4 as uuid } from 'uuid';
import type { Budget, Category, RecurringRule, Transaction } from '../types';
import {
  getBudgets,
  getCategories,
  getRecurringRules,
  getTransactions,
  saveBudgets,
  saveCategories,
  saveRecurringRules,
  saveTransactions,
} from '../storage/repository';
import { currentMonth, dateInMonth, shiftMonth } from '../utils/dateRange';

interface LedgerState {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  recurringRules: RecurringRule[];
}

type LedgerAction =
  | { type: 'ADD_TX'; payload: Transaction }
  | { type: 'UPDATE_TX'; payload: Transaction }
  | { type: 'DELETE_TX'; payload: { id: string } }
  | { type: 'SET_BUDGET'; payload: Budget }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: { id: string } }
  | { type: 'ADD_RULE'; payload: RecurringRule }
  | { type: 'UPDATE_RULE'; payload: RecurringRule }
  | { type: 'DELETE_RULE'; payload: { id: string } }
  | { type: 'RUN_RECURRING'; payload: { throughMonth: string } };

/**
 * 활성 반복 규칙마다 startMonth~throughMonth 중 아직 만들지 않은 달의 거래를 생성한다.
 * - 생성한 거래에는 `recurringId`를 달고, 규칙의 `generatedMonths`에 그 달을 기록한다.
 * - 거래 id는 `${ruleId}__${month}` 결정적 값이라 같은 달을 두 번 만들지 않는다(중복 방지).
 * - 이미 만든 달은 건너뛰므로, 사용자가 생성된 거래를 지워도 다시 살아나지 않는다.
 */
function runRecurring(state: LedgerState, throughMonth: string): LedgerState {
  const existingIds = new Set(state.transactions.map((t) => t.id));
  const newTxs: Transaction[] = [];

  const nextRules = state.recurringRules.map((rule) => {
    if (!rule.active) return rule;
    const added: string[] = [];
    let month = rule.startMonth;
    // 안전 상한: 잘못된 startMonth로 인한 과도한 루프 방지(약 50년)
    for (let guard = 0; month <= throughMonth && guard < 600; guard += 1) {
      if (!rule.generatedMonths.includes(month)) {
        const id = `${rule.id}__${month}`;
        if (!existingIds.has(id)) {
          newTxs.push({
            id,
            type: rule.type,
            amount: rule.amount,
            category: rule.category,
            date: dateInMonth(month, rule.dayOfMonth),
            memo: rule.memo,
            method: rule.type === 'expense' ? rule.method : undefined,
            recurringId: rule.id,
          });
          existingIds.add(id);
        }
        added.push(month);
      }
      month = shiftMonth(month, 1);
    }
    return added.length > 0
      ? { ...rule, generatedMonths: [...rule.generatedMonths, ...added] }
      : rule;
  });

  if (newTxs.length === 0) return state;
  return {
    ...state,
    transactions: [...newTxs, ...state.transactions],
    recurringRules: nextRules,
  };
}

function reducer(state: LedgerState, action: LedgerAction): LedgerState {
  switch (action.type) {
    case 'ADD_TX':
      return { ...state, transactions: [action.payload, ...state.transactions] };

    case 'UPDATE_TX':
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id ? action.payload : tx,
        ),
      };

    case 'DELETE_TX':
      return {
        ...state,
        transactions: state.transactions.filter((tx) => tx.id !== action.payload.id),
      };

    case 'SET_BUDGET': {
      const { categoryId, month, limit } = action.payload;
      const rest = state.budgets.filter(
        (b) => !(b.categoryId === categoryId && b.month === month),
      );
      // limit이 0 이하이면 예산 해제로 간주하고 제거한다.
      return {
        ...state,
        budgets: limit > 0 ? [...rest, action.payload] : rest,
      };
    }

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };

    case 'DELETE_CATEGORY': {
      const { id } = action.payload;
      // 카테고리를 지우면 그 카테고리에 걸린 예산도 함께 제거한다.
      // (그 카테고리로 기록된 거래는 남기며, 조회 시 '미분류'로 표시된다.)
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== id),
        budgets: state.budgets.filter((b) => b.categoryId !== id),
      };
    }

    case 'ADD_RULE':
      return { ...state, recurringRules: [...state.recurringRules, action.payload] };

    case 'UPDATE_RULE':
      return {
        ...state,
        recurringRules: state.recurringRules.map((r) =>
          r.id === action.payload.id ? action.payload : r,
        ),
      };

    case 'DELETE_RULE':
      // 규칙만 삭제한다. 이미 생성된 과거 거래는 실제 기록이므로 남긴다.
      return {
        ...state,
        recurringRules: state.recurringRules.filter((r) => r.id !== action.payload.id),
      };

    case 'RUN_RECURRING':
      return runRecurring(state, action.payload.throughMonth);

    default:
      return state;
  }
}

/** 최초 상태는 저장소 계층에서 로드한다(lazy init). */
function init(): LedgerState {
  return {
    transactions: getTransactions(),
    budgets: getBudgets(),
    categories: getCategories(),
    recurringRules: getRecurringRules(),
  };
}

interface LedgerContextValue extends LedgerState {
  /** id/date를 자동 생성하여 거래를 추가한다. date를 넘기면 그대로 사용한다. */
  addTransaction: (input: Omit<Transaction, 'id'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  /** categoryId+month 기준 upsert. limit<=0이면 예산을 제거한다. */
  setBudget: (budget: Budget) => void;
  /** id를 자동 생성하여 카테고리를 추가하고, 생성된 id를 반환한다. */
  addCategory: (input: Omit<Category, 'id'>) => string;
  updateCategory: (category: Category) => void;
  /** 카테고리와 그에 걸린 예산을 함께 제거한다. */
  deleteCategory: (id: string) => void;
  /**
   * id를 자동 생성하여 반복 규칙을 추가한다.
   * generatedMonths는 호출자가 정한다(폼에서 이번 달치를 직접 넣은 경우 그 달을 넣어 중복 생성 방지).
   */
  addRecurringRule: (input: Omit<RecurringRule, 'id'>) => void;
  updateRecurringRule: (rule: RecurringRule) => void;
  /** 규칙만 삭제한다(이미 생성된 과거 거래는 유지). */
  deleteRecurringRule: (id: string) => void;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  // 상태가 바뀌면 저장소 계층을 통해 localStorage에 자동 저장한다.
  useEffect(() => {
    saveTransactions(state.transactions);
  }, [state.transactions]);

  useEffect(() => {
    saveBudgets(state.budgets);
  }, [state.budgets]);

  useEffect(() => {
    saveCategories(state.categories);
  }, [state.categories]);

  useEffect(() => {
    saveRecurringRules(state.recurringRules);
  }, [state.recurringRules]);

  // 앱을 열 때 한 번, 밀린 반복 거래를 이번 달까지 자동 생성한다.
  // reducer가 generatedMonths로 멱등하게 처리하므로 중복 생성 걱정은 없다.
  const ranRecurring = useRef(false);
  useEffect(() => {
    if (ranRecurring.current) return;
    ranRecurring.current = true;
    dispatch({ type: 'RUN_RECURRING', payload: { throughMonth: currentMonth() } });
  }, []);

  const value: LedgerContextValue = {
    ...state,
    addTransaction: (input) =>
      dispatch({ type: 'ADD_TX', payload: { ...input, id: uuid() } }),
    updateTransaction: (tx) => dispatch({ type: 'UPDATE_TX', payload: tx }),
    deleteTransaction: (id) => dispatch({ type: 'DELETE_TX', payload: { id } }),
    setBudget: (budget) => dispatch({ type: 'SET_BUDGET', payload: budget }),
    addCategory: (input) => {
      const id = uuid();
      dispatch({ type: 'ADD_CATEGORY', payload: { ...input, id } });
      return id;
    },
    updateCategory: (category) =>
      dispatch({ type: 'UPDATE_CATEGORY', payload: category }),
    deleteCategory: (id) => dispatch({ type: 'DELETE_CATEGORY', payload: { id } }),
    addRecurringRule: (input) => {
      dispatch({ type: 'ADD_RULE', payload: { ...input, id: uuid() } });
      // 방금 추가한 규칙의 밀린 달(이번 달까지)을 곧바로 생성한다(다음 앱 실행까지 기다리지 않도록).
      dispatch({ type: 'RUN_RECURRING', payload: { throughMonth: currentMonth() } });
    },
    updateRecurringRule: (rule) => {
      dispatch({ type: 'UPDATE_RULE', payload: rule });
      dispatch({ type: 'RUN_RECURRING', payload: { throughMonth: currentMonth() } });
    },
    deleteRecurringRule: (id) => dispatch({ type: 'DELETE_RULE', payload: { id } }),
  };

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

/** 전역 가계부 상태와 액션에 접근한다. Provider 바깥에서 호출하면 에러. */
// eslint-disable-next-line react-refresh/only-export-components
export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return ctx;
}
