'use client';

// 헤더 우측 로그인 영역. 비로그인이면 "로그인" 버튼(Google), 로그인이면 아바타 + 로그아웃.
// 게이팅 정책 B이므로 로그인 없이도 앱은 그대로 동작한다(이 버튼은 선택적 진입점).
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import LoginSheet from '@/components/LoginSheet';

export default function HeaderAuth() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (status === 'loading') {
    // 세션 확인 중 — 버튼 자리만 유지(레이아웃 흔들림 방지)
    return <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />;
  }

  if (!session?.user) {
    // 클릭 시 바로 구글로 튕기지 않고 안내 바텀시트를 먼저 연다(정책 B).
    return (
      <>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/15"
        >
          로그인
        </button>
        <LoginSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </>
    );
  }

  const { name, email, image } = session.user;
  const label = name ?? email ?? '사용자';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-input p-0.5 pr-2.5 transition hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {image ? (
          // 프로필 이미지(Google) — 외부 도메인이라 next/image 최적화 대신 일반 img 사용
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-7 w-7 rounded-full" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {label.slice(0, 1)}
          </span>
        )}
        <span className="max-w-[8rem] truncate text-sm font-medium text-foreground">
          {label}
        </span>
      </button>

      {open && (
        <>
          {/* 바깥 클릭 시 닫힘 */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
          >
            <div className="border-b border-border px-3 py-2">
              <p className="truncate text-sm font-medium text-foreground">{label}</p>
              {email && (
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              )}
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="block w-full px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
            >
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}
