import { formatCurrency } from '../utils/format';

interface Props {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export default function SummaryCards({ totalIncome, totalExpense, balance }: Props) {
  const cards = [
    { label: '수입', value: totalIncome, className: 'text-income' },
    { label: '지출', value: totalExpense, className: 'text-expense' },
    {
      label: '잔액',
      value: balance,
      className: balance < 0 ? 'text-destructive' : 'text-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-border bg-card p-4 text-center shadow-sm"
        >
          <p className="text-sm text-muted-foreground">{c.label}</p>
          <p className={`mt-1 text-lg font-bold ${c.className}`}>
            {formatCurrency(c.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
