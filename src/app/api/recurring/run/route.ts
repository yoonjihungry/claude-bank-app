// 밀린 고정거래를 throughMonth까지 생성한다. 앱을 열 때 한 번 호출한다.
//
// 거래 생성과 규칙의 generatedMonths 갱신이 반드시 함께 커밋돼야 한다 —
// 둘이 갈라지면 같은 달을 두 번 만들거나(거래만 실패) 영영 안 만들거나(규칙만 성공) 하므로
// prisma.$transaction으로 묶는다. 로직 자체는 LedgerContext의 runRecurring과 동일하다.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, getUserId, unauthorized } from '@/lib/apiAuth';
import { toRecurringRule, toTransaction } from '@/lib/mappers';
import { dateInMonth, shiftMonth } from '@/utils/dateRange';

/** 잘못된 startMonth로 인한 폭주 방지(약 50년). 클라이언트 구현과 같은 상한. */
const MONTH_GUARD = 600;

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const { throughMonth } = (await request.json()) as { throughMonth?: string };
  if (!throughMonth || !/^\d{4}-\d{2}$/.test(throughMonth)) {
    return badRequest("throughMonth가 'YYYY-MM' 형식이 아닙니다");
  }

  const rules = await prisma.recurringRule.findMany({ where: { userId, active: true } });

  // 만들 거래와, 규칙별로 새로 기록할 달을 먼저 계산한다.
  const pending: {
    id: string;
    ruleId: string;
    month: string;
    type: 'income' | 'expense';
    amount: number;
    categoryId: string | null;
    date: string;
    memo: string | null;
    method: 'cash' | 'check' | 'credit' | null;
  }[] = [];
  const addedByRule = new Map<string, string[]>();

  for (const rule of rules) {
    const added: string[] = [];
    let month = rule.startMonth;
    for (let guard = 0; month <= throughMonth && guard < MONTH_GUARD; guard += 1) {
      if (!rule.generatedMonths.includes(month)) {
        pending.push({
          id: `${rule.id}__${month}`,
          ruleId: rule.id,
          month,
          type: rule.type,
          amount: rule.amount,
          categoryId: rule.categoryId,
          date: dateInMonth(month, rule.dayOfMonth),
          memo: rule.memo,
          method: rule.type === 'expense' ? rule.method : null,
        });
        added.push(month);
      }
      month = shiftMonth(month, 1);
    }
    if (added.length > 0) addedByRule.set(rule.id, added);
  }

  if (pending.length > 0) {
    // 이미 있는 id는 건너뛴다. generatedMonths가 정상이면 겹칠 일이 없지만,
    // 중간에 실패한 흔적이 남아 있을 수 있어 unique 충돌을 피한다.
    const existing = await prisma.transaction.findMany({
      where: { userId, id: { in: pending.map((p) => p.id) } },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((e) => e.id));
    const toCreate = pending.filter((p) => !existingIds.has(p.id));

    await prisma.$transaction([
      prisma.transaction.createMany({
        data: toCreate.map((p) => ({
          id: p.id,
          type: p.type,
          amount: p.amount,
          categoryId: p.categoryId,
          date: p.date,
          memo: p.memo,
          method: p.method,
          recurringId: p.ruleId,
          userId,
        })),
      }),
      ...rules
        .filter((rule) => addedByRule.has(rule.id))
        .map((rule) =>
          prisma.recurringRule.update({
            where: { id: rule.id },
            data: {
              generatedMonths: [
                ...rule.generatedMonths,
                ...(addedByRule.get(rule.id) ?? []),
              ],
            },
          }),
        ),
    ]);
  }

  // 클라이언트가 병합 로직을 갖지 않도록 갱신된 전체를 돌려준다.
  const [transactions, recurringRules] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.recurringRule.findMany({ where: { userId } }),
  ]);

  return NextResponse.json({
    transactions: transactions.map(toTransaction),
    recurringRules: recurringRules.map(toRecurringRule),
  });
}
