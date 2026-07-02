import { useState } from 'react';
import BudgetPanel from '../components/BudgetPanel';
import MonthNavigator from '../components/MonthNavigator';
import { currentMonth } from '../utils/dateRange';

export default function BudgetPage() {
  const [month, setMonth] = useState(currentMonth());

  return (
    <div className="flex flex-col gap-6">
      <MonthNavigator month={month} onChange={setMonth} />
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-800">카테고리별 예산</h2>
        <p className="mb-3 text-sm text-gray-500">
          지출 카테고리마다 이 달의 한도를 설정하세요. 사용률이 80%를 넘으면 주의,
          100%를 넘으면 초과로 표시됩니다. 0으로 두면 예산이 해제됩니다.
        </p>
        <BudgetPanel month={month} />
      </div>
    </div>
  );
}
