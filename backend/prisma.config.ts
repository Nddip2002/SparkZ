import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// The Prisma CLI (migrate, introspect, studio) uses the DIRECT (non-pooled) connection.
// Runtime queries use DATABASE_URL via @prisma/adapter-pg in PrismaService.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npm run seed',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? '',
  },
});
