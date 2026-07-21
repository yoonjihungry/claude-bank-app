import type { RecurringRule, Transaction } from '@/types';
import { dateInMonth, shiftMonth } from './dateRange';

/** 잘못된 startMonth로 인한 폭주 방지(약 50년). 서버 구현과 같은 상한. */
const MONTH_GUARD = 600;

export interface RecurringResult {
  transactions: Transaction[];
  recurringRules: RecurringRule[];
}

/**
 * 활성 반복 규칙마다 startMonth~throughMonth 중 아직 만들지 않은 달의 거래를 생성한다.
 * - 생성한 거래에는 `recurringId`를 달고, 규칙의 `generatedMonths`에 그 달을 기록한다.
 * - 거래 id는 `${ruleId}__${month}` 결정적 값이라 같은 달을 두 번 만들지 않는다.
 * - 이미 만든 달은 건너뛰므로, 사용자가 생성된 거래를 지워도 다시 살아나지 않는다.
 *
 * 바뀐 것이 없으면 null을 반환한다 — 호출자가 불필요한 저장/렌더를 건너뛸 수 있도록.
 * 예전에는 LedgerContext의 reducer 안에 있었으나, 서버 저장 모드에서 같은 규칙을
 * `/api/recurring/run`이 수행하므로 양쪽이 공유할 수 있게 순수 함수로 분리했다.
 */
export function runRecurring(
  transactions: Transaction[],
  rules: RecurringRule[],
  throughMonth: string,
): RecurringResult | null {
  const existingIds = new Set(transactions.map((t) => t.id));
  const newTxs: Transaction[] = [];
  let rulesChanged = false;

  const nextRules = rules.map((rule) => {
    if (!rule.active) return rule;
    const added: string[] = [];
    let month = rule.startMonth;
    for (let guard = 0; month <= throughMonth && guard < MONTH_GUARD; guard += 1) {
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
    if (added.length === 0) return rule;
    rulesChanged = true;
    return { ...rule, generatedMonths: [...rule.generatedMonths, ...added] };
  });

  if (newTxs.length === 0 && !rulesChanged) return null;
  return {
    transactions: [...newTxs, ...transactions],
    recurringRules: nextRules,
  };
}
