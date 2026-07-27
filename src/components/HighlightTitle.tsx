import type { ReactNode } from 'react';

/**
 * 섹션 제목 — 글자 아래에 형광펜 밑줄(warning 톤)을 깐 친근한 헤딩.
 * 대시보드 섹션 제목에 공통으로 쓴다. 색은 tokens.css의 --warning을 투명도로 흐린다.
 */
export default function HighlightTitle({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block text-[15px] font-extrabold tracking-tight text-ink">
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden="true"
        className="absolute inset-x-[-2px] bottom-0 z-0 h-1.5 rounded-full bg-warning/35"
      />
    </span>
  );
}
