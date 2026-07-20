// 카테고리 수정 / 삭제.
// 삭제 시 예산은 함께 사라지고(Budget.category onDelete: Cascade), 거래·고정거래는 남되
// categoryId가 null이 된다(onDelete: SetNull) — 화면에서는 '미분류'로 보인다.
// 이 동작은 localStorage 시절 reducer의 DELETE_CATEGORY와 같다.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, getUserId, notFound, unauthorized } from '@/lib/apiAuth';
import { validateCategory } from '@/lib/mappers';
import type { Category } from '@/types';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const body = (await request.json()) as Category;
  const invalid = validateCategory(body);
  if (invalid) return badRequest(invalid);

  const { count } = await prisma.category.updateMany({
    where: { id, userId },
    data: { name: body.name, type: body.type, color: body.color },
  });
  if (count === 0) return notFound();
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const { count } = await prisma.category.deleteMany({ where: { id, userId } });
  if (count === 0) return notFound();
  return new NextResponse(null, { status: 204 });
}
