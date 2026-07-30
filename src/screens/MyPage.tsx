'use client';

// 마이페이지 — 계정 카드 + 통계(월 요약·핵심 지표·최근 추세·카테고리·결제수단·일자별).
// 집계는 useStatistics / useMonthlyTrend 훅에, 시각화는 차트 컴포넌트에 맡기고 여기서는 조립만 한다.
// 일자별 추이는 한 달 전체를 한 번에 그리면 점·라벨이 겹쳐 주차 칩으로 구간을 좁힌다(7일 블록).
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import CategoryChart from '../components/CategoryChart';
import DailyTrendChart from '../components/DailyTrendChart';
import MonthNavigator from '../components/MonthNavigator';
import MonthlyTrendChart from '../components/MonthlyTrendChart';
import PaymentMethodBar from '../components/PaymentMethodBar';
import ProfileCard from '../components/ProfileCard';
import { useMonthlyTrend } from '../hooks/useMonthlyTrend';
import { useStatistics } from '../hooks/useStatistics';
import { currentMonth, monthDays, todayISO } from '../utils/dateRange';
import { formatSignedWon, formatWon } from '../utils/format';

type CatKind = 'expense' | 'income';

/** 그 달을 7일 블록(0-base)으로 나눴을 때 day(1~31)가 속한 블록. */
function weekBlock(day: number): number {
  return Math.floor((day - 1) / 7);
}

/** 선택 월에서 기본으로 열 주 — 현재 월이면 오늘 속한 주, 아니면 '전체'. */
function defaultWeek(month: string): number | 'all' {
  if (month !== currentMonth()) return 'all';
  return weekBlock(Number(todayISO().slice(8, 10)));
}

/** 요약 한 줄(왼쪽 제목·전월 대비 / 오른쪽 금액).
    큰 금액이 좁은 칸에서 줄바꿈으로 깨지지 않도록 3열 그리드 대신 세로 리스트로 둔다. */
function SummaryRow({
  label,
  amount,
  delta,
}: {
  label: string;
  amount: number;
  delta: number;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          전월 대비 {formatSignedWon(delta)}
        </p>
      </div>
      <span className="text-base font-bold text-ink">{formatWon(amount)}</span>
    </div>
  );
}

/** 핵심 지표 한 칸(제목·값). */
function MetricCell({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: 'income' | 'expense' | 'foreground' | 'accent';
}) {
  const valueColor =
    tone === 'accent'
      ? 'text-primary'
      : tone === 'income'
        ? 'text-income'
        : tone === 'expense'
          ? 'text-expense'
          : 'text-foreground';

  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-card px-4 py-3 shadow-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-lg font-bold tabular-nums ${valueColor}`}>{value}</span>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

/** 작은 세그먼트 토글 버튼(주차·지출/수입 공용). */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 text-[13px] font-semibold transition ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'border border-input text-muted-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

export default function MyPage() {
  const [month, setMonth] = useState(currentMonth());
  const stats = useStatistics(month);
  const trend = useMonthlyTrend(month, 6);

  // 카테고리 차트에서 볼 종류(지출/수입).
  const [catKind, setCatKind] = useState<CatKind>('expense');
  const catData = catKind === 'income' ? stats.incomeByCategory : stats.expenseByCategory;

  // 일자별 추이에서 한 번에 볼 주(週). 월을 바꾸면 그 달 기준으로 다시 잡는다.
  const [week, setWeek] = useState<number | 'all'>(() => defaultWeek(month));
  useEffect(() => {
    setWeek(defaultWeek(month));
  }, [month]);

  const daysInMonth = monthDays(month).length;
  const weekCount = Math.ceil(daysInMonth / 7);

  const dailyData =
    week === 'all'
      ? stats.dailyTrend
      : stats.dailyTrend.filter((p) => weekBlock(Number(p.date.slice(8, 10))) === week);

  // 선택 주의 날짜 범위 캡션(전체면 없음).
  const weekRange =
    week === 'all'
      ? null
      : (() => {
          const mm = Number(month.slice(5, 7));
          const start = week * 7 + 1;
          const end = Math.min(start + 6, daysInMonth);
          return `${mm}/${start} ~ ${mm}/${end}`;
        })();

  const savingsText =
    stats.totalIncome > 0 ? `${Math.round(stats.savingsRate * 100)}%` : '—';

  return (
    <div className="flex flex-col gap-6">
      {/* 계정 카드 */}
      <ProfileCard />

      <MonthNavigator month={month} onChange={setMonth} />

      {/* 이번 달 요약 + 전월 대비 — 세로 리스트(항목 사이 구분선) */}
      <section className="flex flex-col divide-y divide-border rounded-2xl bg-muted px-4.5 py-1.5">
        <SummaryRow label="수입" amount={trend.current.income} delta={trend.delta.income} />
        <SummaryRow label="지출" amount={trend.current.expense} delta={trend.delta.expense} />
        <SummaryRow label="잔액" amount={trend.current.net} delta={trend.delta.net} />
      </section>

      {/* 핵심 지표 — 저축률 · 하루 평균 지출 */}
      <section className="grid grid-cols-2 gap-3">
        <MetricCell label="저축률" value={savingsText} hint="잔액 ÷ 수입" tone="accent" />
        <MetricCell
          label="하루 평균 지출"
          value={formatWon(stats.avgDailyExpense)}
          hint={month === currentMonth() ? '오늘까지' : '이 달 전체'}
          tone="expense"
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-extrabold tracking-tight text-ink">최근 6개월 수입·지출</h2>
        <MonthlyTrendChart data={trend.months} />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">카테고리별 {catKind === 'income' ? '수입' : '지출'}</h2>
          <div className="flex gap-1.5">
            <Chip active={catKind === 'expense'} onClick={() => setCatKind('expense')}>
              지출
            </Chip>
            <Chip active={catKind === 'income'} onClick={() => setCatKind('income')}>
              수입
            </Chip>
          </div>
        </div>
        <CategoryChart data={catData} kind={catKind} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-extrabold tracking-tight text-ink">결제수단별 지출</h2>
        <PaymentMethodBar data={stats.expenseByMethod} />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">일자별 수입·지출 추이</h2>
          {weekRange && <span className="text-xs text-muted-foreground">{weekRange}</span>}
        </div>

        {/* 보는 구간(주차) 선택 — 한 달 전체를 한 번에 그리면 점이 겹쳐 좁혀 본다 */}
        <div className="flex flex-wrap gap-1.5">
          <Chip active={week === 'all'} onClick={() => setWeek('all')}>
            전체
          </Chip>
          {Array.from({ length: weekCount }, (_, i) => (
            <Chip key={i} active={week === i} onClick={() => setWeek(i)}>
              {i + 1}주
            </Chip>
          ))}
        </div>

        {dailyData.length > 0 ? (
          <DailyTrendChart data={dailyData} lineOnly />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-input text-sm text-muted-foreground">
            이 주는 거래가 없어요.
          </div>
        )}
      </section>
    </div>
  );
}
