import { ConnectionConfig } from 'pg';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';

export const getDrizzleConfig = <Prod extends boolean>(
  config: Prod extends true
    ? Required<Pick<ConnectionConfig, 'connectionString'>>
    : Required<
        Pick<ConnectionConfig, 'host' | 'port' | 'user' | 'password'>
      > & {
        name: Required<ConnectionConfig['database']>;
      },
): ConnectionConfig => ({
  ...config,
  connectionTimeoutMillis: 10000,
  statement_timeout: 1000,
});

export const drizzleConfigForTest = getDrizzleConfig({
  host: defaultApiConfig.database.host,
  port: 5435,
  user: defaultApiConfig.database.user,
  password: defaultApiConfig.database.password,
  name: defaultApiConfig.database.name,
});
