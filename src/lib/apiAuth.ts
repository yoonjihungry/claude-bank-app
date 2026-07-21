// API 라우트 공통 인증 가드.
// 게이팅 정책 B(로그인 선택)라 미들웨어로 강제하지 않으므로, 서버 데이터에 닿는 라우트는
// 각자 여기를 통해 세션을 확인한다. userId가 없으면 401.
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** 로그인한 사용자의 id. 비로그인이면 null. */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * 카테고리 id가 이 사용자의 것인지 확인한다.
 * 거래·예산·고정거래는 모두 카테고리를 참조하는데, id만 있으면 남의 카테고리도 붙일 수 있다.
 * userId 필터만으로는 막히지 않는 지점이라 쓰기 경로에서 별도로 확인한다.
 */
export async function ownsCategory(userId: string, categoryId: string): Promise<boolean> {
  const found = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
  return found !== null;
}

export const unauthorized = () =>
  NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export const notFound = () =>
  NextResponse.json({ error: 'Not Found' }, { status: 404 });
