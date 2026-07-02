import { DEFAULT_CATEGORIES, categoriesByType, getCategory } from '../constants/categories';
import type { TransactionFilter } from '../hooks/useTransactions';
import type { TxType } from '../types';

interface Props {
  filter: TransactionFilter;
  onChange: (filter: TransactionFilter) => void;
}

const controlClass =
  'rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

export default function FilterBar({ filter, onChange }: Props) {
  // 타입이 지정되면 그 타입의 카테고리만, 아니면 전체 카테고리를 보여준다.
  const categoryOptions = filter.type
    ? categoriesByType(filter.type)
    : DEFAULT_CATEGORIES;

  function patch(next: Partial<TransactionFilter>) {
    onChange({ ...filter, ...next });
  }

  function handleTypeChange(value: string) {
    const type = value ? (value as TxType) : undefined;
    // 타입 변경 시 현재 카테고리가 새 타입에 속하지 않으면 해제한다.
    const keepCategory =
      filter.categoryId && (!type || getCategory(filter.categoryId)?.type === type);
    onChange({
      ...filter,
      type,
      categoryId: keepCategory ? filter.categoryId : undefined,
    });
  }

  const isActive =
    filter.type != null ||
    filter.categoryId != null ||
    filter.month != null ||
    filter.minAmount != null ||
    filter.maxAmount != null ||
    (filter.keyword ?? '') !== '';

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <input
        type="month"
        value={filter.month ?? ''}
        onChange={(e) => patch({ month: e.target.value || undefined })}
        className={controlClass}
        aria-label="월"
      />

      <select
        value={filter.type ?? ''}
        onChange={(e) => handleTypeChange(e.target.value)}
        className={controlClass}
        aria-label="구분"
      >
        <option value="">전체 구분</option>
        <option value="expense">지출</option>
        <option value="income">수입</option>
      </select>

      <select
        value={filter.categoryId ?? ''}
        onChange={(e) => patch({ categoryId: e.target.value || undefined })}
        className={controlClass}
        aria-label="카테고리"
      >
        <option value="">전체 카테고리</option>
        {categoryOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <input
        type="number"
        min="0"
        value={filter.minAmount ?? ''}
        onChange={(e) =>
          patch({ minAmount: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder="최소금액"
        className={`${controlClass} w-28`}
        aria-label="최소금액"
      />
      <input
        type="number"
        min="0"
        value={filter.maxAmount ?? ''}
        onChange={(e) =>
          patch({ maxAmount: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder="최대금액"
        className={`${controlClass} w-28`}
        aria-label="최대금액"
      />

      <input
        type="text"
        value={filter.keyword ?? ''}
        onChange={(e) => patch({ keyword: e.target.value || undefined })}
        placeholder="메모 검색"
        className={`${controlClass} flex-1`}
        aria-label="메모 검색"
      />

      {isActive && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100"
        >
          초기화
        </button>
      )}
    </div>
  );
}
