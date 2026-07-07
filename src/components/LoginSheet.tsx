'use client';

// 로그인 안내 바텀시트. 헤더 "로그인" 클릭 시 열리며, 곧바로 구글로 튕기지 않고
// 맥락을 보여준 뒤 "Google로 계속하기"를 눌렀을 때만 signIn을 호출한다(게이팅 정책 B).
// 스크림/시트는 항상 마운트하고 open으로 표시 토글 → CSS transition으로 슬라이드.
import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Esc로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* 스크림 — 바깥 클릭 시 닫힘 */}
      <button
        type="button"
        aria-label="닫기"
        tabIndex={-1}
        onClick={onClose}
        className={`absolute inset-0 cursor-default bg-foreground/45 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 바텀시트 — 앱 콘텐츠 폭과 동일하게 중앙 정렬 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-sheet-title"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px] rounded-t-[22px] border border-border bg-card px-6 pt-2.5 shadow-[0_-10px_40px_-12px_hsl(222_47%_20%/0.3)] transition-transform duration-300 ease-out md:max-w-[600px] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-[18px] top-4 p-1 text-lg leading-none text-muted-foreground transition hover:text-foreground"
        >
          ✕
        </button>

        {/* 그립 핸들 */}
        <div className="mx-auto mb-[18px] h-1 w-[38px] rounded-full bg-input" />

        {/* 브랜드 */}
        <div className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-[28px]">
          💰
        </div>

        <h3
          id="login-sheet-title"
          className="text-center text-lg font-extrabold tracking-tight"
        >
          로그인하고 어디서나 이어보기
        </h3>
        <p className="mt-[7px] mb-6 text-center text-[13px] leading-relaxed text-muted-foreground">
          로그인 없이도 계속 쓸 수 있어요.
          <br />
          로그인하면 기기가 바뀌어도 내역이 그대로 남아요.
        </p>

        {/* Google 계속하기 — 여기서만 실제 로그인(리다이렉트) 발생 */}
        <button
          type="button"
          onClick={() => signIn('google')}
          className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-xl border border-input bg-card text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          <svg viewBox="0 0 48 48" className="h-[19px] w-[19px] shrink-0" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Google로 계속하기
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2 text-[13px] font-semibold text-muted-foreground hover:underline"
        >
          나중에 하기
        </button>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          계속하면 서비스 이용에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
