// Prisma 클라이언트 싱글톤.
// Prisma 7의 새 client generator는 드라이버 어댑터가 필수다(Postgres → PrismaPg).
// dev(HMR)에서 매 요청마다 새 연결이 생기지 않도록 globalThis에 캐시한다.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
