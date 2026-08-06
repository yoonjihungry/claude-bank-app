import DeskResultsPage from '@/screens/DeskResultsPage';

/**
 * 공유데스크 데모 '검색 결과' 라우트: '/desk/results'
 * `(shell)` 그룹 밖의 독립 전체화면 — 공통 셸·전역 Context·세션 조회를 거치지 않는다.
 */
export default function Page() {
  return <DeskResultsPage />;
}
