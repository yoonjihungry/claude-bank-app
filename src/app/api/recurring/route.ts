// 고정(반복) 규칙 조회 / 생성.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, getUserId, ownsCategory, unauthorized } from '@/lib/apiAuth';
import { toRecurringRule, validateRecurringRule } from '@/lib/mappers';
import type { RecurringRule } from '@/types';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const rows = await prisma.recurringRule.findMany({ where: { userId } });
  return NextResponse.json(rows.map(toRecurringRule));
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = (await request.json()) as RecurringRule;
  const invalid = validateRecurringRule(body);
  if (invalid) return badRequest(invalid);
  if (!(await ownsCategory(userId, body.category))) {
    return badRequest('존재하지 않는 카테고리입니다');
  }

  const row = await prisma.recurringRule.create({
    data: {
      id: body.id,
      type: body.type,
      amount: body.amount,
      categoryId: body.category,
      method: body.method ?? null,
      dayOfMonth: body.dayOfMonth,
      memo: body.memo ?? null,
      startMonth: body.startMonth,
      active: body.active,
      generatedMonths: body.generatedMonths,
      userId,
    },
  });
  return NextResponse.json(toRecurringRule(row), { status: 201 });
}
