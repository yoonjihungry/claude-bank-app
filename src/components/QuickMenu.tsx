import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * 홈 히어로 아래 빠른 메뉴 — 자주 가는 화면으로 바로 이동한다(새 기능이 아니라 바로가기).
 * '기록'만 옐로 포인트 아이콘으로 강조하고 나머지는 회색 칩.
 */
interface Item {
  label: string;
  href: string;
  icon: ReactNode;
  primary?: boolean;
}

const ITEMS: Item[] = [
  {
    label: '기록',
    href: '/transactions',
    primary: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" className="h-[18px] w-[18px]">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    label: '통계',
    href: '/mypage',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M6 20v-7M12 20V8M18 20V4" />
      </svg>
    ),
  },
  {
    label: '예산',
    href: '/budget',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M12 3a9 9 0 1 0 9 9h-9z" />
        <path d="M12 3v9l6.4 6.4" />
      </svg>
    ),
  },
  {
    label: '고정',
    href: '/budget',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M21 12a9 9 0 1 1-2.6-6.4" />
        <path d="M21 4v4h-4" />
      </svg>
    ),
  },
];

export default function QuickMenu() {
  return (
    <div className="flex justify-between gap-2">
      {ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-card py-3.5 text-ink shadow-sm transition hover:bg-muted/40"
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              item.primary ? 'bg-accent text-accent-foreground' : 'bg-muted text-ink'
            }`}
          >
            {item.icon}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
