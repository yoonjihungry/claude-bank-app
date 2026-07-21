// DB 행 ↔ 도메인 타입 변환.
//
// 두 가지를 흡수한다:
//  1. 이름: 도메인은 `category`(Category.id), Prisma는 `categoryId`.
//  2. 빈 값: 도메인은 선택적 필드(undefined), Prisma는 nullable 컬럼(null).
// 도메인 타입 원본은 src/types/index.ts — 이 파일이 그 계약을 지키는 유일한 지점이다.
import type {
  Budget as PrismaBudget,
  Category as PrismaCategory,
  RecurringRule as PrismaRecurringRule,
  Transaction as PrismaTransaction,
} from '@/generated/prisma/client';
import type {
  Budget,
  Category,
  PaymentMethod,
  RecurringRule,
  Transaction,
  TxType,
} from '@/types';

/** null → undefined. 도메인 타입의 선택적 필드는 null을 쓰지 않는다. */
const opt = <T>(value: T | null): T | undefined => value ?? undefined;

// ── DB → 도메인 ────────────────────────────────────────────

export function toTransaction(row: PrismaTransaction): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    // 카테고리가 삭제되면 null이 된다. 도메인은 빈 문자열로 받고, 조회에 실패해 '미분류'로 표시된다.
    category: row.categoryId ?? '',
    date: row.date,
    memo: opt(row.memo),
    method: opt(row.method),
    installmentMonths: opt(row.installmentMonths),
    recurringId: opt(row.recurringId),
  };
}

export function toCategory(row: PrismaCategory): Category {
  return { id: row.id, name: row.name, type: row.type, color: row.color };
}

export function toBudget(row: PrismaBudget): Budget {
  return { categoryId: row.categoryId, month: row.month, limit: row.limit };
}

export function toRecurringRule(row: PrismaRecurringRule): RecurringRule {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    category: row.categoryId ?? '',
    method: opt(row.method),
    dayOfMonth: row.dayOfMonth,
    memo: opt(row.memo),
    startMonth: row.startMonth,
    active: row.active,
    generatedMonths: row.generatedMonths,
  };
}

// ── 요청 본문 검증 ─────────────────────────────────────────
// 라이브러리 없이 최소한만 본다. 목적은 완전한 스키마 검증이 아니라,
// 형태가 깨진 값이 DB까지 내려가 FK/타입 오류로 500이 나는 걸 막는 것이다.

const TX_TYPES: TxType[] = ['income', 'expense'];
const METHODS: PaymentMethod[] = ['cash', 'check', 'credit'];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;
const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

/** 검증 실패 사유. 통과하면 null. */
export function validateTransaction(body: unknown): string | null {
  if (!isRecord(body)) return '본문이 객체가 아닙니다';
  if (!isNonEmptyString(body.id)) return 'id가 필요합니다';
  if (!TX_TYPES.includes(body.type as TxType)) return 'type이 income/expense가 아닙니다';
  if (!isInt(body.amount) || body.amount < 0) return 'amount가 0 이상 정수가 아닙니다';
  if (!isNonEmptyString(body.category)) return 'category(카테고리 id)가 필요합니다';
  if (!isNonEmptyString(body.date)) return 'date가 필요합니다';
  if (body.method !== undefined && !METHODS.includes(body.method as PaymentMethod)) {
    return 'method 값이 올바르지 않습니다';
  }
  return null;
}

export function validateCategory(body: unknown): string | null {
  if (!isRecord(body)) return '본문이 객체가 아닙니다';
  if (!isNonEmptyString(body.id)) return 'id가 필요합니다';
  if (!isNonEmptyString(body.name)) return 'name이 필요합니다';
  if (!TX_TYPES.includes(body.type as TxType)) return 'type이 income/expense가 아닙니다';
  if (!isNonEmptyString(body.color)) return 'color가 필요합니다';
  return null;
}

export function validateBudget(body: unknown): string | null {
  if (!isRecord(body)) return '본문이 객체가 아닙니다';
  if (!isNonEmptyString(body.categoryId)) return 'categoryId가 필요합니다';
  if (!isNonEmptyString(body.month)) return 'month가 필요합니다';
  if (!isInt(body.limit)) return 'limit이 정수가 아닙니다';
  return null;
}

export function validateRecurringRule(body: unknown): string | null {
  if (!isRecord(body)) return '본문이 객체가 아닙니다';
  if (!isNonEmptyString(body.id)) return 'id가 필요합니다';
  if (!TX_TYPES.includes(body.type as TxType)) return 'type이 income/expense가 아닙니다';
  if (!isInt(body.amount) || body.amount < 0) return 'amount가 0 이상 정수가 아닙니다';
  if (!isNonEmptyString(body.category)) return 'category(카테고리 id)가 필요합니다';
  if (!isInt(body.dayOfMonth) || body.dayOfMonth < 1 || body.dayOfMonth > 31) {
    return 'dayOfMonth가 1~31이 아닙니다';
  }
  if (!isNonEmptyString(body.startMonth)) return 'startMonth가 필요합니다';
  if (typeof body.active !== 'boolean') return 'active가 boolean이 아닙니다';
  if (!Array.isArray(body.generatedMonths)) return 'generatedMonths가 배열이 아닙니다';
  return null;
}
