// 임시 진단용 라우트 — 배포 런타임에서 인증 환경변수가 실제로 보이는지 확인한다.
// 값 자체는 절대 반환하지 않는다(존재 여부·길이·앞 6글자까지만).
// 원인 확인이 끝나면 이 파일은 삭제할 것.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// showPrefix는 앞부분이 고정 상수라 노출해도 무의미한 값에만 켠다(GOCSPX-, 숫자 client id 등).
// AUTH_SECRET·DATABASE_URL 처럼 앞부분이 랜덤인 값은 절대 켜지 않는다.
function inspect(value: string | undefined, showPrefix = false) {
  if (!value) return { present: false, length: 0 };
  return {
    present: true,
    length: value.length,
    ...(showPrefix ? { prefix: value.slice(0, 7) } : {}),
    // 따옴표·공백 혼입 여부. 값을 노출하지 않고 오염만 잡아낸다.
    quoted: /^["']|["']$/.test(value),
    trimmedLength: value.trim().length,
  };
}

export function GET() {
  return NextResponse.json({
    env: {
      AUTH_GOOGLE_ID: inspect(process.env.AUTH_GOOGLE_ID, true),
      AUTH_GOOGLE_SECRET: inspect(process.env.AUTH_GOOGLE_SECRET, true),
      AUTH_SECRET: inspect(process.env.AUTH_SECRET),
      DATABASE_URL: inspect(process.env.DATABASE_URL),
    },
    deployment: {
      id: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      env: process.env.VERCEL_ENV ?? null,
      url: process.env.VERCEL_URL ?? null,
      region: process.env.VERCEL_REGION ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    },
    now: new Date().toISOString(),
  });
}
