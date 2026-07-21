import type { ReactNode } from 'react';
import AppShell from '../AppShell';
import AuthProvider from '@/components/AuthProvider';
import { auth } from '@/lib/auth';
import { loadLedgerData } from '@/lib/ledgerData';

/**
 * 가계부 화면(`/`, `/transactions`, `/budget`)의 공통 레이아웃.
 * `(shell)`은 라우트 그룹이라 주소에 나타나지 않는다 — URL은 그대로다.
 *
 * 세션과 가계부 데이터를 서버에서 읽어 클라이언트로 넘긴다. 이러면 브라우저는 첫 화면을
 * 그리는 데 아무것도 더 요청하지 않는다 — 로그인 확인 1회 + 데이터 4회 왕복이 사라진다
 * (AuthProvider·ledgerData 주석 참고).
 *
 * 이 레이아웃을 쓰는 페이지만 요청 시점 렌더가 된다. 사람마다 내용이 다르니 당연한 귀결이고,
 * 여기 밖에 있는 `/desk`는 영향을 받지 않는다.
 */
export default async function ShellLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  // 비로그인 사용자의 데이터는 localStorage에 있어 서버가 알 수 없다 → null로 넘기고
  // 클라이언트가 마운트된 뒤 직접 읽는다.
  const initialData = session?.user?.id
    ? await loadLedgerData(session.user.id)
    : null;

  return (
    <AuthProvider session={session}>
      <AppShell initialData={initialData}>{children}</AppShell>
    </AuthProvider>
  );
}
