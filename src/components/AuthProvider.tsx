'use client';

// next-auth/react의 SessionProvider를 감싼 클라이언트 경계.
// layout(서버 컴포넌트)에서 앱 전체를 감싸 useSession을 어디서든 쓸 수 있게 한다.
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

export default function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
