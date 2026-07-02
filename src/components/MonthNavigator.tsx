import { shiftMonth } from '../utils/dateRange';
import { formatMonthLabel } from '../utils/format';

interface Props {
  month: string; // 'YYYY-MM'
  onChange: (month: string) => void;
}

export default function MonthNavigator({ month, onChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="이전 달"
        className="rounded-md border border-gray-300 px-3 py-1 text-gray-600 transition hover:bg-gray-100"
      >
        ‹
      </button>
      <span className="min-w-32 text-center text-lg font-semibold text-gray-800">
        {formatMonthLabel(month)}
      </span>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="다음 달"
        className="rounded-md border border-gray-300 px-3 py-1 text-gray-600 transition hover:bg-gray-100"
      >
        ›
      </button>
    </div>
  );
}
