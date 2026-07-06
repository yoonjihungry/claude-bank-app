import type { PaymentMethod } from '../types';

/**
 * 결제수단 정의 — 입력 폼의 선택지와 목록 뱃지에서 공용으로 쓴다.
 * `badge`는 목록에 표시하는 짧은 라벨.
 */
export interface PaymentMethodMeta {
  id: PaymentMethod;
  label: string;
  badge: string;
}

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  { id: 'cash', label: '현금', badge: '현금' },
  { id: 'check', label: '체크카드', badge: '체크' },
  { id: 'credit', label: '신용카드', badge: '신용' },
];

/** 신규 지출 입력 시 기본 결제수단. */
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'cash';

const BY_ID = new Map(PAYMENT_METHODS.map((m) => [m.id, m]));

/** id로 결제수단 메타를 찾는다(없으면 undefined). */
export function paymentMethodMeta(id?: PaymentMethod): PaymentMethodMeta | undefined {
  return id ? BY_ID.get(id) : undefined;
}
