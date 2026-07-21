'use client';

// next-auth/react의 SessionProvider를 감싼 클라이언트 경계.
// layout(서버 컴포넌트)에서 앱 전체를 감싸 useSession을 어디서든 쓸 수 있게 한다.
//
// session을 서버에서 받아 넘기는 게 중요하다. 이 값이 없으면 SessionProvider가 첫 렌더에
// `/api/auth/session`을 호출해 로그인 여부를 알아내는데, LedgerContext는 그 답이 와야
// 로컬에서 읽을지 서버에서 읽을지 정할 수 있다 — 왕복 두 번이 순서대로 쌓여 화면이 늦게 뜬다.
// 서버는 HTML을 만들 때 이미 답을 알고 있으므로 실어 보내면 그 대기가 통째로 사라진다.
// (로그아웃 상태의 null도 '확인된 답'이라 그대로 넘겨야 한다. undefined면 다시 물어본다.)
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

export default function AuthProvider({
  session,
  children,
}: {
  session: Session | null;
  children: ReactNode;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
