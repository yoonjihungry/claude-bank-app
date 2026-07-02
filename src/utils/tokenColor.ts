/**
 * 디자인 토큰의 실제 색 문자열을 반환한다.
 *
 * Recharts처럼 색을 CSS 클래스가 아니라 값(fill 등)으로 받아야 하는 경우에 쓴다.
 * 하드코딩 대신 tokens.css의 CSS 변수를 런타임에 읽어 hsl() 문자열로 감싼다
 * → 색의 Source of Truth는 여전히 tokens.css 하나뿐이다.
 *
 * @param name '--' 를 뺀 토큰 이름 (예: 'income', 'expense')
 */
export function tokenColor(name: string): string {
  if (typeof window === 'undefined') return '';
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();
  return value ? `hsl(${value})` : '';
}
