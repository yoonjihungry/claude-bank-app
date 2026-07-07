import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../styles/index.css';
import AppShell from './AppShell';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: '가계부',
  description: '개인용 가계부 — 수입/지출 기록·통계',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      {/* font-sans = Pretendard GOV Variable(@theme --font-sans). preflight에 의존하지 않고 명시 적용 */}
      <body className="font-sans antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
