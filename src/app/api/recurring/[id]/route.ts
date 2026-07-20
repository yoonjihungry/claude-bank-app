// 고정 규칙 수정 / 삭제.
// 삭제해도 이미 생성된 과거 거래는 남긴다(Transaction.recurring onDelete: SetNull) —
// 실제로 있었던 지출이므로 지우지 않는다는 기존 reducer의 DELETE_RULE 규칙 그대로다.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  badRequest,
  getUserId,
  notFound,
  ownsCategory,
  unauthorized,
} from '@/lib/apiAuth';
import { validateRecurringRule } from '@/lib/mappers';
import type { RecurringRule } from '@/types';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const body = (await request.json()) as RecurringRule;
  const invalid = validateRecurringRule(body);
  if (invalid) return badRequest(invalid);
  if (!(await ownsCategory(userId, body.category))) {
    return badRequest('존재하지 않는 카테고리입니다');
  }

  const { count } = await prisma.recurringRule.updateMany({
    where: { id, userId },
    data: {
      type: body.type,
      amount: body.amount,
      categoryId: body.category,
      method: body.method ?? null,
      dayOfMonth: body.dayOfMonth,
      memo: body.memo ?? null,
      startMonth: body.startMonth,
      active: body.active,
      generatedMonths: body.generatedMonths,
    },
  });
  if (count === 0) return notFound();
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const { count } = await prisma.recurringRule.deleteMany({ where: { id, userId } });
  if (count === 0) return notFound();
  return new NextResponse(null, { status: 204 });
}
