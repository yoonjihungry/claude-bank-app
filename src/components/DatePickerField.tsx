'use client';

// 네이티브 <input type="date">의 브라우저 기본 달력 대신 쓰는 커스텀 날짜 선택기.
// 트리거 버튼을 누르면 바텀시트가 올라오고(LoginSheet와 같은 시트 패턴),
// 안에는 대시보드 캘린더(TransactionCalendar)와 같은 스타일의 달력을 그린다.
// 날짜를 고른 뒤 '완료'를 눌러야 확정된다('취소'·스크림·Esc는 되돌림).
import { useEffect, useState } from 'react';
import MonthNavigator from './MonthNavigator';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { firstWeekday, monthDays, todayISO } from '../utils/dateRange';

interface Props {
  /** 선택된 날짜 ISO 'YYYY-MM-DD' */
  value: string;
  onChange: (iso: string) => void;
  /** 트리거 버튼에 입힐 클래스(폼의 input 스타일을 그대로 넘긴다) */
  className?: string;
  id?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 요일 인덱스(0=일 ~ 6=토)에 따른 텍스트 색. 주말만 강조 — TransactionCalendar와 동일 규칙. */
function weekdayColor(col: number): string {
  if (col === 0) return 'text-weekend-sun';
  if (col === 6) return 'text-weekend-sat';
  return 'text-foreground';
}

/** 시트가 열린 동안만 마운트돼 뒤 배경 스크롤을 잠근다(닫히면 언마운트되며 복원). */
function ScrollLock() {
  useBodyScrollLock();
  return null;
}

export default function DatePickerField({ value, onChange, className, id }: Props) {
  const [open, setOpen] = useState(false);
  // 시트에서 보고 있는 달 / 임시로 고른 날짜(완료를 눌러야 value로 확정).
  const [viewMonth, setViewMonth] = useState(value.slice(0, 7));
  const [draft, setDraft] = useState(value);

  const close = () => setOpen(false);

  // 열 때마다 현재 값 기준으로 초기화한다.
  function openSheet() {
    setDraft(value);
    setViewMonth(value.slice(0, 7));
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
    const today = todayISO();
    setViewMonth(today.slice(0, 7));
    setDraft(today);
  }

  function confirm() {
    onChange(draft);
    close();
  }

  const days = monthDays(viewMonth);
  const leading = firstWeekday(viewMonth); // 1일 앞의 빈 칸 수
  const today = todayISO();

  return (
    <>
      {/* 트리거 — 네이티브 date 대신 커스텀 시트를 연다 */}
      <button
        type="button"
        id={id}
        onClick={openSheet}
        className={`flex items-center justify-between text-left ${className ?? ''}`}
      >
        <span>{value}</span>
        <svg
          width="18"
          height="18"
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

      {/* 바텀시트 — 항상 마운트하고 open으로 슬라이드(닫힐 때 애니메이션 유지) */}
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

        {/* 시트 — 앱 콘텐츠 폭과 동일하게 중앙 정렬 */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="날짜 선택"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px] rounded-t-[22px] border border-border bg-card px-5 pt-2.5 transition-transform duration-300 ease-out md:max-w-[600px] ${
            open
              ? 'translate-y-0 shadow-[0_-10px_40px_-12px_hsl(222_47%_20%/0.3)]'
              : 'translate-y-full'
          }`}
        >
          {/* 그립 핸들 */}
          <div className="mx-auto mb-3 h-1 w-[38px] rounded-full bg-input" />

          {/* 헤더: 제목(왼쪽) · 오늘(오른쪽) */}
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-sm font-bold text-foreground">날짜 선택</span>
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
              오늘
            </button>
          </div>

          {/* 월 이동 */}
          <MonthNavigator month={viewMonth} onChange={setViewMonth} />

          {/* 달력 그리드 */}
          <div className="mt-4 grid grid-cols-7 gap-y-1 text-center text-sm">
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
              const isSelected = iso === draft;

              // 선택됨: 채운 primary / 오늘(미선택): 옅은 primary 배경
              const dayClass = isSelected
                ? 'bg-primary text-primary-foreground font-bold'
                : `${isToday ? 'bg-primary/15 font-bold' : ''} ${weekdayColor(col)}`;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setDraft(iso)}
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
