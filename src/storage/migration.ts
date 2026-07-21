/**
 * 로그인 첫 로드 때 "이 기기에 있던 기록을 계정으로 옮길까요?"를 처리하는 계층.
 *
 * 이 파일이 다루는 상황은 딱 하나다 — 비로그인으로 쓰던 사람이 처음 로그인했을 때.
 * 평상시 CRUD는 repository.ts가 맡는다.
 *
 * 원칙: **로컬 원본은 어떤 경우에도 지우지 않는다.** 옮기기에 성공해도 그대로 둔다.
 * 로그아웃하면 쓰던 화면이 그대로 돌아오는 게 사용자 입장에서 덜 놀랍고,
 * 옮기기가 잘못됐을 때 돌아갈 곳이 남는다.
 */
import type { Category } from '@/types';
import { getRepository, type LedgerData } from './repository';
import { api, json } from './http';

export interface LocalSummary {
  transactions: number;
  categories: number;
  budgets: number;
  recurringRules: number;
}

/** 이 기기에 남아 있는 데이터. 옮길 게 없으면 null. */
export interface PendingMigration {
  data: LedgerData;
  summary: LocalSummary;
}

/**
 * 기본 카테고리만 있고 나머지가 비어 있으면 "옮길 것 없음"으로 본다.
 * 앱을 열어보기만 하고 아무것도 입력하지 않은 사람에게 이전 안내를 띄우지 않기 위해서다.
 */
function isWorthMigrating(data: LedgerData): boolean {
  return (
    data.transactions.length > 0 ||
    data.budgets.length > 0 ||
    data.recurringRules.length > 0
  );
}

/** 이 기기에 옮길 만한 데이터가 있으면 그 내용과 개수를 돌려준다. */
export async function readPendingMigration(): Promise<PendingMigration | null> {
  const data = await getRepository('local').loadAll();
  if (!isWorthMigrating(data)) return null;

  return {
    data,
    summary: {
      transactions: data.transactions.length,
      categories: data.categories.length,
      budgets: data.budgets.length,
      recurringRules: data.recurringRules.length,
    },
  };
}

/**
 * 로컬 데이터를 계정으로 옮기고, 옮겨진 결과 전체를 돌려받는다.
 * 카테고리·규칙 id는 서버가 새로 발급하므로 반환값을 그대로 상태에 넣어야 한다.
 */
export async function migrateToServer(data: LedgerData): Promise<LedgerData> {
  return api<LedgerData>('/api/migrate', { method: 'POST', body: json(data) });
}

/** 옮기지 않기로 했을 때. 빈 계정에 기본 카테고리를 넣어 바로 쓸 수 있게 한다. */
export async function seedServerCategories(): Promise<Category[]> {
  return api<Category[]>('/api/categories/seed', { method: 'POST' });
}
