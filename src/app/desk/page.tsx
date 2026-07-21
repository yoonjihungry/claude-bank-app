import DeskHomePage from '@/screens/DeskHomePage';

/**
 * 공유데스크 데모 홈 라우트: '/desk' (독립 전체화면 — 자체 헤더/내비/푸터를 가진 완결형 시안)
 * `(shell)` 그룹 밖에 있어 공통 셸·전역 Context·세션 조회를 거치지 않는다.
 */
export default function Page() {
  return <DeskHomePage />;
}
