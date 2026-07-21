// 거래 목록 조회 / 생성.
// id는 클라이언트가 만든다 — 반복 거래가 `규칙id__YYYY-MM` 결정적 id에 멱등성을 걸고 있어서
// 서버가 id를 새로 발급하면 같은 달을 두 번 만들게 된다.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, getUserId, ownsCategory, unauthorized } from '@/lib/apiAuth';
import { toTransaction, validateTransaction } from '@/lib/mappers';
import type { Transaction } from '@/types';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const rows = await prisma.transaction.findMany({
    where: { userId },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(rows.map(toTransaction));
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = (await request.json()) as Transaction;
  const invalid = validateTransaction(body);
  if (invalid) return badRequest(invalid);
  if (!(await ownsCategory(userId, body.category))) {
    return badRequest('존재하지 않는 카테고리입니다');
  }

  const row = await prisma.transaction.create({
    data: {
      id: body.id,
      type: body.type,
      amount: body.amount,
      categoryId: body.category,
      date: body.date,
      memo: body.memo ?? null,
      method: body.method ?? null,
      installmentMonths: body.installmentMonths ?? null,
      recurringId: body.recurringId ?? null,
      userId,
    },
  });
  return NextResponse.json(toTransaction(row), { status: 201 });
}
