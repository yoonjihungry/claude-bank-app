import DeskSearchPage from '@/screens/DeskSearchPage';

/**
 * 공유데스크 데모 '데스크 찾기' 라우트: '/desk/search'
 * `(shell)` 그룹 밖의 독립 전체화면 — 공통 셸·전역 Context·세션 조회를 거치지 않는다.
 */
export default function Page() {
  return <DeskSearchPage />;
}
