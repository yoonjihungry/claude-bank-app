import type { Budget, Transaction } from '../types';

/**
 * localStorage 접근을 캡슐화하는 저장소 계층.
 *
 * 컴포넌트/훅에서는 절대 localStorage를 직접 호출하지 않고 이 모듈만 사용한다.
 * 나중에 fetch 기반 API로 교체할 때 이 파일의 구현만 바꾸면 되도록 유지한다.
 */

const KEYS = {
  transactions: 'bankapp.transactions',
  budgets: 'bankapp.budgets',
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

export function getTransactions(): Transaction[] {
  return read<Transaction[]>(KEYS.transactions, []);
}

export function saveTransactions(transactions: Transaction[]): void {
  write(KEYS.transactions, transactions);
}

export function getBudgets(): Budget[] {
  return read<Budget[]>(KEYS.budgets, []);
}

export function saveBudgets(budgets: Budget[]): void {
  write(KEYS.budgets, budgets);
}
