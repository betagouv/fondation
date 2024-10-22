import { ConnectionConfig } from 'pg';
import { defaultApiConfig } from '../../../primary/nestjs/env.';

export const getDrizzleConfig = (
  config: Required<
    Pick<ConnectionConfig, 'host' | 'port' | 'user' | 'password' | 'database'>
  >,
): ConnectionConfig => config;

export const drizzleConfigForTest = getDrizzleConfig({
  host: defaultApiConfig.database.host,
  port: 5435,
  user: defaultApiConfig.database.user,
  password: defaultApiConfig.database.password,
  database: defaultApiConfig.database.name,
});
