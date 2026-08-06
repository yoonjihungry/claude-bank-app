'use client';

// 공유데스크 데모 '지역 선택' 화면 (/desk/region)
// 첨부 시안(이미지 5)을 옮긴 지역 선택 화면. 좌측 시/도 레일 + 우측 세부 지역 리스트.
// 세부 지역(또는 'OO 전체')을 고르면 필터 저장소에 지역을 담고 찾기 화면으로 돌아간다.
//
// 시안에는 '서울'의 세부 지역만 나와 있어, 다른 시/도는 지어내지 않고 준비중 안내를 둔다.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadFilters, saveFilters } from './deskSearchStore';

const PROVINCES = ['서울', '경기', '인천', '부산', '제주', '강원', '충청', '전라', '경상'];

// 시/도별 세부 지역. '서울'은 시안 그대로, 나머지는 주요 시·군을 묶어 채운다.
// 각 목록 위에는 'OO 전체' 행이 자동으로 붙는다.
const REGION_DISTRICTS: Record<string, string[]> = {
  서울: [
    '강남/역삼/삼성', '신사/압구정', '서초/교대', '성수/서울숲',
    '홍대/합정/공덕', '여의도/마곡', '종로/을지로/광화문', '기타 서울 지역',
  ],
  경기: [
    '수원', '성남/분당', '용인', '고양/일산', '부천', '안양/평촌',
    '남양주', '시흥', '화성/동탄', '김포', '의정부', '파주', '광명', '기타 경기 지역',
  ],
  인천: [
    '송도/연수', '부평', '계양', '남동/구월', '서구/청라', '미추홀', '중구/영종', '기타 인천 지역',
  ],
  부산: [
    '서면/부산진', '해운대', '센텀시티', '남포/중구', '광안리/수영', '동래', '사상/사하', '기타 부산 지역',
  ],
  제주: ['제주시', '서귀포시', '애월/한림', '성산/구좌', '기타 제주 지역'],
  강원: ['춘천', '원주', '강릉', '속초/양양', '동해/삼척', '기타 강원 지역'],
  충청: ['대전/유성', '세종', '청주', '천안/아산', '충주', '기타 충청 지역'],
  전라: ['전주', '광주/상무', '여수', '순천', '군산', '목포', '기타 전라 지역'],
  경상: ['대구/동성로', '창원', '포항', '경주', '김해', '구미', '울산', '진주', '기타 경상 지역'],
};

type IconProps = { className?: string };
const ArrowLeft = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronRight = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function DeskRegionPage() {
  const router = useRouter();
  const [province, setProvince] = useState('서울');

  // 지역을 필터 저장소에 담고 찾기 화면으로 복귀.
  const select = (label: string) => {
    saveFilters({ ...loadFilters(), region: label });
    router.back();
  };

  return (
    <div className="min-h-screen bg-muted-foreground/10">
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-desk-surface">
        {/* 헤더 */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-desk-line/40 bg-desk-surface px-3">
          <button type="button" aria-label="뒤로" onClick={() => router.back()} className="p-1 text-desk-ink">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-desk-ink">지역 선택</h1>
        </header>

        <div className="flex flex-1">
          {/* 좌측 시/도 레일 — 배경 없음, 우측과 세로 구분선. 선택 항목만 주황 라운드 알약 */}
          <nav className="w-[92px] shrink-0 border-r border-desk-line/40 px-2.5 pb-3 pt-6">
            {PROVINCES.map((p) => {
              const active = province === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvince(p)}
                  className="flex h-13 w-full items-center justify-center"
                >
                  <span
                    className={`inline-flex w-full items-center justify-center rounded-full py-2.5 text-[14px] ${
                      active ? 'bg-desk-accent font-bold text-desk-on-dark' : 'font-medium text-desk-soft'
                    }`}
                  >
                    {p}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* 우측 세부 지역 — 선택한 시/도의 목록. 좌측 첫 알약과 같은 py-3에서 시작 */}
          <div className="min-w-0 flex-1 px-4 pb-3 pt-6">
            {/* 'OO 전체' — 옅은 회색 라운드 알약 + 셰브런 */}
            <button
              type="button"
              onClick={() => select(`${province} 전체`)}
              className="flex h-13 w-full items-center justify-between rounded-full bg-desk-badge px-4"
            >
              <span className="text-[15px] font-bold text-desk-ink">{province} 전체</span>
              <ChevronRight className="h-4 w-4 text-desk-soft" />
            </button>
            <div className="mt-1 flex flex-col">
              {(REGION_DISTRICTS[province] ?? []).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => select(d)}
                  className="flex items-center border-b border-desk-line/40 px-2 py-4 text-left text-[15px] text-desk-body"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
