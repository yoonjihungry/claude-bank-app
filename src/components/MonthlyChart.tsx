import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyPoint } from '../hooks/useStatistics';
import { formatCurrency } from '../utils/format';

interface Props {
  data: MonthlyPoint[];
}

/** 'YYYY-MM' → 'M월' (X축 라벨용) */
function monthTick(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

/** 축 라벨을 만원 단위로 축약 */
function amountTick(value: number): string {
  if (value === 0) return '0';
  return `${Math.round(value / 10000)}만`;
}

export default function MonthlyChart({ data }: Props) {
  return (
    <div className="h-64 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickFormatter={monthTick} fontSize={12} />
          <YAxis tickFormatter={amountTick} fontSize={12} width={40} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => monthTick(String(label))}
          />
          <Legend />
          <Bar dataKey="income" name="수입" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="지출" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
