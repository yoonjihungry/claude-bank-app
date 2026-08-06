// 공유데스크 데모 '데스크 찾기' 필터 상태 저장소 (/desk/search ↔ /desk/region 공유)
//
// 찾기 화면과 지역 선택 화면은 각각 독립 라우트라, 지역을 고르러 갔다 오면 컴포넌트가
// 언마운트→리마운트된다. 그 왕복에서 필터 선택이 날아가지 않도록 sessionStorage에 담아
// 두 화면이 같은 상태를 이어 본다. (데모용 로컬 저장 — 서버/DB와 무관하다.)

export interface DeskSearchFilters {
  region: string; // '' = 미선택(플레이스홀더 표시)
  grades: string[]; // 다중 선택: 'BASIC' | 'STANDARD' | 'PREMIUM'
  trust: string; // 단일 선택: '전체' | '운영 이상' | '검증 이상' | '최고 등급'
  priceMin: number;
  priceMax: number;
  amenities: string[]; // 다중 선택
  sort: string; // 단일 선택
  instantOnly: boolean;
}

export const PRICE_MAX = 500000;

// 첫 진입 기본값 — 첨부 시안(STANDARD·최고 등급·최소 200,000·즉시입주 on)을 그대로 재현한다.
export const DEFAULT_FILTERS: DeskSearchFilters = {
  region: '',
  grades: ['STANDARD'],
  trust: '최고 등급',
  priceMin: 200000,
  priceMax: PRICE_MAX,
  amenities: [],
  sort: '최신 순',
  instantOnly: true,
};

// '초기화' 버튼이 되돌리는 빈 상태.
export const CLEARED_FILTERS: DeskSearchFilters = {
  region: '',
  grades: [],
  trust: '전체',
  priceMin: 0,
  priceMax: PRICE_MAX,
  amenities: [],
  sort: '최신 순',
  instantOnly: false,
};

const KEY = 'desk:search-filters';

export function loadFilters(): DeskSearchFilters {
  if (typeof window === 'undefined') return DEFAULT_FILTERS;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return DEFAULT_FILTERS;
    // 저장본에 없는 필드는 기본값으로 메운다(구 저장본 호환).
    return { ...DEFAULT_FILTERS, ...(JSON.parse(raw) as Partial<DeskSearchFilters>) };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function saveFilters(filters: DeskSearchFilters): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(filters));
  } catch {
    // 저장 실패는 데모에서 무시(용량 초과 등)
  }
}
