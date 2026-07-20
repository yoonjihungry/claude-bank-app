// 거래 수정 / 삭제. 본인 것만 — updateMany/deleteMany에 userId를 함께 걸어
// 남의 id를 알아도 건드릴 수 없게 한다(count 0이면 404).
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  badRequest,
  getUserId,
  notFound,
  ownsCategory,
  unauthorized,
} from '@/lib/apiAuth';
import { validateTransaction } from '@/lib/mappers';
import type { Transaction } from '@/types';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const body = (await request.json()) as Transaction;
  const invalid = validateTransaction(body);
  if (invalid) return badRequest(invalid);
  if (!(await ownsCategory(userId, body.category))) {
    return badRequest('존재하지 않는 카테고리입니다');
  }

  const { count } = await prisma.transaction.updateMany({
    where: { id, userId },
    data: {
      type: body.type,
      amount: body.amount,
      categoryId: body.category,
      date: body.date,
      memo: body.memo ?? null,
      method: body.method ?? null,
      installmentMonths: body.installmentMonths ?? null,
    },
  });
  if (count === 0) return notFound();
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const { count } = await prisma.transaction.deleteMany({ where: { id, userId } });
  if (count === 0) return notFound();
  return new NextResponse(null, { status: 204 });
}
