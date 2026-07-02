export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number; // 원 단위 정수
  category: string; // Category.id 참조
  date: string; // ISO 'YYYY-MM-DD'
  memo?: string;
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
