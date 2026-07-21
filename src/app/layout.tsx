import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../styles/index.css';

export const metadata: Metadata = {
  title: '가계부',
  description: '개인용 가계부 — 수입/지출 기록·통계',
};

/**
 * 루트 레이아웃 — html/body와 글로벌 CSS만 둔다.
 *
 * 로그인 확인·데이터 로딩은 여기가 아니라 `(shell)/layout.tsx`가 한다.
 * 여기에 두면 가계부와 무관한 독립 화면(`/desk`)까지 매 요청 세션·DB를 읽게 되고,
 * 정적으로 낼 수 있는 페이지도 전부 요청 시점 렌더로 끌려간다.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      {/* font-sans = Pretendard GOV Variable(@theme --font-sans). preflight에 의존하지 않고 명시 적용 */}
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
