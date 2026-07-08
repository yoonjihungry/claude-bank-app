// 세션 타입 보강: session.user.id 를 타입 레벨에서 노출(Phase 8에서 사용).
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user'];
  }
}
