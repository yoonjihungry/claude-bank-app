// 서버(레이아웃)에서 가계부 데이터를 한 번에 읽는다.
//
// 클라이언트가 `/api/*`를 네 번 호출하는 것과 같은 결과지만, 브라우저→서버 왕복이 없고
// 서버↔DB 한 번으로 끝난다. 화면이 처음 그려질 때 이미 내역이 들어있게 하려고 쓴다.
// 로그인 사용자 전용 — 비로그인 사용자는 localStorage에서 읽으므로 서버가 알 수 없다.
import { prisma } from './prisma';
import { toBudget, toCategory, toRecurringRule, toTransaction } from './mappers';
import type { LedgerData } from '@/storage/repository';

export async function loadLedgerData(userId: string): Promise<LedgerData> {
  const [transactions, budgets, categories, recurringRules] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.category.findMany({ where: { userId } }),
    prisma.recurringRule.findMany({ where: { userId } }),
  ]);

  return {
    transactions: transactions.map(toTransaction),
    budgets: budgets.map(toBudget),
    categories: categories.map(toCategory),
    recurringRules: recurringRules.map(toRecurringRule),
  };
}
