import { defineConfig } from 'drizzle-kit';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env.';

export default defineConfig({
  dialect: 'postgresql',
  schema:
    './src/**/adapters/secondary/gateways/repositories/drizzle/schema/*.ts',
  out: './drizzle',
  breakpoints: false,
  strict: true,
  dbCredentials: {
    host: process.env.DB_HOST ?? defaultApiConfig.database.host,
    port: process.env.DB_PORT
      ? Number(process.env.DB_PORT)
      : defaultApiConfig.database.port,
    user: process.env.DB_USER ?? defaultApiConfig.database.user,
    password: process.env.DB_PASSWORD ?? defaultApiConfig.database.password,
    database: process.env.DB_NAME ?? defaultApiConfig.database.name,

    ssl: process.env.NODE_ENV === 'production',
  },
});
