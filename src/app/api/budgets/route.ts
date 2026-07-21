// 예산 조회 / 설정.
// 예산에는 별도 id가 없고 (사용자·카테고리·월) 조합이 사실상 키라, 개별 라우트 대신
// PUT 하나로 upsert한다. limit이 0 이하면 '예산 해제'로 보고 행을 지운다 —
// localStorage 시절 reducer의 SET_BUDGET과 같은 규칙이다.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, getUserId, ownsCategory, unauthorized } from '@/lib/apiAuth';
import { toBudget, validateBudget } from '@/lib/mappers';
import type { Budget } from '@/types';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const rows = await prisma.budget.findMany({ where: { userId } });
  return NextResponse.json(rows.map(toBudget));
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = (await request.json()) as Budget;
  const invalid = validateBudget(body);
  if (invalid) return badRequest(invalid);

  const key = {
    userId_categoryId_month: {
      userId,
      categoryId: body.categoryId,
      month: body.month,
    },
  };

  if (body.limit <= 0) {
    await prisma.budget.deleteMany({
      where: { userId, categoryId: body.categoryId, month: body.month },
    });
    return new NextResponse(null, { status: 204 });
  }

  if (!(await ownsCategory(userId, body.categoryId))) {
    return badRequest('존재하지 않는 카테고리입니다');
  }

  const row = await prisma.budget.upsert({
    where: key,
    create: {
      categoryId: body.categoryId,
      month: body.month,
      limit: body.limit,
      userId,
    },
    update: { limit: body.limit },
  });
  return NextResponse.json(toBudget(row));
}
