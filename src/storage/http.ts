/**
 * 서버 API 호출 공통 helper.
 *
 * 실패하면 반드시 throw한다 — LedgerContext가 이 예외를 잡아 낙관적 반영을 되돌린다.
 * 조용히 삼키면 화면에는 저장된 것처럼 보이는데 서버에는 없는 상태가 된다.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => null);
    throw new Error(message ?? `요청에 실패했습니다 (${response.status})`);
  }

  // 204 No Content — 본문이 없다.
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const json = (body: unknown) => JSON.stringify(body);
