import { ConnectionConfig } from 'pg';

export const getDrizzleConfig = (
  config?: ConnectionConfig,
): ConnectionConfig => ({
  host: 'localhost',
  port: 5440,
  user: 'fondation',
  password: 'secret',
  database: 'fondation',
  ...config,
});

export const drizzleConfigForTest = getDrizzleConfig({
  port: 5435,
});
