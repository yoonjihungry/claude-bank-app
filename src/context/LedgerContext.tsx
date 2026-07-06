'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react';
import { v4 as uuid } from 'uuid';
import type { Budget, Category, Transaction } from '../types';
import {
  getBudgets,
  getCategories,
  getTransactions,
  saveBudgets,
  saveCategories,
  saveTransactions,
} from '../storage/repository';

interface LedgerState {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
}

type LedgerAction =
  | { type: 'ADD_TX'; payload: Transaction }
  | { type: 'UPDATE_TX'; payload: Transaction }
  | { type: 'DELETE_TX'; payload: { id: string } }
  | { type: 'SET_BUDGET'; payload: Budget }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: { id: string } };

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
