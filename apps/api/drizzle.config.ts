import { defineConfig } from 'drizzle-kit';
import {
  apiConfig,
  defaultApiConfig,
} from 'src/modules/framework/config/config.constants';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  dialect: 'postgresql',
  schema:
    './src/**/adapters/secondary/gateways/repositories/drizzle/schema/*.ts',
  out: './drizzle',
  breakpoints: false,
  strict: true,
  dbCredentials: getDbCredentials(),
  casing: 'snake_case',
});

function getDbCredentials() {
  if (isProduction) {
    if (!apiConfig?.database?.connectionString)
      throw new Error('Database URL is required in production');
    return { url: apiConfig.database.connectionString };
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
