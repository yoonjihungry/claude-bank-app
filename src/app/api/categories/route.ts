// 카테고리 목록 조회 / 생성.
// 시드는 서버가 하지 않는다 — 최초 로그인 시 이전(migrate) 경로에서 한 번에 넣는다.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, getUserId, unauthorized } from '@/lib/apiAuth';
import { toCategory, validateCategory } from '@/lib/mappers';
import type { Category } from '@/types';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const rows = await prisma.category.findMany({ where: { userId } });
  return NextResponse.json(rows.map(toCategory));
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = (await request.json()) as Category;
  const invalid = validateCategory(body);
  if (invalid) return badRequest(invalid);

  const row = await prisma.category.create({
    data: {
      id: body.id,
      name: body.name,
      type: body.type,
      color: body.color,
      userId,
    },
  });
  return NextResponse.json(toCategory(row), { status: 201 });
}
