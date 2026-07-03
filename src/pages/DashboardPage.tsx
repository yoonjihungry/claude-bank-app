import { useState } from 'react';
import MonthlySpendingCard from '../components/MonthlySpendingCard';
import SelectedDayPanel from '../components/SelectedDayPanel';
import TodaySpendingCard from '../components/TodaySpendingCard';
import TransactionCalendar from '../components/TransactionCalendar';
import { useStatistics } from '../hooks/useStatistics';
import { currentMonth } from '../utils/dateRange';

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const stats = useStatistics(month);

  // 월을 바꾸면 다른 달의 선택은 해제한다.
  function handleMonthChange(next: string) {
    setMonth(next);
    setSelectedDate(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 섹션 1 — 오늘의 소비 (항상 실제 오늘 기준) */}
      <TodaySpendingCard />

      {/* 섹션 2 — 거래 캘린더 (선택 월) */}
      <TransactionCalendar
        month={month}
        onChange={handleMonthChange}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* 날짜 선택 시 그 날의 내역 */}
      {selectedDate && (
        <SelectedDayPanel date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}

      {/* 섹션 3 — 이번달 소비금액 (선택 월) */}
      <MonthlySpendingCard expense={stats.totalExpense} />
    </div>
  );
}
