/**
 * 색상 변환 유틸 — 커스텀 색상 선택기(CategoryModal)에서 사용한다.
 * 카테고리 색은 사용자가 임의로 고를 수 있는 값이라, 여기서는 임의 HEX를 다룬다.
 */

export interface Hsv {
  /** 색조 0~360 */
  h: number;
  /** 채도 0~1 */
  s: number;
  /** 명도 0~1 */
  v: number;
}

/** HSV → RGB(각 0~255). */
export function hsvToRgb({ h, s, v }: Hsv): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g] = [c, x];
  else if (h < 120) [r, g] = [x, c];
  else if (h < 180) [g, b] = [c, x];
  else if (h < 240) [g, b] = [x, c];
  else if (h < 300) [r, b] = [c, x];
  else [r, b] = [c, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

const hex2 = (n: number) => n.toString(16).padStart(2, '0');

/** RGB(0~255) → '#rrggbb'. */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

/** HSV → '#rrggbb'. */
export function hsvToHex(hsv: Hsv): string {
  const [r, g, b] = hsvToRgb(hsv);
  return rgbToHex(r, g, b);
}

/** '#rrggbb' 또는 '#rgb' → HSV. 파싱 실패 시 null. */
export function hexToHsv(hex: string): Hsv | null {
  let m = hex.trim().replace(/^#/, '');
  if (m.length === 3) {
    m = m
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}
