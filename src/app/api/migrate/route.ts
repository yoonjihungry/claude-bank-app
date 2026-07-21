// 이 기기(localStorage)에 쌓인 가계부 데이터를 로그인한 계정으로 한 번에 옮긴다.
//
// 클라이언트가 개별 POST를 여러 번 보내지 않고 이 라우트를 쓰는 이유는 두 가지다.
//  1. 원자성 — 중간에 실패해서 '거래는 옮겨졌는데 카테고리는 안 옮겨진' 상태가 남으면 안 된다.
//  2. id 재발급 — 로컬 카테고리 id는 'food'처럼 고정 문자열이라 그대로 넣으면 사용자 간
//     PK가 충돌한다. 새 id를 발급하고, 그걸 참조하는 거래·예산·규칙을 전부 갈아끼워야 한다.
import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/prisma';
import { badRequest, getUserId, unauthorized } from '@/lib/apiAuth';
import { toBudget, toCategory, toRecurringRule, toTransaction } from '@/lib/mappers';
import type { Budget, Category, RecurringRule, Transaction } from '@/types';

/** 잘못된 요청 하나로 DB가 망가지지 않도록 하는 상한. 개인 가계부 규모를 한참 넘는 값이다. */
const MAX_ITEMS = 20000;

interface MigratePayload {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  recurringRules: RecurringRule[];
}

const isArray = (v: unknown): v is unknown[] => Array.isArray(v);

/** 'YYYY-MM-DD' 또는 '규칙id__YYYY-MM' 에서 월을 뽑는다. */
function monthOf(transaction: Transaction): string {
  const suffix = transaction.id.split('__')[1];
  return suffix ?? transaction.date.slice(0, 7);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = (await request.json()) as MigratePayload;
  if (
    !isArray(body?.transactions) ||
    !isArray(body?.budgets) ||
    !isArray(body?.categories) ||
    !isArray(body?.recurringRules)
  ) {
    return badRequest('본문 형식이 올바르지 않습니다');
  }

  const total =
    body.transactions.length +
    body.budgets.length +
    body.categories.length +
    body.recurringRules.length;
  if (total > MAX_ITEMS) return badRequest('옮길 수 있는 양을 넘었습니다');

  // 이미 쓰던 계정에 덮어쓰면 중복이 생긴다. 비어 있을 때만 받는다.
  // (사용자가 '나중에'를 눌러 기본 카테고리가 시드된 뒤에도 여기서 걸린다 — 의도된 동작이다.)
  const existing = await prisma.category.count({ where: { userId } });
  if (existing > 0) {
    return NextResponse.json(
      { error: '이미 데이터가 있는 계정입니다' },
      { status: 409 },
    );
  }

  // ── id 재발급 ──────────────────────────────────────────
  const categoryIdMap = new Map<string, string>();
  for (const category of body.categories) {
    if (typeof category?.id === 'string' && !categoryIdMap.has(category.id)) {
      categoryIdMap.set(category.id, uuid());
    }
  }

  const ruleIdMap = new Map<string, string>();
  for (const rule of body.recurringRules) {
    if (typeof rule?.id === 'string' && !ruleIdMap.has(rule.id)) {
      ruleIdMap.set(rule.id, uuid());
    }
  }

  /** 지워진 카테고리를 참조하는 기록이 있을 수 있다. 그건 '미분류'(null)로 넘긴다. */
  const mapCategory = (id: string | undefined) =>
    (id && categoryIdMap.get(id)) ?? null;

  const categoryRows = body.categories
    .filter((c) => categoryIdMap.has(c.id))
    .map((c) => ({
      id: categoryIdMap.get(c.id)!,
      name: c.name,
      type: c.type,
      color: c.color,
      userId,
    }));

  const ruleRows = body.recurringRules
    .filter((r) => ruleIdMap.has(r.id))
    .map((r) => ({
      id: ruleIdMap.get(r.id)!,
      type: r.type,
      amount: r.amount,
      categoryId: mapCategory(r.category),
      method: r.method ?? null,
      dayOfMonth: r.dayOfMonth,
      memo: r.memo ?? null,
      startMonth: r.startMonth,
      active: r.active,
      generatedMonths: r.generatedMonths ?? [],
      userId,
    }));

  // 반복 규칙이 만든 거래의 id는 `규칙id__YYYY-MM` 규칙을 지켜야 멱등성이 유지된다.
  // 규칙 id가 바뀌었으니 거래 id도 새 규칙 id 기준으로 다시 만든다.
  const seenTxIds = new Set<string>();
  const transactionRows = body.transactions
    .map((t) => {
      const newRuleId = t.recurringId ? ruleIdMap.get(t.recurringId) : undefined;
      return {
        id: newRuleId ? `${newRuleId}__${monthOf(t)}` : t.id,
        type: t.type,
        amount: t.amount,
        categoryId: mapCategory(t.category),
        date: t.date,
        memo: t.memo ?? null,
        method: t.method ?? null,
        installmentMonths: t.installmentMonths ?? null,
        recurringId: newRuleId ?? null,
        userId,
      };
    })
    .filter((row) => {
      if (seenTxIds.has(row.id)) return false;
      seenTxIds.add(row.id);
      return true;
    });

  // 예산은 카테고리가 필수(FK)라, 매핑에 실패한 건 버린다.
  // (userId+categoryId+month 유일 제약이 있어 중복도 걸러야 한다.)
  const seenBudgetKeys = new Set<string>();
  const budgetRows = body.budgets
    .map((b) => ({
      categoryId: categoryIdMap.get(b.categoryId),
      month: b.month,
      limit: b.limit,
      userId,
    }))
    .filter(
      (row): row is typeof row & { categoryId: string } =>
        typeof row.categoryId === 'string',
    )
    .filter((row) => {
      const key = `${row.categoryId}__${row.month}`;
      if (seenBudgetKeys.has(key)) return false;
      seenBudgetKeys.add(key);
      return true;
    });

  // ── 삽입 ───────────────────────────────────────────────
  // FK 때문에 순서가 강제된다: 카테고리 → 반복규칙 → 거래(둘 다 참조) → 예산.
  await prisma.$transaction([
    prisma.category.createMany({ data: categoryRows }),
    prisma.recurringRule.createMany({ data: ruleRows }),
    prisma.transaction.createMany({ data: transactionRows }),
    prisma.budget.createMany({ data: budgetRows }),
  ]);

  // 클라이언트가 id를 다시 맞출 필요가 없도록 옮겨진 결과 전체를 돌려준다.
  const [transactions, budgets, categories, recurringRules] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.category.findMany({ where: { userId } }),
    prisma.recurringRule.findMany({ where: { userId } }),
  ]);

  return NextResponse.json({
    transactions: transactions.map(toTransaction),
    budgets: budgets.map(toBudget),
    categories: categories.map(toCategory),
    recurringRules: recurringRules.map(toRecurringRule),
  });
}
