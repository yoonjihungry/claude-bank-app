import Link from 'next/link';
import type { ReactNode } from 'react';
import type { CategorySlice } from '../hooks/useStatistics';
import { formatSignedWon } from '../utils/format';

interface Props {
  /** 이번 달 지출 합계 */
  expense: number;
  /** 이번 달 수입 합계 */
  income: number;
  /** 지난달 수입 대비 증감 */
  incomeDelta: number;
  /** 이번 달 카드 청구 예정 합계 */
  creditBilling: number;
  /** 지출 카테고리 상위(내림차순) — '소비' 줄의 보조 설명에 상위 2개를 쓴다 */
  topCategories: CategorySlice[];
}

/** 숫자 + 작은 '원' */
function Won({ value }: { value: number }) {
  return (
    <>
      {value.toLocaleString('ko-KR')}
      <span className="ml-0.5 text-[0.72em] font-semibold text-muted-foreground">원</span>
    </>
  );
}

/** 화살표(우상향=지출/나감, 우하향=수입/들어옴) */
function OutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]">
      <path d="M7 7h10v10M7 17 17 7" />
    </svg>
  );
}
function InIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]">
      <path d="M17 17H7V7M17 7 7 17" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[17px] w-[17px]">
      <rect x="3" y="6" width="18" height="13" rx="2.2" />
      <path d="M3 10.5h18" />
    </svg>
  );
}

/**
 * 이번 달 한눈에 — 소비·수입·카드 청구를 한 카드에 3줄로 요약한다.
 * 각 줄을 탭하면 상세 화면으로 이동한다(개별 큰 카드로 늘어놓지 않아 스크롤이 짧다).
 */
export default function MonthGlanceCard({
  expense,
  income,
  incomeDelta,
  creditBilling,
  topCategories,
}: Props) {
  const expenseSub =
    topCategories.length > 0
      ? topCategories
          .slice(0, 2)
          .map((c) => `${c.name} ${c.value.toLocaleString('ko-KR')}`)
          .join(' · ')
      : '이번 달 지출이 없어요';

  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-0.5 text-[15px] font-extrabold tracking-tight text-ink">이번 달 한눈에</h2>

      <div className="rounded-2xl bg-card px-4 shadow-sm">
        <Row
          href="/mypage"
          tint="bg-expense/10 text-expense"
          icon={<OutIcon />}
          label="소비"
          sub={expenseSub}
          amount={<Won value={expense} />}
        />
        <Row
          href="/mypage"
          tint="bg-income/10 text-income"
          icon={<InIcon />}
          label="수입"
          sub={`지난달 대비 ${formatSignedWon(incomeDelta)}`}
          amount={<Won value={income} />}
          amountClass="text-income"
        />
        <Row
          href="/transactions"
          tint="bg-credit/12 text-credit"
          icon={<CardIcon />}
          label="카드 청구 예정"
          sub="결제일에 빠져나가요"
          amount={<Won value={creditBilling} />}
        />
      </div>
    </section>
  );
}

function Row({
  href,
  tint,
  icon,
  label,
  sub,
  amount,
  amountClass = 'text-ink',
}: {
  href: string;
  tint: string;
  icon: ReactNode;
  label: string;
  sub: string;
  amount: ReactNode;
  amountClass?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-t border-border py-3.5 first:border-t-0"
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-foreground">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <span className={`font-extrabold tabular-nums ${amountClass}`}>{amount}</span>
      <span className="text-muted-foreground" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
