import type { Category } from '../types';

/**
 * 기본 카테고리 목록.
 * color는 Recharts 차트에서 카테고리를 구분하는 데 사용된다.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  // 지출
  { id: 'food', name: '식비', type: 'expense', color: '#ef4444' },
  { id: 'transport', name: '교통', type: 'expense', color: '#f97316' },
  { id: 'housing', name: '주거/공과금', type: 'expense', color: '#eab308' },
  { id: 'shopping', name: '쇼핑', type: 'expense', color: '#ec4899' },
  { id: 'health', name: '의료/건강', type: 'expense', color: '#14b8a6' },
  { id: 'culture', name: '문화/여가', type: 'expense', color: '#8b5cf6' },
  { id: 'education', name: '교육', type: 'expense', color: '#3b82f6' },
  { id: 'etc-expense', name: '기타(지출)', type: 'expense', color: '#6b7280' },
  // 수입
  { id: 'salary', name: '급여', type: 'income', color: '#22c55e' },
  { id: 'bonus', name: '보너스', type: 'income', color: '#10b981' },
  { id: 'investment', name: '금융/투자', type: 'income', color: '#0ea5e9' },
  { id: 'etc-income', name: '기타(수입)', type: 'income', color: '#84cc16' },
];

/** id로 카테고리를 조회한다. 없으면 undefined. */
export function getCategory(id: string): Category | undefined {
  return DEFAULT_CATEGORIES.find((c) => c.id === id);
}

/** 특정 타입(income/expense)의 카테고리만 반환한다. */
export function categoriesByType(type: Category['type']): Category[] {
  return DEFAULT_CATEGORIES.filter((c) => c.type === type);
}
