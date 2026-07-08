// NextAuth v5 라우트 핸들러. /api/auth/* 의 모든 요청을 Auth.js가 처리한다.
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
