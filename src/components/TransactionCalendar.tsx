import MonthNavigator from './MonthNavigator';
import { useMonthlyCalendar } from '../hooks/useMonthlyCalendar';
import { firstWeekday, monthDays, todayISO } from '../utils/dateRange';

interface Props {
  month: string; // 'YYYY-MM'
  onChange: (month: string) => void;
  /** 선택된 날짜 'YYYY-MM-DD' (없으면 미선택) */
  selectedDate?: string | null;
  /** 날짜 클릭 시 호출. 같은 날짜를 다시 누르면 선택 해제(null). */
  onSelectDate?: (iso: string | null) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 요일 인덱스(0=일 ~ 6=토)에 따른 텍스트 색 클래스. 주말만 강조. */
function weekdayColor(col: number): string {
  if (col === 0) return 'text-weekend-sun';
  if (col === 6) return 'text-weekend-sat';
  return 'text-foreground';
}

/**
 * 섹션 2 — 거래 캘린더.
 * 날짜 아래에 그 날 거래 종류별 dot을 찍는다(지출=expense, 수입=income).
 */
export default function TransactionCalendar({
  month,
  onChange,
  selectedDate,
  onSelectDate,
}: Props) {
  const marks = useMonthlyCalendar(month);
  const days = monthDays(month);
  const leading = firstWeekday(month); // 1일 앞의 빈 칸 수
  const today = todayISO();

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <MonthNavigator month={month} onChange={onChange} />

      <div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-sm">
        {WEEKDAYS.map((w, col) => (
          <div key={w} className={`pb-1 font-medium ${weekdayColor(col)}`}>
            {w}
          </div>
        ))}

        {/* 1일 앞 빈 칸 */}
        {Array.from({ length: leading }, (_, i) => (
          <div key={`blank-${i}`} aria-hidden="true" />
        ))}

        {days.map((iso, idx) => {
          const col = (leading + idx) % 7;
          const dayNum = Number(iso.slice(8, 10));
          const isToday = iso === today;
          const isSelected = iso === selectedDate;
          const mark = marks.get(iso);

          // 선택됨: 채운 primary / 오늘(미선택): 옅은 primary 배경
          const dayClass = isSelected
            ? 'bg-primary text-primary-foreground font-bold'
            : `${isToday ? 'bg-primary/15 font-bold' : ''} ${weekdayColor(col)}`;

          return (
            <button
              key={iso}
              type="button"
              // 같은 날짜를 다시 누르면 선택 해제
              onClick={() => onSelectDate?.(isSelected ? null : iso)}
              aria-pressed={isSelected}
              aria-label={`${dayNum}일`}
              className="flex flex-col items-center gap-1 rounded-lg py-0.5 transition hover:bg-muted/60"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${dayClass}`}
              >
                {dayNum}
              </span>
              <span className="flex h-1.5 items-center gap-0.5">
                {mark?.hasExpense && (
                  <span className="h-1.5 w-1.5 rounded-full bg-expense" aria-hidden="true" />
                )}
                {mark?.hasIncome && (
                  <span className="h-1.5 w-1.5 rounded-full bg-income" aria-hidden="true" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
