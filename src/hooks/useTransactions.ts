import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import type { Transaction, TxType } from '../types';

export interface TransactionFilter {
  /** 'YYYY-MM' — 해당 월의 거래만 */
  month?: string;
  type?: TxType;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
  /** 메모 부분 일치 검색 */
  keyword?: string;
}

function matches(tx: Transaction, filter: TransactionFilter): boolean {
  if (filter.month && !tx.date.startsWith(filter.month)) return false;
  if (filter.type && tx.type !== filter.type) return false;
  if (filter.categoryId && tx.category !== filter.categoryId) return false;
  if (filter.minAmount != null && tx.amount < filter.minAmount) return false;
  if (filter.maxAmount != null && tx.amount > filter.maxAmount) return false;
  if (filter.keyword && !(tx.memo ?? '').includes(filter.keyword)) return false;
  return true;
}

/**
 * 전역 거래 목록을 필터링하고 날짜 내림차순으로 정렬해 반환한다.
 * 집계/조회 로직은 컴포넌트가 아닌 이 훅에서 useMemo로 처리한다.
 */
export function useTransactions(filter: TransactionFilter = {}): Transaction[] {
  const { transactions } = useLedger();
  // 원시 값으로 분해해 의존성으로 사용한다.
  // 호출부가 인라인 객체(예: { month })를 넘겨도 매 렌더 재계산되지 않는다.
  const { month, type, categoryId, minAmount, maxAmount, keyword } = filter;

  return useMemo(() => {
    return transactions
      .filter((tx) =>
        matches(tx, { month, type, categoryId, minAmount, maxAmount, keyword }),
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [transactions, month, type, categoryId, minAmount, maxAmount, keyword]);
}
