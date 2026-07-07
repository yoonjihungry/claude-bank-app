// Prisma CLI 설정. 비밀 연결 문자열은 .env.local(gitignore)에 두고 여기서 로드한다.
// Next.js 앱 런타임은 .env.local 을 자동으로 읽지만, Prisma CLI는 이 파일에서 명시 로드해야 한다.
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" }); // 우선
loadEnv(); // .env 폴백(이미 설정된 값은 덮어쓰지 않음)

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // 마이그레이션/CLI는 직접 연결(non-pooling)을 써야 안전하다(pgbouncer는 DDL/advisory lock 제약).
    // 앱 런타임은 src/lib/prisma.ts 에서 풀링 DATABASE_URL 을 사용한다.
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
