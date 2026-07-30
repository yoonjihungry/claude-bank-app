// Auth.js(NextAuth v5) 설정. Google 로그인 + Prisma(DB 세션).
// 게이팅 정책 B: 로그인은 선택. 비로그인은 localStorage로 계속 쓰고, 로그인 시 서버 동기화(Phase 8).
// 로그인 강제(미들웨어)가 없으므로 edge 분리 설정 없이 Node 런타임 단일 설정으로 둔다.
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 생성된 Prisma 클라이언트(드라이버 어댑터 경유)를 그대로 사용. 구조상 호환된다.
  adapter: PrismaAdapter(prisma),
  // Google: AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET, Kakao: AUTH_KAKAO_ID / AUTH_KAKAO_SECRET 를 자동으로 읽는다.
  providers: [Google, Kakao],
  session: { strategy: 'database' },
  callbacks: {
    // DB 세션에서 user.id 를 세션에 노출 → Phase 8 API에서 본인 데이터 필터링에 사용.
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  events: {
    // 어댑터는 '최초 가입' 때만 프로필을 저장한다. 그래서 카카오 동의항목(닉네임/프로필 사진)을
    // 나중에 켜면 기존 사용자는 이름이 빈 채로 남는다. 로그인할 때마다 OAuth 프로필의
    // 이름·사진을 사용자 레코드에 반영해, 기존 계정도 다음 로그인에서 채워지도록 한다.
    async signIn({ user, profile }) {
      if (!user?.id || !profile) return;
      // 구글/카카오의 프로필 필드 위치가 달라 둘 다 훑는다(카카오는 properties·kakao_account 아래).
      const p = profile as {
        name?: string;
        picture?: string;
        properties?: { nickname?: string; profile_image?: string };
        kakao_account?: { profile?: { nickname?: string; profile_image_url?: string } };
      };
      const name =
        p.properties?.nickname ?? p.kakao_account?.profile?.nickname ?? p.name;
      const image =
        p.properties?.profile_image ??
        p.kakao_account?.profile?.profile_image_url ??
        p.picture;
      if (!name && !image) return;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name ? { name } : {}),
          ...(image ? { image } : {}),
        },
      });
    },
  },
});
