import { useMemo } from 'react';
import { CATEGORY_PALETTE } from '../constants/categories';
import { useLedger } from '../context/LedgerContext';
import type { Category, TxType } from '../types';

export interface UseCategories {
  /** 전체 카테고리 */
  all: Category[];
  /** 특정 타입(income/expense)의 카테고리만 */
  byType: (type: TxType) => Category[];
  /** id로 조회. 삭제됐거나 없으면 undefined. */
  byId: (id: string) => Category | undefined;
  /** 아직 쓰지 않은 프리셋 색을 하나 돌려준다(신규 추가 기본색). */
  nextColor: () => string;
  addCategory: (input: Omit<Category, 'id'>) => string;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
}

/**
 * 카테고리 조회/편집을 한곳에서 제공한다.
 * 컴포넌트는 `constants`의 정적 목록이 아니라 이 훅을 통해 카테고리에 접근한다.
 */
export function useCategories(): UseCategories {
  const { categories, addCategory, updateCategory, deleteCategory } = useLedger();

  const byId = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c]));
    return (id: string) => map.get(id);
  }, [categories]);

  return {
    all: categories,
    byType: (type) => categories.filter((c) => c.type === type),
    byId,
    nextColor: () => {
      const used = new Set(categories.map((c) => c.color));
      return CATEGORY_PALETTE.find((c) => !used.has(c)) ?? CATEGORY_PALETTE[0];
    },
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
