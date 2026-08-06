'use client';

// 공유데스크 데모 '데스크 찾기' 화면 (/desk/search)
// 첨부 시안(이미지 3·4)을 옮긴 필터 화면. 상단 헤더+섹션 탭(스크롤 스파이)이 고정되고,
// 본문은 지역·데스크등급·신뢰등급·가격범위·편의시설·정렬·즉시입주 순으로 쌓이며,
// 하단에 초기화·검색 액션바가 고정된다. 색은 /desk와 같은 --desk-* 토큰만 쓴다.
//
// 지역 칸을 누르면 /desk/region으로 이동해 지역을 고르고 돌아온다. 왕복에도 선택이
// 유지되도록 상태는 deskSearchStore(sessionStorage)로 오간다.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CLEARED_FILTERS,
  DEFAULT_FILTERS,
  PRICE_MAX,
  loadFilters,
  saveFilters,
  type DeskSearchFilters,
} from './deskSearchStore';

const PRICE_STEP = 10000;
// 고정 헤더(h-14=56) + 섹션 탭(약 49) 높이 — 스크롤 스파이·점프의 기준 선.
const HEADER_OFFSET = 112;

const GRADES = ['BASIC', 'STANDARD', 'PREMIUM'];
const TRUST_LEVELS = ['전체', '운영 이상', '검증 이상', '최고 등급'];
const AMENITIES = [
  'Wi-Fi', '주차', '카페·라운지', '탕비실', '모니터', '사물함',
  '회의실', '샤워실', '폰부스', '엘리베이터', '휠체어',
];
const SORTS = ['최신 순', '가격 낮은 순', '가격 높은 순', '신뢰도 높은 순', '평점 높은 순'];

// 상단 고정 탭 = 앞 5개 섹션으로 점프(정렬·즉시입주는 탭 없이 아래로 이어진다).
const SECTION_TABS = [
  { id: 'region', label: '지역' },
  { id: 'grade', label: '데스크 등급' },
  { id: 'trust', label: '사장님 신뢰 등급' },
  { id: 'price', label: '가격범위' },
  { id: 'amenity', label: '편의시설' },
];

/** 천 단위 콤마(서버/클라이언트 동일 결과 — 로케일 함수 대신 정규식). */
function comma(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ── 아이콘 ─────────────────────────────────────────────────────────────
type IconProps = { className?: string };
const ArrowLeft = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SearchIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const PinIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <path d="M10 17.5c3.5-3.6 5.5-6.3 5.5-9a5.5 5.5 0 1 0-11 0c0 2.7 2 5.4 5.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="10" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const CheckIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <path d="m5 10.5 3.5 3.5L15 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── 공용 조각 ──────────────────────────────────────────────────────────
/** 토글/선택 칩 — 활성이면 옅은 오렌지 배경+오렌지 글자, 아니면 외곽선. */
function Pill({
  active,
  onClick,
  children,
  className = '',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-9 rounded-full px-4 text-[13px] font-semibold transition ${
        active ? 'bg-desk-accent-soft text-desk-accent' : 'border border-desk-line text-desk-muted'
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** 섹션 머리(제목 + 우측 보조 액션). */
function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[15px] font-bold text-desk-ink">{title}</h2>
      {action}
    </div>
  );
}

/**
 * 가격 범위 듀얼 슬라이더 — 두 개의 손잡이 사이 구간을 오렌지로 채운다.
 * 포인터 캡처로 잡은 손잡이만 움직이고, 최소는 최대를, 최대는 최소를 넘지 못한다.
 */
function PriceRange({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<'min' | 'max' | null>(null);
  const minPct = (min / PRICE_MAX) * 100;
  const maxPct = (max / PRICE_MAX) * 100;

  const update = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || !activeRef.current) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = Math.round((ratio * PRICE_MAX) / PRICE_STEP) * PRICE_STEP;
    if (activeRef.current === 'min') onChange(Math.min(raw, max), max);
    else onChange(min, Math.max(raw, min));
  };

  const thumb = (which: 'min' | 'max', pct: number) => (
    <button
      type="button"
      aria-label={which === 'min' ? '최소 가격' : '최대 가격'}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        activeRef.current = which;
      }}
      onPointerMove={(e) => {
        if (activeRef.current) update(e.clientX);
      }}
      onPointerUp={() => {
        activeRef.current = null;
      }}
      onPointerCancel={() => {
        activeRef.current = null;
      }}
      className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-desk-accent bg-desk-surface shadow-sm"
      style={{ left: `${pct}%` }}
    />
  );

  return (
    <div className="px-1 pt-1">
      <div className="flex items-center justify-between text-[12px] text-desk-hint">
        <span>0</span>
        <span>{comma(PRICE_MAX)}</span>
      </div>
      <div ref={trackRef} className="relative mt-3 h-1.5 rounded-full bg-desk-line/70">
        <div
          className="absolute h-full rounded-full bg-desk-accent"
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
        />
        {thumb('min', minPct)}
        {thumb('max', maxPct)}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-desk-line px-4 py-2.5 text-center">
          <p className="text-[11px] text-desk-hint">최소</p>
          <p className="mt-0.5 text-[15px] font-bold text-desk-ink">{comma(min)}</p>
        </div>
        <div className="rounded-xl border border-desk-line px-4 py-2.5 text-center">
          <p className="text-[11px] text-desk-hint">최대</p>
          <p className="mt-0.5 text-[15px] font-bold text-desk-hint">{comma(max)}</p>
        </div>
      </div>
    </div>
  );
}

// ── 페이지 ─────────────────────────────────────────────────────────────
export default function DeskSearchPage() {
  const router = useRouter();
  // SSR 결정성을 위해 기본값으로 시작하고, 마운트 후 저장본을 불러온다(하이드레이션 안전).
  const [filters, setFilters] = useState<DeskSearchFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState('region');

  useEffect(() => {
    setFilters(loadFilters());
  }, []);

  // 상태 변경은 항상 이 함수로 — 저장까지 한 번에(별도 저장 effect의 순서 문제 회피).
  const update = (patch: Partial<DeskSearchFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      saveFilters(next);
      return next;
    });
  };

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  // 탭 클릭으로 이동하는 동안 스크롤 관찰이 활성 탭을 덮어쓰지 않게 잠근다.
  const scrollLock = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 스크롤 스파이 — 오프셋 선(고정 헤더+탭)을 지난 '마지막' 섹션을 활성 탭으로.
  // 항상 정확히 하나만 활성이고 아래로 갈수록 순서대로 바뀐다(중간을 훑는 깜빡임 없음).
  // 맨 아래에선 마지막 섹션(편의시설)을 활성으로 — 뒤 내용이 짧아 오프셋에 못 닿아도 보장한다.
  useEffect(() => {
    const onScroll = () => {
      if (scrollLock.current) return;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveTab(SECTION_TABS[SECTION_TABS.length - 1].id);
        return;
      }
      let current = SECTION_TABS[0].id;
      for (const { id } of SECTION_TABS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - HEADER_OFFSET < 1) current = id;
      }
      setActiveTab(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 탭 클릭 — 즉시 그 탭을 활성으로 바꾸고 그 위치로 부드럽게 스크롤한다.
  // 이동이 끝날 때까지 관찰을 잠가 중간 섹션을 훑고 지나가는 깜빡임을 막는다.
  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveTab(id);
    scrollLock.current = true;
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      scrollLock.current = false;
    }, 600);
    const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-muted-foreground/10">
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-desk-surface">
        {/* 헤더 */}
        <header className="sticky top-0 z-30 flex h-14 items-center bg-desk-surface px-3">
          <button type="button" aria-label="뒤로" onClick={() => router.back()} className="p-1 text-desk-ink">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-desk-ink">데스크 찾기</h1>
        </header>

        {/* 섹션 점프 탭(고정) */}
        <nav className="sticky top-14 z-20 flex gap-4 overflow-x-auto border-b border-desk-line/60 bg-desk-surface px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTION_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => jumpTo(id)}
              className={`shrink-0 whitespace-nowrap text-[13px] transition ${
                activeTab === id ? 'font-bold text-desk-ink' : 'font-medium text-desk-hint'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* 본문 — 섹션마다 구분선(divide-y). 콘텐츠는 각 섹션의 px-5로 여백을 주고
            구분선은 프레임 폭까지 그어 시안처럼 섹션을 나눈다. */}
        <div className="flex flex-1 flex-col divide-y divide-desk-line/50 pb-4">
          {/* 지역 */}
          <section id="region" className="flex scroll-mt-28 flex-col gap-3.5 px-5 py-6">
            <SectionHead title="지역" />
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => router.push('/desk/region')}
                className="flex h-12 flex-1 items-center justify-between rounded-xl border border-desk-line px-4"
              >
                <span className={`text-[14px] ${filters.region ? 'font-medium text-desk-ink' : 'text-desk-hint'}`}>
                  {filters.region || '지역을 선택해주세요'}
                </span>
                <SearchIcon className="h-5 w-5 text-desk-soft" />
              </button>
              <button
                type="button"
                aria-label="현재 위치로 찾기"
                onClick={() => router.push('/desk/region')}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-desk-line text-desk-soft"
              >
                <PinIcon className="h-5 w-5" />
              </button>
            </div>
          </section>

          {/* 데스크 등급 */}
          <section id="grade" className="flex scroll-mt-28 flex-col gap-3.5 px-5 py-6">
            <SectionHead
              title="데스크 등급"
              action={
                <button
                  type="button"
                  onClick={() => update({ grades: filters.grades.length === GRADES.length ? [] : [...GRADES] })}
                  className="text-[13px] text-desk-soft"
                >
                  모두 선택
                </button>
              }
            />
            <div className="grid grid-cols-3 gap-2">
              {GRADES.map((g) => (
                <Pill
                  key={g}
                  active={filters.grades.includes(g)}
                  onClick={() => update({ grades: toggleIn(filters.grades, g) })}
                  className="w-full"
                >
                  {g}
                </Pill>
              ))}
            </div>
          </section>

          {/* 사장님 신뢰 등급 */}
          <section id="trust" className="flex scroll-mt-28 flex-col gap-3.5 px-5 py-6">
            <SectionHead title="사장님 신뢰 등급" />
            {/* 4칸 균등 그리드는 칸이 좁아 '운영 이상' 등이 두 줄로 접힌다.
                flex-1로 폭을 나눠 채우고 whitespace-nowrap으로 한 줄 고정 */}
            <div className="flex gap-2">
              {TRUST_LEVELS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update({ trust: t })}
                  aria-pressed={filters.trust === t}
                  className={`h-9 flex-1 whitespace-nowrap rounded-full px-1 text-[13px] font-semibold transition ${
                    filters.trust === t ? 'bg-desk-accent-soft text-desk-accent' : 'border border-desk-line text-desk-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* 가격 범위 */}
          <section id="price" className="flex scroll-mt-28 flex-col gap-3.5 px-5 py-6">
            <SectionHead title="가격 범위" />
            <PriceRange
              min={filters.priceMin}
              max={filters.priceMax}
              onChange={(priceMin, priceMax) => update({ priceMin, priceMax })}
            />
          </section>

          {/* 편의시설 */}
          <section id="amenity" className="flex scroll-mt-28 flex-col gap-3.5 px-5 py-6">
            <SectionHead
              title="편의시설"
              action={
                <button
                  type="button"
                  onClick={() =>
                    update({ amenities: filters.amenities.length === AMENITIES.length ? [] : [...AMENITIES] })
                  }
                  className="text-[13px] text-desk-soft"
                >
                  모두 선택
                </button>
              }
            />
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <Pill
                  key={a}
                  active={filters.amenities.includes(a)}
                  onClick={() => update({ amenities: toggleIn(filters.amenities, a) })}
                >
                  {a}
                </Pill>
              ))}
            </div>
          </section>

          {/* 정렬 */}
          <section className="flex flex-col gap-3.5 px-5 py-6">
            <SectionHead title="정렬" />
            <div className="flex flex-wrap gap-2">
              {SORTS.map((s) => (
                <Pill key={s} active={filters.sort === s} onClick={() => update({ sort: s })}>
                  {s}
                </Pill>
              ))}
            </div>
          </section>

          {/* 즉시 입주 가능만 보기 */}
          <section className="flex items-center justify-between px-5 py-6">
            <span className="text-[15px] font-bold text-desk-ink">즉시 입주 가능만 보기</span>
            <button
              type="button"
              aria-label="즉시 입주 가능만 보기"
              aria-pressed={filters.instantOnly}
              onClick={() => update({ instantOnly: !filters.instantOnly })}
              className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                filters.instantOnly
                  ? 'border-desk-accent bg-desk-accent text-desk-on-dark'
                  : 'border-desk-line text-transparent'
              }`}
            >
              <CheckIcon className="h-3.5 w-3.5" />
            </button>
          </section>
        </div>

        {/* 하단 액션바(고정) */}
        <div className="sticky bottom-0 z-20 flex gap-2.5 border-t border-desk-line/70 bg-desk-surface px-5 py-3">
          <button
            type="button"
            onClick={() => update(CLEARED_FILTERS)}
            className="h-13 flex-1 rounded-xl border border-desk-line text-[15px] font-bold text-desk-muted"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={() => router.push('/desk/results')}
            className="h-13 flex-[2] rounded-xl bg-desk-accent text-[15px] font-bold text-desk-on-dark"
          >
            검색
          </button>
        </div>
      </div>
    </div>
  );
}
