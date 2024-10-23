import { defineConfig } from 'drizzle-kit';
import {
  apiConfig,
  defaultApiConfig,
} from 'src/shared-kernel/adapters/primary/nestjs/env.';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  dialect: 'postgresql',
  schema:
    './src/**/adapters/secondary/gateways/repositories/drizzle/schema/*.ts',
  out: './drizzle',
  breakpoints: false,
  strict: true,
  dbCredentials: getDbCredentials(),
});

function getDbCredentials() {
  if (isProduction) {
    if (!apiConfig?.database?.url)
      throw new Error('Database URL is required in production');
    return { url: apiConfig.database.url };
  } else {
    return {
      host: defaultApiConfig.database.host,
      port: defaultApiConfig.database.port,
      user: defaultApiConfig.database.user,
      password: defaultApiConfig.database.password,
      database: defaultApiConfig.database.name,
      ssl: false,
    };
  }
}
