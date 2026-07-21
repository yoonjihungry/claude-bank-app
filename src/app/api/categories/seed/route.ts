// 카테고리가 하나도 없는 계정에 기본 카테고리를 넣어준다. 이미 있으면 아무것도 하지 않는다.
//
// 클라이언트가 DEFAULT_CATEGORIES를 그대로 POST하지 않는 이유:
// 기본 카테고리 id는 'food'처럼 고정 문자열이라 두 번째 사용자가 같은 값을 넣으면
// Category.id(전역 PK)가 충돌한다. 서버에서 cuid를 새로 발급해 계정마다 다른 id를 갖게 한다.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/apiAuth';
import { toCategory } from '@/lib/mappers';
import { DEFAULT_CATEGORIES } from '@/constants/categories';

export async function POST() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  // 탭 두 개가 동시에 첫 로드를 하면 둘 다 통과해 중복 시드가 될 수 있다.
  // 실제로 겹칠 여지가 매우 좁고 사용자가 지우면 되는 수준이라 잠금까지는 걸지 않는다.
  const existing = await prisma.category.count({ where: { userId } });
  if (existing === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map(({ name, type, color }) => ({
        name,
        type,
        color,
        userId,
      })),
    });
  }

  const rows = await prisma.category.findMany({ where: { userId } });
  return NextResponse.json(rows.map(toCategory));
}
