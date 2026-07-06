export type TxType = 'income' | 'expense';

/** 결제수단 — 지출에만 사용한다. 신용카드는 후불이라 별도 집계 대상이 된다. */
export type PaymentMethod = 'cash' | 'check' | 'credit';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number; // 원 단위 정수
  category: string; // Category.id 참조
  date: string; // ISO 'YYYY-MM-DD'
  memo?: string;
  /** 결제수단(지출 전용). 기존 데이터엔 없을 수 있어 선택적 — 없으면 '미지정'. */
  method?: PaymentMethod;
  /** 할부 개월수(신용카드 전용). 2 이상이면 할부, 없으면 일시불. */
  installmentMonths?: number;
}

export interface Category {
  id: string;
  name: string;
  type: TxType;
  color: string; // 차트용
}

export interface Budget {
  categoryId: string;
  month: string; // 'YYYY-MM'
  limit: number;
}
