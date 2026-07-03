import type { Category } from '../types';

/**
 * 기본 카테고리 목록 — 최초 실행 시 저장소를 시드하는 값이다.
 * 이후에는 사용자가 추가/수정/삭제한 카테고리가 localStorage에 저장되고,
 * 런타임 조회는 `hooks/useCategories`를 통해 이뤄진다(정적 조회 함수를 두지 않는다).
 * color는 Recharts 차트에서 카테고리를 구분하는 데 사용된다.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  // 지출 — 밝은 핀테크 비비드 팔레트 (dataviz 검증 통과)
  { id: 'food', name: '식비', type: 'expense', color: '#e66767' },
  { id: 'transport', name: '교통', type: 'expense', color: '#d95926' },
  { id: 'housing', name: '주거/공과금', type: 'expense', color: '#c98500' },
  { id: 'shopping', name: '쇼핑', type: 'expense', color: '#d55181' },
  { id: 'health', name: '의료/건강', type: 'expense', color: '#199e70' },
  { id: 'culture', name: '문화/여가', type: 'expense', color: '#9085e9' },
  { id: 'education', name: '교육', type: 'expense', color: '#3987e5' },
  { id: 'etc-expense', name: '기타(지출)', type: 'expense', color: '#8a93a3' },
  // 수입
  { id: 'salary', name: '급여', type: 'income', color: '#22b479' },
  { id: 'bonus', name: '보너스', type: 'income', color: '#10b981' },
  { id: 'investment', name: '금융/투자', type: 'income', color: '#0ea5e9' },
  { id: 'etc-income', name: '기타(수입)', type: 'income', color: '#84cc16' },
];

/**
 * 카테고리 추가/수정 시 고르는 프리셋 색 팔레트(dataviz 검증색).
 * 이 목록 밖의 색은 색상 선택기로 직접 지정할 수 있다.
 */
export const CATEGORY_PALETTE: string[] = [
  '#e66767',
  '#d95926',
  '#c98500',
  '#d55181',
  '#199e70',
  '#9085e9',
  '#3987e5',
  '#8a93a3',
  '#22b479',
  '#10b981',
  '#0ea5e9',
  '#84cc16',
];
