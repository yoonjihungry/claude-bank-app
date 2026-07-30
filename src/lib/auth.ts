// Auth.js(NextAuth v5) 설정. Google 로그인 + Prisma(DB 세션).
// 게이팅 정책 B: 로그인은 선택. 비로그인은 localStorage로 계속 쓰고, 로그인 시 서버 동기화(Phase 8).
// 로그인 강제(미들웨어)가 없으므로 edge 분리 설정 없이 Node 런타임 단일 설정으로 둔다.
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import Naver from 'next-auth/providers/naver';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 생성된 Prisma 클라이언트(드라이버 어댑터 경유)를 그대로 사용. 구조상 호환된다.
  adapter: PrismaAdapter(prisma),
  // 각 provider는 AUTH_<PROVIDER>_ID / _SECRET 환경변수를 자동으로 읽는다
  // (Google·Kakao·Naver → AUTH_GOOGLE_*, AUTH_KAKAO_*, AUTH_NAVER_*).
  providers: [
    Google,
    Kakao,
    // 네이버는 PKCE를 지원하지 않고 authorize에 state가 필수다. Auth.js 기본값은 PKCE를 켜고
    // state를 빼며 OIDC용 'openid' 스코프를 붙여서, 그대로 두면 네이버가 authorize를 못 찾아
    // 404("페이지를 찾을 수 없습니다")를 낸다. state 검사만 쓰고 스코프를 비운다.
    Naver({
      checks: ['state'],
      authorization: {
        url: 'https://nid.naver.com/oauth2.0/authorize',
        params: { scope: '' },
      },
    }),
  ],
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
      // provider마다 프로필 필드 위치가 달라 모두 훑는다
      // (카카오는 properties·kakao_account, 네이버는 response 아래).
      const p = profile as {
        name?: string;
        picture?: string;
        properties?: { nickname?: string; profile_image?: string };
        kakao_account?: { profile?: { nickname?: string; profile_image_url?: string } };
        response?: { nickname?: string; name?: string; profile_image?: string };
      };
      const name =
        p.properties?.nickname ??
        p.kakao_account?.profile?.nickname ??
        p.response?.nickname ??
        p.response?.name ??
        p.name;
      const image =
        p.properties?.profile_image ??
        p.kakao_account?.profile?.profile_image_url ??
        p.response?.profile_image ??
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
