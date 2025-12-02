import { config } from '@dotenvx/dotenvx';
import { defineConfig, env } from 'prisma/config';

config({ quiet: true });

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  typedSql: {
    path: 'prisma/sql',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
