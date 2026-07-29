'use client';

// 마이페이지 상단 계정 카드. 로그인 시 아바타·이름·이메일·로그아웃, 비로그인 시 로그인 유도.
// 게이팅 정책 B라 비로그인도 앱은 그대로 쓰며, 이 카드는 로그인 진입점일 뿐이다.
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import LoginSheet from './LoginSheet';

export default function ProfileCard() {
  const { data: session, status } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (status === 'loading') {
    // 세션 확인 중 — 자리만 유지(레이아웃 흔들림 방지)
    return <div className="h-[76px] animate-pulse rounded-2xl bg-muted" />;
  }

  if (!session?.user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-sm transition hover:bg-muted/40"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 19.5a7 7 0 0 1 14 0" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-base font-bold text-foreground">로그인하기</span>
            <span className="text-[13px] text-muted-foreground">
              로그인하면 기기가 바뀌어도 내역이 남아요
            </span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-auto h-5 w-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <LoginSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </>
    );
  }

  const { name, email, image } = session.user;
  const label = name ?? email ?? '사용자';

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm">
      {image ? (
        // 프로필 이미지(Google) — 외부 도메인이라 next/image 최적화 대신 일반 img 사용
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-12 w-12 shrink-0 rounded-full" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
          {label.slice(0, 1)}
        </span>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-base font-bold text-foreground">{label}</span>
        {email && <span className="truncate text-[13px] text-muted-foreground">{email}</span>}
      </div>
      <button
        type="button"
        onClick={() => signOut()}
        className="ml-auto shrink-0 rounded-full border border-input px-3 py-1.5 text-[13px] font-semibold text-muted-foreground transition hover:bg-muted"
      >
        로그아웃
      </button>
    </div>
  );
}
