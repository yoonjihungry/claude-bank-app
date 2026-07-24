import { useEffect } from 'react';

/**
 * 마운트되어 있는 동안 body 스크롤을 잠근다(모달이 열린 사이 뒤 배경 고정).
 * 잠그지 않으면 모달 위에서 스크롤할 때 뒤 페이지가 같이 밀리거나(스크롤 체이닝),
 * 입력칸을 포커스할 때 브라우저가 페이지를 밀어 올려 화면이 튄다.
 * 언마운트 시 원래 값으로 복원한다.
 */
export function useBodyScrollLock() {
  useEffect(() => {
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    // 스크롤바가 사라지며 생기는 가로 밀림을 스크롤바 폭만큼 패딩으로 보정한다.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, []);
}
