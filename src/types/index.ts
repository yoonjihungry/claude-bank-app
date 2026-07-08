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
  /** 이 거래를 자동 생성한 반복 규칙(RecurringRule.id). 있으면 '고정' 거래. */
  recurringId?: string;
}

/**
 * 매월 반복되는 고정 수입/지출 규칙.
 * 앱을 열 때 startMonth부터 이번 달까지 아직 만들지 않은 달의 거래를 자동 생성한다.
 * 주기는 '매월'만 지원한다.
 */
export interface RecurringRule {
  id: string;
  type: TxType;
  amount: number; // 원 단위 정수
  category: string; // Category.id 참조
  /** 결제수단(지출 전용). 반복은 할부와 성격이 겹쳐 할부는 지원하지 않는다. */
  method?: PaymentMethod;
  /** 매달 며칠에 생성할지(1~31). 그 달에 없는 날이면 말일로 보정한다. */
  dayOfMonth: number;
  memo?: string;
  /** 이 달('YYYY-MM')부터 적용. */
  startMonth: string;
  /** false면 자동 생성을 잠시 멈춘다. */
  active: boolean;
  /** 이미 거래를 생성한 달('YYYY-MM') 목록 — 중복 생성 방지. */
  generatedMonths: string[];
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
