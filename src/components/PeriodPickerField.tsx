'use client';

// 내역 필터의 기간 선택기. 하나의 바텀시트 안에서 [월별]/[일별]을 토글해,
// 한 달 전체(month) 또는 특정 하루(date)를 고른다. DatePickerField와 같은 시트·색 톤.
// 고른 뒤 '완료'로 확정('취소'·스크림·Esc는 되돌림).
//
// 데이터 계층: 월별이면 { month } 만, 일별이면 { date } 와 그 달의 { month }를 함께 넘긴다
// (통계/차트가 filter.month를 보므로 일별에서도 그 달 기준이 유지된다).
import { useEffect, useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import {
  currentMonth,
  firstWeekday,
  monthDays,
  shiftMonth,
  todayISO,
} from '../utils/dateRange';
import { formatDate, formatMonthLabel } from '../utils/format';

type Mode = 'month' | 'day';

interface Props {
  /** 현재 필터의 월 'YYYY-MM'(없으면 미설정) */
  month?: string;
  /** 현재 필터의 특정 날짜 'YYYY-MM-DD'(있으면 일별) */
  date?: string;
  onChange: (next: { month?: string; date?: string }) => void;
  /** 트리거 버튼에 입힐 클래스(필터바의 control 스타일을 그대로 넘긴다) */
  className?: string;
  id?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 요일 인덱스(0=일 ~ 6=토)에 따른 텍스트 색. 주말만 강조. */
function weekdayColor(col: number): string {
  if (col === 0) return 'text-weekend-sun';
  if (col === 6) return 'text-weekend-sat';
  return 'text-foreground';
}

/** 시트가 열린 동안만 마운트돼 뒤 배경 스크롤을 잠근다. */
function ScrollLock() {
  useBodyScrollLock();
  return null;
}

export default function PeriodPickerField({
  month,
  date,
  onChange,
  className,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  // date가 있으면 일별로 연다.
  const [mode, setMode] = useState<Mode>(date ? 'day' : 'month');
  // 월별 그리드가 보는 연도 / 일별 달력이 보는 달('YYYY-MM').
  const [viewYear, setViewYear] = useState(() =>
    Number((month || currentMonth()).slice(0, 4)),
  );
  const [viewMonth, setViewMonth] = useState(() => date?.slice(0, 7) || month || currentMonth());
  // 임시 선택값(완료를 눌러야 확정).
  const [draftMonth, setDraftMonth] = useState(month || currentMonth());
  const [draftDay, setDraftDay] = useState(date || todayISO());

  const close = () => setOpen(false);

  function openSheet() {
    const m = month || currentMonth();
    const d = date || todayISO();
    setMode(date ? 'day' : 'month');
    setViewYear(Number(m.slice(0, 4)));
    setViewMonth(date?.slice(0, 7) || m);
    setDraftMonth(m);
    setDraftDay(d);
    setOpen(true);
  }

  // Esc로 닫기(취소와 동일 — 확정하지 않음)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function goToday() {
    if (mode === 'month') {
      const m = currentMonth();
      setViewYear(Number(m.slice(0, 4)));
      setDraftMonth(m);
    } else {
      const today = todayISO();
      setViewMonth(today.slice(0, 7));
      setDraftDay(today);
    }
  }

  function confirm() {
    if (mode === 'month') {
      onChange({ month: draftMonth, date: undefined });
    } else {
      onChange({ month: draftDay.slice(0, 7), date: draftDay });
    }
    close();
  }

  const thisMonth = currentMonth();
  const today = todayISO();
  const label = date
    ? formatDate(date)
    : month
      ? formatMonthLabel(month)
      : '전체 기간';

  // 일별 달력 계산
  const days = monthDays(viewMonth);
  const leading = firstWeekday(viewMonth);

  const segBase =
    'flex-1 rounded-[9px] py-2 text-sm font-semibold transition';

  return (
    <>
      {/* 트리거 — 네이티브 month 대신 커스텀 시트를 연다 */}
      <button
        type="button"
        id={id}
        onClick={openSheet}
        className={`flex items-center justify-between gap-2 text-left ${className ?? ''}`}
      >
        <span className={date || month ? '' : 'text-muted-foreground'}>{label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-muted-foreground"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {/* 바텀시트 — 항상 마운트하고 open으로 슬라이드 */}
      <div
        className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        {open && <ScrollLock />}

        {/* 스크림 — 바깥 클릭 시 취소하고 닫힘 */}
        <button
          type="button"
          aria-label="닫기"
          tabIndex={-1}
          onClick={close}
          className={`absolute inset-0 cursor-default bg-foreground/45 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* 시트 */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="기간 선택"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px] rounded-t-[22px] border border-border bg-card px-5 pt-2.5 shadow-[0_-10px_40px_-12px_hsl(222_47%_20%/0.3)] transition-transform duration-300 ease-out md:max-w-[600px] ${
            open ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* 그립 핸들 */}
          <div className="mx-auto mb-3 h-1 w-[38px] rounded-full bg-input" />

          {/* 헤더: 제목(왼쪽) · 오늘/이번 달 바로가기(오른쪽) */}
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-sm font-bold text-foreground">기간 선택</span>
            <button
              type="button"
              onClick={goToday}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[13px] font-semibold text-primary transition hover:bg-primary/20"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              {mode === 'month' ? '이번 달' : '오늘'}
            </button>
          </div>

          {/* 월별/일별 세그먼트 토글 */}
          <div className="mb-3.5 flex gap-1 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode('month')}
              aria-pressed={mode === 'month'}
              className={`${segBase} ${
                mode === 'month'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              월별
            </button>
            <button
              type="button"
              onClick={() => setMode('day')}
              aria-pressed={mode === 'day'}
              className={`${segBase} ${
                mode === 'day'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              일별
            </button>
          </div>

          {/* 이동 네비게이터 (월별=연도 / 일별=달) */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() =>
                mode === 'month'
                  ? setViewYear((y) => y - 1)
                  : setViewMonth((m) => shiftMonth(m, -1))
              }
              aria-label="이전"
              className="rounded-md border border-input px-3 py-1 text-muted-foreground transition hover:bg-muted"
            >
              ‹
            </button>
            <span className="min-w-32 text-center text-lg font-semibold text-foreground">
              {mode === 'month' ? `${viewYear}년` : formatMonthLabel(viewMonth)}
            </span>
            <button
              type="button"
              onClick={() =>
                mode === 'month'
                  ? setViewYear((y) => y + 1)
                  : setViewMonth((m) => shiftMonth(m, 1))
              }
              aria-label="다음"
              className="rounded-md border border-input px-3 py-1 text-muted-foreground transition hover:bg-muted"
            >
              ›
            </button>
          </div>

          {/* 월별: 12개월 그리드 */}
          {mode === 'month' && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, i) => {
                const m = `${viewYear}-${String(i + 1).padStart(2, '0')}`;
                const isSelected = m === draftMonth;
                const isCurrent = m === thisMonth;
                const cls = isSelected
                  ? 'bg-primary text-primary-foreground font-bold'
                  : `${isCurrent ? 'bg-primary/15 font-bold text-foreground' : 'text-foreground hover:bg-muted/60'}`;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDraftMonth(m)}
                    aria-pressed={isSelected}
                    className={`rounded-lg py-3 text-sm transition ${cls}`}
                  >
                    {i + 1}월
                  </button>
                );
              })}
            </div>
          )}

          {/* 일별: 날짜 달력 */}
          {mode === 'day' && (
            <div className="mt-4 grid grid-cols-7 gap-y-1 text-center text-sm">
              {WEEKDAYS.map((w, col) => (
                <div key={w} className={`pb-1 font-medium ${weekdayColor(col)}`}>
                  {w}
                </div>
              ))}

              {Array.from({ length: leading }, (_, i) => (
                <div key={`blank-${i}`} aria-hidden="true" />
              ))}

              {days.map((iso, idx) => {
                const col = (leading + idx) % 7;
                const dayNum = Number(iso.slice(8, 10));
                const isToday = iso === today;
                const isSelected = iso === draftDay;
                const dayClass = isSelected
                  ? 'bg-primary text-primary-foreground font-bold'
                  : `${isToday ? 'bg-primary/15 font-bold' : ''} ${weekdayColor(col)}`;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setDraftDay(iso)}
                    aria-pressed={isSelected}
                    aria-label={`${dayNum}일`}
                    className="flex items-center justify-center rounded-lg py-0.5 transition hover:bg-muted/60"
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${dayClass}`}
                    >
                      {dayNum}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 취소 · 완료 */}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-md border border-input py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted"
            >
              취소
            </button>
            <button
              type="button"
              onClick={confirm}
              className="flex-1 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              완료
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
