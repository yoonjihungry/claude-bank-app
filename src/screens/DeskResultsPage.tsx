'use client';

// 공유데스크 데모 '검색 결과' 화면 (/desk/results)
// 첨부 시안을 옮긴 결과 리스트. 상단: 뒤로 + 지역 검색칸(X로 지역 해제). 그 아래 고정 바:
// 데스크/오피스 보기 토글 · 정렬 · 필터. 본문은 세로 카드 리스트(사진·배지·이름·위치·가격·보증금),
// 하단에 '지도' 플로팅 버튼과 맨 위로 버튼. 색은 /desk와 같은 --desk-* 토큰만 쓴다.
//
// '필터' 칩을 누르면 /desk/search로 돌아가고, 지역 검색칸을 누르면 /desk/region으로 간다.
// 지역 표시는 필터 저장소(deskSearchStore)에서 읽어 온다.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadFilters, saveFilters, DEFAULT_FILTERS } from './deskSearchStore';

interface ResultItem {
  id: string;
  name: string;
  area: string;
  address: string;
  price: string; // 월 이용료(콤마 포함)
  deposit: string; // 보증금(콤마 포함)
  grade?: string; // BASIC | STANDARD | PREMIUM
  top?: boolean;
  instant?: boolean; // 즉시 입주
}

// 결과 샘플 8건 — /desk의 성수(허브스페이스) 톤에 맞춘 플레이스홀더. 사진은 회색 placeholder.
const RESULTS: ResultItem[] = [
  { id: 'r1', name: '쉐어룸 데스크 5', area: '성수', address: '서울 송파구 올림픽로 269', price: '150,000', deposit: '60,000', grade: 'BASIC', top: true, instant: true },
  { id: 'r2', name: '쉐어룸 데스크 6', area: '성수', address: '서울 송파구 올림픽로 269', price: '180,000', deposit: '90,000', grade: 'BASIC', top: true, instant: true },
  { id: 'r3', name: '스탠다드 데스크 1', area: '성수', address: '서울 송파구 올림픽로 269', price: '202,000', deposit: '90,000', grade: 'STANDARD', top: true, instant: true },
  { id: 'r4', name: '스탠다드 데스크 1', area: '성수', address: '서울 송파구 올림픽로 269', price: '202,000', deposit: '90,000', grade: 'STANDARD', top: true, instant: true },
  { id: 'r5', name: '데스크 4', area: '성수', address: '서울 송파구 올림픽로 269', price: '262,000', deposit: '130,000', grade: 'STANDARD', top: true, instant: true },
  { id: 'r6', name: '데스크 5', area: '성수', address: '서울 송파구 올림픽로 269', price: '264,000', deposit: '100,000', instant: true },
  { id: 'r7', name: '데스크 6', area: '성수', address: '서울 송파구 올림픽로 269', price: '286,000', deposit: '110,000', grade: 'STANDARD', instant: true },
  { id: 'r8', name: '데스크 5', area: '성수', address: '서울 송파구 올림픽로 269', price: '331,000', deposit: '130,000', grade: 'PREMIUM', top: true, instant: true },
];

// ── 아이콘 ─────────────────────────────────────────────────────────────
type IconProps = { className?: string };
const ArrowLeft = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const XCircle = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <circle cx="10" cy="10" r="8" fill="currentColor" opacity="0.28" />
    <path d="m7.5 7.5 5 5m0-5-5 5" stroke="hsl(var(--desk-surface))" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const SlidersIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <path d="M3 6h9M3 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="15" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="11" cy="14" r="2.2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const ChevronDown = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronUp = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="m7 14 5-5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const HeartIcon = ({ className, filled }: IconProps & { filled?: boolean }) => (
  <svg viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} className={className} aria-hidden>
    <path d="M8 13.5S2 10 2 5.9A3.4 3.4 0 0 1 8 4a3.4 3.4 0 0 1 6 1.9C14 10 8 13.5 8 13.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);
const InfoIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
    <path d="M8 7.2v3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="8" cy="5.2" r="0.7" fill="currentColor" />
  </svg>
);
const PinIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <path d="M10 17.5c3.5-3.6 5.5-6.3 5.5-9a5.5 5.5 0 1 0-11 0c0 2.7 2 5.4 5.5 9Z" fill="currentColor" />
    <circle cx="10" cy="8.5" r="1.9" fill="hsl(var(--desk-accent))" />
  </svg>
);
const ImagePlaceholderIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" />
    <path d="m4 17 5-4 4 3 3-2 4 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

function ImgPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-muted ${className}`}>
      <ImagePlaceholderIcon className="h-8 w-8 text-desk-line" />
    </div>
  );
}

// ── 결과 카드 ──────────────────────────────────────────────────────────
function ResultCard({ item }: { item: ResultItem }) {
  const [liked, setLiked] = useState(false);
  const isPremium = item.grade === 'PREMIUM';
  return (
    <article className="flex flex-col">
      <div className="relative">
        <ImgPlaceholder className="aspect-16/10 w-full rounded-xl" />
        {item.top && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-0.5 rounded bg-desk-accent-strong px-1.5 py-0.5 text-[11px] font-semibold text-desk-on-dark">
            <span>TOP</span>
            <span>사장님</span>
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {item.instant && (
              <span className="inline-flex items-center rounded bg-desk-badge px-1.5 py-0.5 text-[11px] font-semibold text-desk-muted">
                즉시 입주
              </span>
            )}
            {item.grade && (
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                  isPremium ? 'bg-desk-accent-soft text-desk-accent' : 'bg-desk-badge text-desk-muted'
                }`}
              >
                {item.grade}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label={liked ? '찜 해제' : '찜'}
            aria-pressed={liked}
            onClick={() => setLiked((v) => !v)}
            className={liked ? 'text-desk-accent' : 'text-desk-body'}
          >
            <HeartIcon className="h-[18px] w-[18px]" filled={liked} />
          </button>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-bold text-desk-ink">{item.name}</h3>
            <p className="mt-1 truncate text-[12px] font-medium text-desk-hint">
              {item.area} · {item.address}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="flex items-baseline justify-end gap-0.5">
              <span className="text-[17px] font-bold text-desk-ink">{item.price}</span>
              <span className="text-[12px] font-medium text-desk-ink">원/월</span>
            </p>
            <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-desk-hint">
              <span>보증금 {item.deposit}원</span>
              <InfoIcon className="h-3.5 w-3.5" />
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── 페이지 ─────────────────────────────────────────────────────────────
export default function DeskResultsPage() {
  const router = useRouter();
  const [region, setRegion] = useState(DEFAULT_FILTERS.region);
  const [sort, setSort] = useState(DEFAULT_FILTERS.sort);
  const [view, setView] = useState<'desk' | 'office'>('desk');

  // 마운트 후 필터 저장소에서 지역·정렬을 읽어 온다(하이드레이션 안전).
  useEffect(() => {
    const f = loadFilters();
    setRegion(f.region);
    setSort(f.sort);
  }, []);

  const clearRegion = () => {
    setRegion('');
    saveFilters({ ...loadFilters(), region: '' });
  };

  return (
    <div className="min-h-screen bg-muted-foreground/10">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-desk-surface">
        {/* 헤더 — 뒤로 + 지역 검색칸 */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-desk-surface px-3">
          <button type="button" aria-label="뒤로" onClick={() => router.back()} className="p-1 text-desk-ink">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex h-10 flex-1 items-center gap-2 rounded-full bg-desk-badge/50 px-4">
            <button
              type="button"
              onClick={() => router.push('/desk/region')}
              className={`flex-1 truncate text-left text-[14px] ${region ? 'font-medium text-desk-ink' : 'text-desk-hint'}`}
            >
              {region || '지역·데스크 검색'}
            </button>
            {region && (
              <button type="button" aria-label="지역 지우기" onClick={clearRegion} className="text-desk-soft">
                <XCircle className="h-5 w-5" />
              </button>
            )}
          </div>
        </header>

        {/* 고정 바 — 보기 토글 · 정렬 · 필터 */}
        <div className="sticky top-14 z-20 flex items-center gap-4 border-b border-desk-line/60 bg-desk-surface px-4 py-2.5">
          <button
            type="button"
            onClick={() => setView('desk')}
            className={`text-[14px] ${view === 'desk' ? 'font-bold text-desk-ink' : 'font-medium text-desk-hint'}`}
          >
            데스크 보기
          </button>
          <button
            type="button"
            onClick={() => setView('office')}
            className={`text-[14px] ${view === 'office' ? 'font-bold text-desk-ink' : 'font-medium text-desk-hint'}`}
          >
            오피스 보기
          </button>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/desk/search')}
              className="flex items-center gap-0.5 text-[13px] font-medium text-desk-body"
            >
              {sort}
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => router.push('/desk/search')}
              className="flex items-center gap-1 text-[13px] font-medium text-desk-body"
            >
              <SlidersIcon className="h-4 w-4" />
              필터
            </button>
          </div>
        </div>

        {/* 결과 리스트 */}
        <div className="flex flex-col gap-6 px-4 py-4 pb-24">
          {RESULTS.map((it) => (
            <ResultCard key={it.id} item={it} />
          ))}
        </div>

        {/* 플로팅 — 지도 버튼(가운데) + 맨 위로(오른쪽). 높이 0으로 흐름을 차지하지 않고 뷰포트 하단에 고정 */}
        <div className="pointer-events-none sticky bottom-0 z-30 h-0">
          <div className="absolute inset-x-0 bottom-5 flex items-center justify-center px-4">
            <button
              type="button"
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-desk-accent px-4 py-2.5 text-[14px] font-bold text-desk-on-dark shadow-lg"
            >
              <PinIcon className="h-4.5 w-4.5" />
              지도
            </button>
            <button
              type="button"
              aria-label="맨 위로"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="pointer-events-auto absolute right-4 flex h-11 w-11 items-center justify-center rounded-full border border-desk-line bg-desk-surface text-desk-body shadow-md"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
