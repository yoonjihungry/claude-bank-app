'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

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
}

const POPULAR_DESKS: DeskItem[] = [
  { name: '코워크라운지 성수점', desks: '데스크 5', area: '성수', address: '서울 송파구 올림픽로 269', price: '265,000', top: true },
  { name: '더데스크 강남점', desks: '데스크 8', area: '강남', address: '서울 강남구 테헤란로 152', price: '320,000', top: true },
  { name: '스페이스원 판교점', desks: '데스크 3', area: '판교', address: '경기 성남시 분당구 판교역로 235', price: '198,000' },
];

const RECOMMENDED_DESKS: DeskItem[] = [
  { name: '리모트하우스 역삼', desks: '데스크 6', area: '역삼', address: '서울 강남구 논현로 430', price: '245,000', top: true },
  { name: '노마드플레이스 홍대', desks: '데스크 4', area: '홍대', address: '서울 마포구 양화로 45', price: '175,000' },
  { name: '포커스룸 여의도', desks: '데스크 10', area: '여의도', address: '서울 영등포구 국제금융로 10', price: '410,000' },
];

interface GridItem {
  name: string;
  likes: string;
  reviews: string;
  liked?: boolean;
}

const GRID_DESKS: GridItem[] = [
  { name: '위코워킹 강남점', likes: '1,200', reviews: '20', liked: true },
  { name: '오피스버드 역삼점', likes: '200', reviews: '5' },
  { name: '패스트파이브 서초점', likes: '1,846', reviews: '135' },
  { name: '허브스페이스 잠실점', likes: '16', reviews: '12' },
];

const REGIONS = ['전체', '강남', '판교', '여의도', '성수', '홍대', '종로', '마포', '강서'];
const POPULAR_REGIONS = ['강남', '여의도', '판교'];

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
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M6 9a6 6 0 0 1 12 0c0 3.5 1 5 1.5 5.5H4.5C5 14 6 12.5 6 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="18" cy="6" r="2.5" fill="hsl(var(--desk-accent))" />
  </svg>
);
const SparkleIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 12 12" fill="currentColor" className={className} aria-hidden>
    <path d="M6 0c.3 2.7 1.3 3.7 4 4-2.7.3-3.7 1.3-4 4-.3-2.7-1.3-3.7-4-4 2.7-.3 3.7-1.3 4-4Z" />
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
const HeartIcon = ({ className, filled }: IconProps & { filled?: boolean }) => (
  <svg viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} className={className} aria-hidden>
    <path d="M8 13.5S2 10 2 5.9A3.4 3.4 0 0 1 8 4a3.4 3.4 0 0 1 6 1.9C14 10 8 13.5 8 13.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
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
    <header className="flex h-[60px] items-center justify-end bg-desk-surface px-5">
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
        className="h-[320px] rounded-[20px] bg-desk-ink"
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

function SearchSection() {
  const [query, setQuery] = useState('');
  return (
    <section className="flex flex-col gap-3.5 px-5">
      <h2 className="text-[18px] font-bold text-desk-ink">공데 이용하기</h2>
      <div className="flex h-[52px] items-center justify-between rounded-[10px] border border-desk-line px-4 focus-within:border-desk-primary">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="지역과 예산, 인원을 검색해주세요"
          className="w-full bg-transparent text-[14px] text-desk-ink outline-none placeholder:text-desk-hint"
        />
        <SearchIcon className="h-5 w-5 shrink-0 text-desk-hint" />
      </div>
      <div className="flex items-center gap-2.5 px-1">
        <span className="shrink-0 text-[12px] font-medium text-desk-accent">인기 지역</span>
        <div className="flex gap-1.5">
          {POPULAR_REGIONS.map((r) => (
            <button key={r} type="button" onClick={() => setQuery(r)}>
              <Chip label={r} active={query === r} />
            </button>
          ))}
        </div>
      </div>
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

function DeskCarousel({ title, items }: { title: string; items: DeskItem[] }) {
  return (
    <section className="flex flex-col gap-3.5">
      <h2 className="px-5 text-[18px] font-bold text-desk-ink">{title}</h2>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it) => (
          <DeskCard key={it.name} item={it} />
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
        <SparkleIcon className="h-3 w-3 text-desk-primary" />
        <span>공데AI 맞춤 추천 더보기</span>
        <ChevronRight className="h-3.5 w-3.5 text-desk-primary" />
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
          className={`absolute right-2 top-2 ${liked ? 'text-desk-accent' : 'text-desk-on-dark'}`}
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
  const totalPages = 3;
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3.5">
        <h2 className="px-5 text-[18px] font-bold text-desk-ink">어디서 일하세요?</h2>
        <div className="flex items-start gap-2 px-5">
          {/* 기본은 한 줄(넘치면 잘림), 화살표를 누르면 아래로 펼쳐진다(wrap) */}
          <div className={`flex flex-1 gap-1.5 ${expanded ? 'flex-wrap' : 'flex-nowrap overflow-hidden'}`}>
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-desk-line text-desk-muted"
          >
            <ChevronRight className={`h-4 w-4 ${expanded ? '-rotate-90' : 'rotate-90'}`} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5">
          {GRID_DESKS.map((it) => (
            <WhereGridCard key={it.name} item={it} />
          ))}
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

function ArticleSlides() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const N = ARTICLES.length;
  const slides = Array.from({ length: 5 }, () => ARTICLES).flat(); // 5벌 복제 → 긴 드래그에도 여유 버퍼

  // 스와이퍼 센터 모드 + 무한 루프(자동 이동 없음).
  // 가운데(3번째) 벌 첫 카드를 중앙에 두고 시작하고, 스크롤이 "멈춘 뒤"에만
  // 같은 내용의 가운데 벌로 순간 이동해 이음매 없이 끝없이 순환한다.
  useEffect(() => {
    const el = scrollerRef.current;
    const first = el?.children[0] as HTMLElement | undefined;
    const second = el?.children[1] as HTMLElement | undefined;
    const midCard = el?.children[2 * N] as HTMLElement | undefined; // 5벌 중 가운데 벌 시작
    if (!el || !first || !second || !midCard) return;

    const step = second.offsetLeft - first.offsetLeft; // 카드 폭 + 간격
    const copyW = step * N; // 한 벌 너비
    const base = midCard.offsetLeft - (el.clientWidth - midCard.clientWidth) / 2; // 가운데 벌 첫 카드 중앙
    el.scrollLeft = base;

    // CSS snap-mandatory는 드래그 "도중"에도 계속 카드를 강제로 끌어당겨 화면이 떨린다.
    // 그래서 CSS snap을 쓰지 않고, 스크롤이 멈춘(idle) 뒤에만 JS로 처리한다:
    //   1) 가운데 벌로 순간 복귀(내용 동일 → 안 보임) 2) 가장 가까운 카드로 부드럽게 정렬
    let idle: ReturnType<typeof setTimeout>;
    const settle = () => {
      const shift = Math.round((el.scrollLeft - base) / copyW) * copyW;
      if (shift !== 0) el.scrollLeft -= shift; // 무한 루프 복귀(seamless)
      const nearest = base + Math.round((el.scrollLeft - base) / step) * step;
      if (Math.abs(nearest - el.scrollLeft) > 1) el.scrollTo({ left: nearest, behavior: 'smooth' });
    };
    const onScroll = () => {
      clearTimeout(idle);
      idle = setTimeout(settle, 120); // 움직이는 동안엔 절대 건드리지 않음
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearTimeout(idle);
    };
  }, [N]);

  return (
    <section>
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto px-15 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
    </section>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col gap-3.5 px-5 pb-10 pt-12">
      <div className="flex items-center gap-1">
        <span className="text-[13px] font-bold text-desk-ink">공유데스크</span>
        <ChevronRight className="h-4 w-4 text-desk-ink" />
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-0.5 text-[11px] text-desk-soft">
          <span>대표 : 이용현</span>
          <span>주소 : 서울 강남구 봉은사로37길 5, 4층</span>
          <span className="flex gap-1">
            사업자 등록번호 : 584-88-02580
            <span className="text-desk-ink underline">사업자정보확인</span>
          </span>
          <span>통신판매업 신고번호 : 준비중</span>
          <span>고객센터 : 1522-2038 · support@sharedesk.co.kr</span>
        </div>
        <nav className="flex items-center gap-2 text-[11px] text-desk-soft">
          <span>회사소개</span>
          <span className="h-2.5 w-px bg-desk-line" />
          <span>이용약관</span>
          <span className="h-2.5 w-px bg-desk-line" />
          <span className="font-bold text-desk-ink">개인정보 처리방침</span>
          <span className="h-2.5 w-px bg-desk-line" />
          <span>고객지원</span>
        </nav>
      </div>
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
          <SearchSection />
          <DeskCarousel title="지금 인기 데스크" items={POPULAR_DESKS} />
          <DeskCarousel title="회원님을 위한 맞춤 추천" items={RECOMMENDED_DESKS} />
          {/* 공데AI 버튼은 위 맞춤추천 카루셀에 붙여 24px 간격(원본 시안) — gap-10(40px)에서 16px 상쇄 */}
          <div className="-mt-4">
            <AiCta />
          </div>
          <WhereSection />
          <PromoBanner />
          <ArticleSlides />
        </div>
        <Footer />
        <BottomNav />
      </div>
    </div>
  );
}
