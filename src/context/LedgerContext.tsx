'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuid } from 'uuid';
import type { Budget, Category, RecurringRule, Transaction } from '../types';
import {
  getRepository,
  type LedgerData,
  type LedgerRepository,
  type StorageMode,
} from '../storage/repository';
import {
  migrateToServer,
  readPendingMigration,
  seedServerCategories,
  type PendingMigration,
} from '../storage/migration';
import ErrorToast from '../components/ErrorToast';
import MigrationSheet from '../components/MigrationSheet';
import { currentMonth } from '../utils/dateRange';

type LedgerAction =
  | { type: 'LOAD'; payload: LedgerData }
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
  | {
      type: 'SYNC_RECURRING';
      payload: Pick<LedgerData, 'transactions' | 'recurringRules'>;
    };

const EMPTY: LedgerData = {
  transactions: [],
  budgets: [],
  categories: [],
  recurringRules: [],
};

function reducer(state: LedgerData, action: LedgerAction): LedgerData {
  switch (action.type) {
    case 'LOAD':
      return action.payload;

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

    case 'SYNC_RECURRING':
      // 반복거래 생성 결과는 저장소가 계산해 돌려준 값을 그대로 받는다.
      return {
        ...state,
        transactions: action.payload.transactions,
        recurringRules: action.payload.recurringRules,
      };

    default:
      return state;
  }
}

export type LedgerStatus = 'loading' | 'ready' | 'error';

interface LedgerContextValue extends LedgerData {
  /** 데이터 로딩 상태. 'loading'이면 화면은 빈 배열을 받는다. */
  status: LedgerStatus;
  /** 로그인 여부에 따른 현재 저장 위치. */
  storageMode: StorageMode;
  /** 저장 실패 메시지(있을 때만). */
  error: string | null;
  dismissError: () => void;
  /** 로딩에 실패했을 때 다시 시도한다. */
  reload: () => void;

  /** id를 자동 생성하여 거래를 추가한다. */
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

export function LedgerProvider({
  initialData,
  children,
}: {
  /** 서버(레이아웃)가 실어 보낸 데이터. 로그인 사용자에게만 있고, 없으면 클라이언트가 직접 읽는다. */
  initialData: LedgerData | null;
  children: ReactNode;
}) {
  const { status: sessionStatus } = useSession();
  // 서버 데이터로 시작하면 첫 렌더부터 화면이 채워진다 — 로딩 문구를 볼 일이 없다.
  const [state, dispatch] = useReducer(reducer, initialData ?? EMPTY);
  const [status, setStatus] = useState<LedgerStatus>(
    initialData ? 'ready' : 'loading',
  );
  const [error, setError] = useState<string | null>(null);
  // 처음 로그인했는데 이 기기에 옮길 데이터가 있을 때만 채워진다(= 이전 안내 표시).
  const [pending, setPending] = useState<PendingMigration | null>(null);
  const [migrating, setMigrating] = useState(false);

  // 로그인 상태가 곧 저장 위치다. 세션 확인 중에는 아직 알 수 없으므로 로딩으로 둔다.
  const storageMode: StorageMode =
    sessionStatus === 'authenticated' ? 'server' : 'local';
  const repository: LedgerRepository = useMemo(
    () => getRepository(storageMode),
    [storageMode],
  );

  /**
   * 밀린 반복 거래를 이번 달까지 생성한다. generatedMonths로 멱등하므로 매 로드마다 돌려도 된다.
   * 실패해도 이미 불러온 데이터는 쓸 수 있으니 상태를 error로 내리지 않는다.
   */
  const syncRecurring = useCallback(
    async (rules: RecurringRule[]) => {
      // 규칙이 없으면 만들 것도 없다. 고정거래를 안 쓰는 사용자의 왕복 한 번을 아낀다.
      if (rules.length === 0) return;
      try {
        const synced = await repository.runRecurring(currentMonth());
        if (synced) dispatch({ type: 'SYNC_RECURRING', payload: synced });
      } catch {
        setError('고정거래 자동 생성에 실패했습니다');
      }
    },
    [repository],
  );

  /**
   * 데이터를 확보한 뒤의 마무리. 직접 불러왔든 서버가 실어 보냈든 똑같이 거쳐야 한다.
   *
   * 카테고리가 하나도 없는 계정 = 이 계정으로 처음 들어온 것.
   * 이 기기에 쓰던 기록이 있으면 옮길지 먼저 묻고, 없으면 기본 카테고리를 넣어준다.
   * 물어보는 동안에는 시드도 반복거래 생성도 하지 않는다 — 옮기기와 섞이면 중복이 된다.
   */
  const settle = useCallback(
    async (data: LedgerData) => {
      if (storageMode === 'server' && data.categories.length === 0) {
        const found = await readPendingMigration();
        if (found) {
          setPending(found);
          return;
        }
        const categories = await seedServerCategories();
        dispatch({ type: 'LOAD', payload: { ...data, categories } });
      }
      await syncRecurring(data.recurringRules);
    },
    [storageMode, syncRecurring],
  );

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await repository.loadAll();
      dispatch({ type: 'LOAD', payload: data });
      setStatus('ready');
      await settle(data);
    } catch {
      dispatch({ type: 'LOAD', payload: EMPTY });
      setStatus('error');
    }
  }, [repository, settle]);

  // 서버가 데이터를 실어 보냈으면 첫 로드는 건너뛴다(이미 화면에 들어 있다).
  const servedByServer = useRef(initialData !== null);

  // 세션 판정이 끝난 뒤에 불러온다. 로그인/로그아웃으로 저장 위치가 바뀌면 다시 불러온다.
  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (servedByServer.current && initialData) {
      servedByServer.current = false;
      // 불러오기만 건너뛸 뿐, 이전 안내·고정거래 생성은 똑같이 거쳐야 한다.
      void settle(initialData);
      return;
    }

    void load();
  }, [sessionStatus, initialData, load, settle]);

  /** 이 기기의 기록을 계정으로 옮긴다. 성공하면 서버가 돌려준 결과로 화면을 갈아끼운다. */
  const acceptMigration = useCallback(async () => {
    if (!pending) return;
    setMigrating(true);
    try {
      // 카테고리·규칙 id를 서버가 새로 발급하므로 반환값을 그대로 써야 한다.
      const migrated = await migrateToServer(pending.data);
      dispatch({ type: 'LOAD', payload: migrated });
      setPending(null);
      await syncRecurring(migrated.recurringRules);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '옮기는 데 실패했습니다');
    } finally {
      setMigrating(false);
    }
  }, [pending, syncRecurring]);

  /** 옮기지 않기로 함. 기본 카테고리만 넣고 빈 계정으로 시작한다(로컬 원본은 그대로 남는다). */
  const skipMigration = useCallback(async () => {
    setMigrating(true);
    try {
      await seedServerCategories();
      setPending(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '기본 카테고리를 만들지 못했습니다');
    } finally {
      setMigrating(false);
    }
  }, [load]);

  /**
   * 낙관적 반영: 화면을 먼저 바꾸고 저장을 뒤에서 진행한다.
   * 실패하면 역방향 액션을 만들지 않고 저장소에서 통째로 다시 불러와 덮어쓴다 —
   * 액션마다 반대 동작을 정의하는 것보다 단순하고, 서버와 어긋날 여지가 없다.
   */
  const commit = useCallback(
    (action: LedgerAction, persist: () => Promise<void>) => {
      dispatch(action);
      persist().catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '저장에 실패했습니다');
        void load();
      });
    },
    [load],
  );

  /** 규칙을 저장한 뒤 밀린 달을 곧바로 생성한다(다음 앱 실행까지 기다리지 않도록). */
  const commitRule = useCallback(
    (action: LedgerAction, persist: () => Promise<void>) => {
      dispatch(action);
      persist()
        .then(() => repository.runRecurring(currentMonth()))
        .then((synced) => {
          if (synced) dispatch({ type: 'SYNC_RECURRING', payload: synced });
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : '저장에 실패했습니다');
          void load();
        });
    },
    [load, repository],
  );

  const value: LedgerContextValue = {
    ...state,
    status,
    storageMode,
    error,
    dismissError: () => setError(null),
    reload: () => void load(),

    addTransaction: (input) => {
      const tx: Transaction = { ...input, id: uuid() };
      commit({ type: 'ADD_TX', payload: tx }, () => repository.addTransaction(tx));
    },
    updateTransaction: (tx) =>
      commit({ type: 'UPDATE_TX', payload: tx }, () =>
        repository.updateTransaction(tx),
      ),
    deleteTransaction: (id) =>
      commit({ type: 'DELETE_TX', payload: { id } }, () =>
        repository.deleteTransaction(id),
      ),

    setBudget: (budget) =>
      commit({ type: 'SET_BUDGET', payload: budget }, () =>
        repository.setBudget(budget),
      ),

    addCategory: (input) => {
      // 호출자가 방금 만든 카테고리를 곧바로 선택할 수 있도록 id는 동기적으로 돌려준다.
      const category: Category = { ...input, id: uuid() };
      commit({ type: 'ADD_CATEGORY', payload: category }, () =>
        repository.addCategory(category),
      );
      return category.id;
    },
    updateCategory: (category) =>
      commit({ type: 'UPDATE_CATEGORY', payload: category }, () =>
        repository.updateCategory(category),
      ),
    deleteCategory: (id) =>
      commit({ type: 'DELETE_CATEGORY', payload: { id } }, () =>
        repository.deleteCategory(id),
      ),

    addRecurringRule: (input) => {
      const rule: RecurringRule = { ...input, id: uuid() };
      commitRule({ type: 'ADD_RULE', payload: rule }, () =>
        repository.addRecurringRule(rule),
      );
    },
    updateRecurringRule: (rule) =>
      commitRule({ type: 'UPDATE_RULE', payload: rule }, () =>
        repository.updateRecurringRule(rule),
      ),
    deleteRecurringRule: (id) =>
      commit({ type: 'DELETE_RULE', payload: { id } }, () =>
        repository.deleteRecurringRule(id),
      ),
  };

  return (
    <LedgerContext.Provider value={value}>
      {children}
      {pending && (
        <MigrationSheet
          summary={pending.summary}
          busy={migrating}
          onMigrate={() => void acceptMigration()}
          onSkip={() => void skipMigration()}
        />
      )}
      {error && <ErrorToast message={error} onDismiss={() => setError(null)} />}
    </LedgerContext.Provider>
  );
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
