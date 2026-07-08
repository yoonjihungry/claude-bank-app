import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import type { RecurringRule } from '../types';

export interface UseRecurring {
  /** 전체 반복 규칙(활성 먼저, 그다음 이름/일자 순은 화면에서 처리). */
  all: RecurringRule[];
  /** id로 조회. 없으면 undefined. */
  byId: (id: string) => RecurringRule | undefined;
  addRecurringRule: (input: Omit<RecurringRule, 'id'>) => void;
  updateRecurringRule: (rule: RecurringRule) => void;
  deleteRecurringRule: (id: string) => void;
}

/**
 * 고정지출/반복거래 규칙 조회·편집을 한곳에서 제공한다.
 * 자동 생성은 LedgerContext가 앱 시작 시 처리하므로 여기서는 CRUD만 노출한다.
 */
export function useRecurring(): UseRecurring {
  const {
    recurringRules,
    addRecurringRule,
    updateRecurringRule,
    deleteRecurringRule,
  } = useLedger();

  const byId = useMemo(() => {
    const map = new Map(recurringRules.map((r) => [r.id, r]));
    return (id: string) => map.get(id);
  }, [recurringRules]);

  return {
    all: recurringRules,
    byId,
    addRecurringRule,
    updateRecurringRule,
    deleteRecurringRule,
  };
}
