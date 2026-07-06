/**
 * Phase 1 임시 골격 페이지. 실제 대시보드/거래/예산 페이지 이관은 Phase 2~4에서 진행한다.
 * 여기서는 Tailwind v4 + 디자인 토큰 + Pretendard GOV 폰트 파이프라인이
 * Next.js에서 정상 동작하는지 확인하는 용도다.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
      <h1 className="text-2xl font-bold">💰 가계부</h1>
      <p className="text-sm text-muted-foreground">
        Next.js 골격 준비 완료 — 페이지 이관은 다음 단계에서 진행합니다.
      </p>
    </main>
  );
}
