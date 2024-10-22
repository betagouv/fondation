import { defineConfig } from 'drizzle-kit';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env.';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  dialect: 'postgresql',
  schema:
    './src/**/adapters/secondary/gateways/repositories/drizzle/schema/*.ts',
  out: './drizzle',
  breakpoints: false,
  strict: true,
  dbCredentials: {
    host: isProduction ? process.env.DB_HOST! : defaultApiConfig.database.host,
    port:
      isProduction && process.env.DB_PORT!
        ? Number(process.env.DB_PORT!)
        : defaultApiConfig.database.port,
    user: isProduction ? process.env.DB_USER! : defaultApiConfig.database.user,
    password: isProduction
      ? process.env.DB_PASSWORD!
      : defaultApiConfig.database.password,
    database: isProduction
      ? process.env.DB_NAME!
      : defaultApiConfig.database.name,

    ssl: process.env.NODE_ENV === 'production',
  },
});
