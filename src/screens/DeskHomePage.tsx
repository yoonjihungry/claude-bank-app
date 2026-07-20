'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * 공유데스크 데모 홈 화면 (/desk)
 * 피그마 시안 "Main_on"(360×2860)을 옮긴 독립 전체화면. 자체 상태바·헤더·하단 내비·푸터를 포함한다.
 * 상호작용은 이 화면 안에서만 동작하는 로컬 state(useState) — 라우팅/데이터 연동은 없다.
 * 색은 모두 --desk-* 디자인 토큰(tokens.css)만 사용하고, 이미지는 회색 플레이스홀더로 둔다(추후 교체).
 *
 * 섹션 순서(위→아래): 상태바 · 헤더 · 메인배너 · 검색 · 지금 인기 데스크 · 맞춤 추천 ·
 *   공데AI CTA · 어디서 일하세요(그리드) · 프로모 배너 · 아티클 슬라이드(01~06) · 푸터+하단내비
 */

// ── 데이터(플레이스홀더) ────────────────────────────────────────────────
interface DeskItem {
  name: string;
  desks: string;
  area: string;
  address: string;
  price: string;
  top?: boolean;
  grade?: string; // 'BASIC' | 'STANDARD' | 'PREMIUM' — '새로 등록된 데스크' 리스트 배지
}

// sharedesk.co.kr의 "지금 인기 데스크"(신뢰등급 높은 순) 구성을 참고한 샘플 8건.
// 같은 지점의 좌석이 여러 건 걸리는 게 원본 성격이라 업체명이 반복된다.
const POPULAR_DESKS: DeskItem[] = [
  { name: '허브스페이스 잠실점', desks: '베이직석 #5', area: '잠실', address: '서울 송파구 올림픽로 269', price: '265,000', top: true },
  { name: '허브스페이스 잠실점', desks: '베이직석 #4', area: '잠실', address: '서울 송파구 올림픽로 269', price: '300,000', top: true },
  { name: '허브스페이스 잠실점', desks: '스탠다드석 #3', area: '잠실', address: '서울 송파구 올림픽로 269', price: '405,000', top: true },
  { name: '허브스페이스 잠실점', desks: '스탠다드석 #2', area: '잠실', address: '서울 송파구 올림픽로 269', price: '380,000', top: true },
  { name: '허브스페이스 잠실점', desks: '프리미엄석 #1', area: '잠실', address: '서울 송파구 올림픽로 269', price: '585,000', top: true },
  { name: '코워크라운지 성수점', desks: '베이직석 #5', area: '성수', address: '서울 성동구 아차산로 17', price: '285,000', top: true },
  { name: '코워크라운지 성수점', desks: '베이직석 #4', area: '성수', address: '서울 성동구 아차산로 17', price: '260,000', top: true },
  { name: '코워크라운지 성수점', desks: '스탠다드석 #3', area: '성수', address: '서울 성동구 아차산로 17', price: '425,000' },
];

// 같은 출처(sharedesk.co.kr /desks)의 다른 지점 8건 — 인기 데스크(잠실·성수)와 겹치지 않게 강남·광화문으로 골랐다.
const RECOMMENDED_DESKS: DeskItem[] = [
  { name: '위코워킹 강남점', desks: '베이직석 #5', area: '강남', address: '서울 강남구 테헤란로 152', price: '305,000', top: true },
  { name: '위코워킹 강남점', desks: '베이직석 #4', area: '강남', address: '서울 강남구 테헤란로 152', price: '280,000', top: true },
  { name: '위코워킹 강남점', desks: '스탠다드석 #3', area: '강남', address: '서울 강남구 테헤란로 152', price: '385,000', top: true },
  { name: '위코워킹 강남점', desks: '스탠다드석 #2', area: '강남', address: '서울 강남구 테헤란로 152', price: '420,000', top: true },
  { name: '위코워킹 강남점', desks: '프리미엄석 #1', area: '강남', address: '서울 강남구 테헤란로 152', price: '565,000', top: true },
  { name: '데일리워크 광화문점', desks: '베이직석 #5', area: '광화문', address: '서울 종로구 세종대로 175', price: '265,000', top: true },
  { name: '데일리워크 광화문점', desks: '베이직석 #4', area: '광화문', address: '서울 종로구 세종대로 175', price: '300,000', top: true },
  { name: '데일리워크 광화문점', desks: '스탠다드석 #3', area: '광화문', address: '서울 종로구 세종대로 175', price: '405,000' },
];

// '새로 등록된 데스크' 세로 리스트 샘플. 카드마다 등급 배지(grade)가 붙는다.
const NEW_DESKS: DeskItem[] = [
  { name: '허브스페이스 잠실점', desks: '쉐어룸 데스크 5', area: '잠실', address: '서울 송파구 올림픽로 269', price: '265,000', top: true, grade: 'BASIC' },
  { name: '허브스페이스 잠실점', desks: '쉐어룸 데스크 4', area: '잠실', address: '서울 송파구 올림픽로 269', price: '265,000', grade: 'PREMIUM' },
  { name: '허브스페이스 잠실점', desks: '쉐어룸 데스크 3', area: '잠실', address: '서울 송파구 올림픽로 269', price: '265,000', top: true, grade: 'BASIC' },
];

interface GridItem {
  name: string;
  likes: string;
  reviews: string;
  liked?: boolean;
}

// '어디서 일하세요?' 그리드 샘플. 4건씩 3페이지로 끊어 보여주므로 12건을 둔다.
const GRID_DESKS: GridItem[] = [
  { name: '위코워킹 강남점', likes: '1,200', reviews: '20', liked: true },
  { name: '오피스버드 역삼점', likes: '200', reviews: '5' },
  { name: '패스트파이브 서초점', likes: '1,846', reviews: '135' },
  { name: '허브스페이스 잠실점', likes: '16', reviews: '12' },
  { name: '코워크라운지 성수점', likes: '842', reviews: '61' },
  { name: '데일리워크 광화문점', likes: '95', reviews: '8' },
  { name: '스페이스온 판교점', likes: '2,310', reviews: '188' },
  { name: '워크베이스 여의도점', likes: '430', reviews: '27' },
  { name: '누크오피스 홍대점', likes: '1,058', reviews: '74' },
  { name: '더데스크 종로점', likes: '61', reviews: '9' },
  { name: '플랫폼워크 마포점', likes: '736', reviews: '52' },
  { name: '리버뷰데스크 강서점', likes: '148', reviews: '15' },
];

// 그리드 한 페이지에 보여주는 카드 수(2열 × 2행)
const GRID_PAGE_SIZE = 4;

const REGIONS = ['전체', '강남', '판교', '여의도', '성수', '홍대', '종로', '마포', '강서'];

const ARTICLES: { title: string; subtitle: string }[] = [
  { title: '판교 개발자의\n코워킹 데스크 가이드', subtitle: '초몰입을 위한 나만의 워크스페이스' },
  { title: '공유데스크\n이렇게 고르세요', subtitle: '강남권 데스크를 고르는 꿀팁' },
  { title: '크리에이터를 위한\n감각적인 공간', subtitle: '영감을 깨우는 나만의 워크스페이스' },
  { title: '공유데스크 활용하는\n5가지 방법', subtitle: '같은 비용으로 더 잘쓰는 실전 팁' },
  { title: '사무실 임대\nvs 공유데스크', subtitle: '1인·소규모 기준 현실 계산' },
  { title: '원격근무자를 위한\n체크리스트', subtitle: '생산성 높은 데스크를 고르는 방법' },
];

// ── 아이콘(인라인 SVG, currentColor) ───────────────────────────────────
type IconProps = { className?: string };

const HomeIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <path d="M3 8.5 10 3l7 5.5V16a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1V8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
const SearchIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const CalendarIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 8h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const UserIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 16.5a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const BellIcon = ({ className }: IconProps) => (
  <svg viewBox="2 2 20 20" fill="none" className={className} aria-hidden>
    <path d="M6 9a6 6 0 0 1 12 0c0 3.5 1 5 1.5 5.5H4.5C5 14 6 12.5 6 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="18" cy="6" r="2.5" fill="hsl(var(--desk-accent))" />
  </svg>
);
const ChevronRight = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronLeft = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
// 시안의 arrow 벡터는 가로:세로가 2:1(탭 확장 10x5, 푸터 8x4)인 아래쪽 chevron이다.
const ChevronDown = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const HeartIcon = ({ className, filled }: IconProps & { filled?: boolean }) => (
  <svg viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} className={className} aria-hidden>
    <path d="M8 13.5S2 10 2 5.9A3.4 3.4 0 0 1 8 4a3.4 3.4 0 0 1 6 1.9C14 10 8 13.5 8 13.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);
const PlusIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const ImagePlaceholderIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" />
    <path d="m4 17 5-4 4 3 3-2 4 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

// ── 공용 조각 ──────────────────────────────────────────────────────────
/** 이미지 자리(추후 실제 사진으로 교체) */
function ImgPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-muted ${className}`}>
      <ImagePlaceholderIcon className="h-7 w-7 text-desk-line" />
    </div>
  );
}

/** 둥근 칩 */
function Chip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={`inline-flex h-8 items-center rounded-full px-4 text-[13px] font-medium ${
        active ? 'bg-desk-accent text-desk-on-dark' : 'border border-desk-line text-desk-muted'
      }`}
    >
      {label}
    </span>
  );
}

/**
 * 자동 슬라이드 캐러셀 (화면 내 인터랙션).
 * 무한 루프: 첫 슬라이드 복제본을 끝에 붙여 마지막 → 첫으로 되감지 않고 앞으로 계속 진행하고,
 * 복제본에 도달하면 트랜지션을 끈 채 0으로 스냅해 되감김을 감춘다.
 */
function AutoCarousel({
  count,
  interval = 5000,
  className = '',
  indicatorClassName,
  children,
}: {
  count: number;
  interval?: number;
  className?: string;
  indicatorClassName?: string; // 지정 시 현재 슬라이드 페이징(1/N)을 캐러셀 위 고정 오버레이로 표시
  children: (dataIndex: number) => ReactNode;
}) {
  const [idx, setIdx] = useState(0);
  const [animate, setAnimate] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimate(true);
      setIdx((i) => i + 1);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);
  const order = [...Array.from({ length: count }, (_, i) => i), 0]; // 원본들 + 첫 슬라이드 복제본
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className={`flex h-full ${animate ? 'transition-transform duration-700 ease-out' : ''}`}
        style={{ transform: `translateX(-${idx * 100}%)` }}
        onTransitionEnd={() => {
          if (idx >= count) {
            setAnimate(false); // 복제본(=첫 슬라이드) 도달 → 애니메이션 없이 되감아 감춘다
            setIdx(0);
          }
        }}
      >
        {order.map((dataIndex, i) => (
          <div key={i} className="h-full w-full shrink-0">
            {children(dataIndex)}
          </div>
        ))}
      </div>
      {/* 페이징: 슬라이드마다 박지 않고 캐러셀 위 한 곳에 고정, 현재 슬라이드만 표시 */}
      {indicatorClassName && (
        <span
          className={`absolute z-10 inline-flex h-6 items-center rounded-full bg-desk-ink px-2.5 text-[11px] text-desk-on-dark ${indicatorClassName}`}
        >
          {(idx % count) + 1} / {count}
        </span>
      )}
    </div>
  );
}

// ── 섹션들 ─────────────────────────────────────────────────────────────
function Header() {
  return (
    <header className="flex h-[60px] items-center justify-between bg-desk-surface px-5">
      <span className="text-[20px] font-extrabold tracking-tight text-desk-accent">GONGDE</span>
      <button type="button" aria-label="알림" className="text-desk-ink">
        <BellIcon className="h-6 w-6" />
      </button>
    </header>
  );
}

/** 히어로 배너 슬라이드 — 1번은 피그마 시안, 2·3번은 플레이스홀더 문구(실제 문구 확정 시 교체) */
const BANNERS: { title: string; subtitle: string }[] = [
  { title: '한눈에 비교하는\n등급별 데스크 가이드', subtitle: '베이직부터 프리미엄까지 라인업 확인' },
  { title: '출퇴근 걱정 없는\n역세권 데스크 모음', subtitle: '지하철 5분 거리 워크스페이스' },
  { title: '팀 단위로 쓰기 좋은\n프라이빗 오피스', subtitle: '4인부터 이용 가능한 공간' },
];

function MainBanner() {
  return (
    <section className="px-5">
      <AutoCarousel
        count={BANNERS.length}
        className="aspect-320/280 rounded-[20px] bg-desk-ink"
        indicatorClassName="bottom-5 right-6"
      >
        {(i) => {
          const b = BANNERS[i];
          // 시안: 본문 블록 하단이 바닥에서 68px(간격24+배지24+패딩20) 위, 좌측 24px
          return (
            <div className="relative flex h-full w-full flex-col justify-end px-6 pb-17">
              {/* 배경 이미지 자리(그라디언트 오버레이) */}
              <div className="absolute inset-0 bg-gradient-to-br from-desk-primary/70 to-desk-ink" aria-hidden />
              <div className="relative flex w-full flex-col gap-2">
                <h2 className="whitespace-pre-line text-[22px] font-bold leading-[1.25] text-desk-on-dark">{b.title}</h2>
                <p className="text-[13px] tracking-[-0.26px] text-desk-on-dark">{b.subtitle}</p>
              </div>
            </div>
          );
        }}
      </AutoCarousel>
    </section>
  );
}

function DeskCard({ item }: { item: DeskItem }) {
  return (
    <article className="flex w-60 shrink-0 flex-col gap-3">
      <div className="relative">
        <ImgPlaceholder className="h-[154px] w-full rounded-xl" />
        {item.top && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded bg-desk-accent-strong px-1.5 py-0.5 text-[11px] font-semibold text-desk-on-dark">
            <span>TOP</span>
            <span>사장님</span>
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-bold text-desk-ink">{item.name}</h3>
          <span className="h-3 w-px bg-desk-line" />
          <span className="text-[14px] font-bold text-desk-ink">{item.desks}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-desk-hint">
          <span>{item.area}</span>
          <span>∙</span>
          <span>{item.address}</span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-[16px] font-bold text-desk-ink">{item.price}</span>
          <span className="text-[13px] font-medium text-desk-ink">원</span>
        </div>
      </div>
    </article>
  );
}

/**
 * 데스크 가로 캐러셀 — 아티클과 같은 "한 번 끌면 딱 1장" 손맛(useOneStepDrag).
 * 아티클과 달리 센터 모드/무한 순환이 아니라 왼쪽 정렬 + 양끝에서 멈춘다(참고 시안도 loop 없음).
 */
function DeskCarousel({ title, items }: { title: string; items: DeskItem[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [metrics, setMetrics] = useState({ step: 0, max: 0 });

  // 카드 폭·간격·좌우 여백은 CSS가 정하므로 실측한다. 뷰포트를 직접 관찰해야
  // 세로 스크롤바 유무로 폭이 바뀌는 것까지 잡힌다(window resize는 이때 안 온다).
  useLayoutEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => {
      const track = trackRef.current;
      const first = track?.children[0] as HTMLElement | undefined;
      const second = track?.children[1] as HTMLElement | undefined;
      if (!track || !first || !second) return;
      const cardW = first.getBoundingClientRect().width;
      const step = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
      const cs = getComputedStyle(track);
      // 마지막 카드가 오른쪽 여백까지 온전히 보이는 지점 = 이동 한계
      const content = parseFloat(cs.paddingLeft) + items.length * step - (step - cardW) + parseFloat(cs.paddingRight);
      setMetrics({ step, max: Math.max(0, content - vp.clientWidth) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [items.length]);

  // 끝까지 가는 데 필요한 칸 수. step으로 딱 나눠떨어지지 않아 마지막 칸은 짧게 이동한다.
  const maxIndex = metrics.step ? Math.ceil(metrics.max / metrics.step) : 0;
  const { offset, transition, handlers } = useOneStepDrag(metrics.step, (dir) =>
    setIndex((i) => Math.min(maxIndex, Math.max(0, i + dir))),
  );

  // 인덱스의 "확정 위치". 마지막 칸은 step 배수가 아니라 끝(max)에 붙는다 —
  // -index*step을 그대로 쓰고 결과만 자르면, 마지막에서 되돌릴 때 잘려나간 만큼
  // (step - 나머지) 끌어도 꿈쩍 않는 死구간이 생긴다.
  const at = (i: number) => Math.min(i * metrics.step, metrics.max);
  // 양끝을 넘어가지 않게 이동량 자체를 가둔다 → 끄는 중에도 빈 공간이 드러나지 않는다.
  const x = Math.max(-metrics.max, Math.min(0, -at(index) + offset));

  return (
    <section className="flex flex-col gap-3.5">
      <h2 className="px-5 text-[18px] font-bold text-desk-ink">{title}</h2>
      <div ref={viewportRef} className="overflow-hidden pb-1">
        <div
          ref={trackRef}
          {...handlers}
          className="flex touch-pan-y cursor-grab gap-3 px-5 select-none active:cursor-grabbing"
          style={{ transform: `translate3d(${x}px, 0, 0)`, transition }}
        >
          {items.map((it) => (
            // 같은 지점의 좌석이 여러 건이라 name만으론 안 되고 좌석까지 묶어야 유일해진다
            <DeskCard key={`${it.name}-${it.desks}`} item={it} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * '새로 등록된 데스크' 리스트의 가로형 카드 — 좌측 세로형 썸네일 + 우측 정보 세로 스택.
 * 우측은 위에서부터 배지 → 이름/좌석(2줄) → 지역·주소 → 가격 → 찜/담기 순으로 쌓인다.
 */
function NewDeskCard({ item }: { item: DeskItem }) {
  const [liked, setLiked] = useState(false);
  const isPremium = item.grade === 'PREMIUM';
  return (
    <article className="flex gap-3.5 px-5">
      <ImgPlaceholder className="h-[146px] w-30 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5">
          {item.top && (
            <span className="inline-flex items-center gap-0.5 rounded bg-desk-accent-strong px-1.5 py-0.5 text-[11px] font-semibold text-desk-on-dark">
              <span>TOP</span>
              <span>사장님</span>
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
        {/* 이름과 좌석명은 구분선 없이 두 줄로 쌓인다 */}
        <h3 className="mt-2.5 truncate text-[15px] font-bold leading-[1.4] text-desk-ink">{item.name}</h3>
        <p className="truncate text-[15px] font-bold leading-[1.4] text-desk-ink">{item.desks}</p>
        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-desk-hint">
          <span className="shrink-0">{item.area}</span>
          <span>∙</span>
          <span className="truncate">{item.address}</span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-0.5">
          <span className="text-[18px] font-bold text-desk-ink">{item.price}</span>
          <span className="text-[13px] font-medium text-desk-ink">원</span>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            aria-label={liked ? '찜 해제' : '찜'}
            aria-pressed={liked}
            onClick={() => setLiked((v) => !v)}
            className={liked ? 'text-desk-accent' : 'text-desk-body'}
          >
            <HeartIcon className="h-[18px] w-[18px]" filled={liked} />
          </button>
          <button
            type="button"
            aria-label="담기"
            className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-desk-line text-desk-body"
          >
            <PlusIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
    </article>
  );
}

function NewDesksSection() {
  return (
    <section className="flex flex-col gap-3.5">
      <h2 className="px-5 text-[18px] font-bold text-desk-ink">새로 등록된 데스크</h2>
      <div className="flex flex-col gap-5">
        {NEW_DESKS.map((it) => (
          <NewDeskCard key={`${it.name}-${it.desks}-${it.grade}`} item={it} />
        ))}
      </div>
    </section>
  );
}

function AiCta() {
  return (
    <section className="px-5">
      <button
        type="button"
        className="flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[10px] border border-desk-line bg-desk-surface text-[14px] font-semibold text-desk-muted shadow-sm"
      >
        <span>공데AI 맞춤 추천 더보기</span>
      </button>
    </section>
  );
}

function WhereGridCard({ item }: { item: GridItem }) {
  const [liked, setLiked] = useState(!!item.liked);
  return (
    <article className="flex flex-col gap-3">
      <div className="relative">
        <ImgPlaceholder className="aspect-square w-full rounded-xl" />
        <button
          type="button"
          aria-label={liked ? '관심 해제' : '관심'}
          aria-pressed={liked}
          onClick={() => setLiked((v) => !v)}
          className={`absolute right-2.5 bottom-2.5 ${liked ? 'text-desk-accent' : 'text-desk-on-dark'}`}
        >
          <HeartIcon className="h-4 w-4" filled={liked} />
        </button>
      </div>
      <div className="flex flex-col gap-0.5 px-1">
        <h3 className="text-[14px] font-bold text-desk-ink">{item.name}</h3>
        <div className="flex items-center gap-1 text-[11px] font-medium text-desk-hint">
          <span>관심 {item.likes}</span>
          <span>∙</span>
          <span>리뷰 {item.reviews}</span>
        </div>
      </div>
    </article>
  );
}

function WhereSection() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(GRID_DESKS.length / GRID_PAGE_SIZE);
  // 페이지별로 4건씩 잘라 미리 트랙에 깔아둔다 — 화살표를 누르면 트랙이 가로로 밀린다.
  const pages = Array.from({ length: totalPages }, (_, p) =>
    GRID_DESKS.slice(p * GRID_PAGE_SIZE, (p + 1) * GRID_PAGE_SIZE),
  );
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3.5">
        <h2 className="px-5 text-[18px] font-bold text-desk-ink">어디서 일하세요?</h2>
        {/* 기본은 한 줄, 화살표를 누르면 아래로 펼쳐진다(wrap).
            시안의 탭 확장 버튼은 칩 줄 위에 얹힌 흰 원이라, 접힘 상태의 칩은
            버튼에 닿기 전 페이드로 사라진다(하드 컷 금지). */}
        <div className="relative px-5">
          <div
            className={`flex gap-1.5 ${
              expanded
                ? 'flex-wrap pr-10'
                : 'flex-nowrap overflow-hidden mask-[linear-gradient(to_right,#000_calc(100%-80px),transparent_calc(100%-28px))]'
            }`}
          >
            {REGIONS.map((r) => (
              <button key={r} type="button" onClick={() => setRegion(r)} className="shrink-0">
                <Chip label={r} active={region === r} />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label={expanded ? '지역 접기' : '지역 더보기'}
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="absolute right-5 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-desk-line bg-desk-surface text-desk-muted"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {/* 좌우 여백(px-5)은 트랙이 아니라 각 페이지가 들고 있어야 한다.
            overflow는 padding box 기준으로 잘리기 때문에, 바깥에 px-5를 주면
            넘어가는 페이지가 여백 위로 비쳐 보인다. */}
        <div className="overflow-hidden">
          <div
            className="flex"
            style={{ transform: `translateX(-${(page - 1) * 100}%)`, transition: SLIDE_TRANSITION }}
          >
            {pages.map((items, i) => (
              <div key={i} className="w-full shrink-0 px-5" aria-hidden={i !== page - 1}>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((it) => (
                    <WhereGridCard key={it.name} item={it} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="이전"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="flex h-8 w-10 items-center justify-center rounded-lg border border-desk-line text-desk-body disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1 text-[13px] font-semibold">
          <span className="w-7 text-center text-desk-body">{String(page).padStart(2, '0')}</span>
          <span className="text-desk-line">/</span>
          <span className="w-7 text-center text-desk-line">{String(totalPages).padStart(2, '0')}</span>
        </div>
        <button
          type="button"
          aria-label="다음"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="flex h-8 w-10 items-center justify-center rounded-lg border border-desk-line text-desk-body disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

/** 프로모 배너 슬라이드 — 1번은 피그마 시안, 2·3번은 플레이스홀더 문구(실제 문구 확정 시 교체) */
const PROMOS: { title: string; subtitle: string }[] = [
  { title: '첫 달 50% 할인 진행 중', subtitle: '지금 가입하면 모든 데스크 BASIC 첫 달 반값' },
  { title: '친구 초대하고 1만원 적립', subtitle: '초대 코드를 공유하면 둘 다 적립금 지급' },
  { title: '주말 종일권 특가', subtitle: '토·일 이용 시 시간당 30% 추가 할인' },
];

function PromoBanner() {
  return (
    <section className="px-5">
      <AutoCarousel
        count={PROMOS.length}
        className="h-[120px] rounded-xl bg-desk-accent"
        indicatorClassName="bottom-2.5 right-2.5"
      >
        {(i) => {
          const p = PROMOS[i];
          return (
            <div className="relative flex h-full w-full flex-col px-5 pt-5">
              {/* 장식용 원 */}
              <span className="pointer-events-none absolute -right-6 -top-8 h-[130px] w-[130px] rounded-full bg-desk-surface/10" aria-hidden />
              <span className="pointer-events-none absolute -bottom-12 right-10 h-[130px] w-[130px] rounded-full bg-desk-surface/10" aria-hidden />
              <div className="relative flex flex-col gap-1">
                <h2 className="text-[18px] font-bold text-desk-on-dark">{p.title}</h2>
                <p className="text-[12px] font-medium tracking-[-0.24px] text-desk-on-dark">{p.subtitle}</p>
              </div>
            </div>
          );
        }}
      </AutoCarousel>
    </section>
  );
}

const ARTICLE_COPIES = 3; // 앞/가운데/뒤 — 좌우 이웃이 항상 채워지는 최소 벌 수
const DRAG_THRESHOLD = 40; // 이만큼 끌어야 넘어간다(px). 미만이면 제자리 복귀
const SLIDE_TRANSITION = 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * "한 번 끌면 딱 1장" 드래그 공통 로직 — 아티클/데스크 캐러셀이 같은 손맛을 갖도록 공유한다.
 * 방향(dir)만 알려주고 인덱스 해석(무한 순환이냐 양끝 고정이냐)은 호출측이 정한다.
 *
 * `offset`을 1칸(step)으로 제한하는 게 핵심이다. 판정만 1장으로 막으면 길게 끌 때
 * 트랙이 손을 따라 멀리 갔다가 1칸만 남기고 되돌아와 튕긴다.
 */
function useOneStepDrag(step: number, onStep: (dir: -1 | 1) => void, onGrab?: () => void) {
  const [drag, setDrag] = useState(0);
  const [animate, setAnimate] = useState(false); // 첫 렌더는 애니메이션 없이 제자리에
  const dragging = useRef(false);
  const startX = useRef(0);

  const end = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const dir = drag <= -DRAG_THRESHOLD ? 1 : drag >= DRAG_THRESHOLD ? -1 : 0;
    setAnimate(true);
    setDrag(0);
    if (dir !== 0) onStep(dir);
  };

  return {
    offset: step ? Math.sign(drag) * Math.min(Math.abs(drag), step) : 0,
    transition: animate ? SLIDE_TRANSITION : 'none',
    handlers: {
      onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
        dragging.current = true;
        startX.current = e.clientX;
        setAnimate(false);
        onGrab?.();
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragging.current) setDrag(e.clientX - startX.current);
      },
      onPointerUp: end,
      onPointerCancel: end,
    },
  };
}

/**
 * 아티클 캐러셀 — 센터 모드 + 무한 순환. 자동 이동/확대 효과는 없다.
 * 한 번 끌면 아무리 길게 끌어도 딱 1장만 넘어간다(드래그 오프셋도 1칸으로 제한).
 *
 * 네이티브 스크롤 대신 translateX로 직접 움직인다 — 스크롤 관성/스냅이 JS 정렬과
 * 서로 밀어내며 생기던 떨림을 없애고, 1장 제한도 스크롤로는 강제할 수 없기 때문이다.
 */
function ArticleSlides() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const N = ARTICLES.length;
  const slides = Array.from({ length: ARTICLE_COPIES }, () => ARTICLES).flat();

  const [index, setIndex] = useState(N); // 가운데 벌의 첫 카드에서 시작
  const [metrics, setMetrics] = useState({ step: 0, center: 0 });

  // 카드 폭·간격·뷰포트 폭은 CSS와 창 크기가 정하므로 DOM에서 실측한다.
  // window resize가 아니라 뷰포트 자체를 관찰한다 — 세로 스크롤바가 생겼다 사라지면
  // 창 크기는 그대로인데 뷰포트 폭만 바뀌어 resize 이벤트가 오지 않는다.
  useLayoutEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => {
      const first = trackRef.current?.children[0] as HTMLElement | undefined;
      const second = trackRef.current?.children[1] as HTMLElement | undefined;
      if (!first || !second) return;
      const rect = first.getBoundingClientRect(); // offsetLeft/clientWidth와 달리 소수점까지 잡힌다
      setMetrics({
        step: second.getBoundingClientRect().left - rect.left, // 카드 폭 + 간격
        center: (vp.clientWidth - rect.width) / 2, // 카드를 가운데 두는 여백
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, []);

  const { offset, transition, handlers } = useOneStepDrag(
    metrics.step,
    (dir) => setIndex((i) => i + dir), // 끝이 없으므로 그냥 더한다 — 복귀는 아래 onGrab에서
    // 무한 순환 복귀는 잡는 순간에 한다. 이동이 끝난 뒤(transitionend)에 하면 드래그를
    // 정확히 1칸 채웠을 때 transform이 그대로라 이벤트가 안 와서 복귀를 놓친다.
    () => setIndex((i) => N + (((i - N) % N) + N) % N), // 내용이 같은 가운데 벌 → 눈에 안 보임
  );

  const x = metrics.center - index * metrics.step + offset;

  return (
    <section>
      <div ref={viewportRef} className="overflow-hidden">
        <div
          ref={trackRef}
          {...handlers}
          className="flex touch-pan-y cursor-grab gap-3 select-none active:cursor-grabbing"
          style={{ transform: `translate3d(${x}px, 0, 0)`, transition }}
        >
          {slides.map((a, i) => (
            <article
              key={i}
              className="relative flex h-[330px] w-60 shrink-0 flex-col justify-start overflow-hidden rounded-xl bg-desk-ink p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-desk-ink/60" aria-hidden />
              <div className="relative flex flex-col gap-2">
                <h3 className="whitespace-pre-line text-[22px] font-bold leading-[1.25] text-desk-on-dark">{a.title}</h3>
                <p className="text-[12px] text-desk-on-dark/85">{a.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 푸터 — 접힘이 기본이고 화살표를 누르면 사업자 정보가 펼쳐진다.
 * 접힘(시안 "Main")에는 상호+화살표와 링크 줄만 남고, 펼침이 "Main_on" 상태다.
 * 높이 애니메이션은 grid-rows 0fr→1fr로 준다 — 내용 높이를 JS로 재지 않아도 전환이 걸린다.
 */
function Footer() {
  const [open, setOpen] = useState(false);
  return (
    <footer className="flex flex-col gap-3.5 px-5 pb-10 pt-12">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-fit items-center gap-1"
      >
        <span className="text-[13px] font-bold text-desk-ink">공유데스크</span>
        <ChevronDown className={`h-4.5 w-4.5 text-desk-ink transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          {/* pb-1.5는 접히면 같이 사라지는 여백 — 펼침일 때만 링크 줄과 20px(footer gap 14 + 6)이 된다 */}
          <div className="flex flex-col gap-0.5 pb-1.5 text-[11px] text-desk-soft">
            <span>대표 : 이용현</span>
            <span>주소 : 서울 강남구 봉은사로37길 5, 4층</span>
            <span className="flex gap-1">
              사업자 등록번호 : 584-88-02580
              <span className="text-desk-ink underline">사업자정보확인</span>
            </span>
            <span>통신판매업 신고번호 : 준비중</span>
            <span>고객센터 : 1522-2038 · support@sharedesk.co.kr</span>
          </div>
        </div>
      </div>
      <nav className="flex items-center gap-2 text-[11px] text-desk-soft">
        <span>회사소개</span>
        <span className="h-2.5 w-px bg-desk-line" />
        <span>이용약관</span>
        <span className="h-2.5 w-px bg-desk-line" />
        <span className="font-bold text-desk-ink underline">개인정보 처리방침</span>
        <span className="h-2.5 w-px bg-desk-line" />
        <span>고객지원</span>
      </nav>
    </footer>
  );
}

function BottomNav() {
  const tabs = [
    { label: '홈', icon: HomeIcon },
    { label: '검색', icon: SearchIcon },
    { label: '이용 내역', icon: CalendarIcon },
    { label: '마이페이지', icon: UserIcon },
  ];
  const [active, setActive] = useState('홈');
  return (
    // 프레임 하단에 고정되어 스크롤을 따라다닌다(sticky → 420px 프레임 폭에 자동으로 맞음).
    <div className="sticky bottom-0 z-20 bg-desk-surface">
      <nav className="flex items-center justify-around py-2">
        {tabs.map(({ label, icon: Icon }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActive(label)}
              aria-pressed={isActive}
              className={`flex w-[68px] flex-col items-center gap-1.5 py-1 ${isActive ? 'text-desk-accent' : 'text-desk-body'}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ── 페이지 ─────────────────────────────────────────────────────────────
export default function DeskHomePage() {
  return (
    <div className="min-h-screen bg-muted-foreground/10">
      <div className="mx-auto flex w-full max-w-[420px] flex-col bg-desk-surface">
        <Header />
        <div className="flex flex-col gap-10 pt-2">
          <MainBanner />
          <DeskCarousel title="지금 인기 데스크" items={POPULAR_DESKS} />
          <DeskCarousel title="회원님을 위한 맞춤 추천" items={RECOMMENDED_DESKS} />
          {/* 공데AI 버튼은 위 맞춤추천 카루셀에 붙여 24px 간격(원본 시안) — gap-10(40px)에서 16px 상쇄 */}
          <div className="-mt-4">
            <AiCta />
          </div>
          <NewDesksSection />
          <PromoBanner />
          <WhereSection />
          <ArticleSlides />
        </div>
        <Footer />
        <BottomNav />
      </div>
    </div>
  );
}
