// Auth.js(NextAuth v5) 설정. Google 로그인 + Prisma(DB 세션).
// 게이팅 정책 B: 로그인은 선택. 비로그인은 localStorage로 계속 쓰고, 로그인 시 서버 동기화(Phase 8).
// 로그인 강제(미들웨어)가 없으므로 edge 분리 설정 없이 Node 런타임 단일 설정으로 둔다.
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 생성된 Prisma 클라이언트(드라이버 어댑터 경유)를 그대로 사용. 구조상 호환된다.
  adapter: PrismaAdapter(prisma),
  providers: [Google], // AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET 를 자동으로 읽는다.
  session: { strategy: 'database' },
  callbacks: {
    // DB 세션에서 user.id 를 세션에 노출 → Phase 8 API에서 본인 데이터 필터링에 사용.
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
