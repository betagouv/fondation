import { defineConfig, env } from 'prisma/config';

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
    shadowDatabaseUrl: 'postgresql://fondation:secret@localhost:5435/fondation_shadow',
  },
});
