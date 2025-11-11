import { ConnectionConfig, Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from 'src/modules/framework/drizzle/schemas';

/** @deprecated - this method generates its own Pool, which is fine in tests, but should be avoided otherwise */
export function getDrizzleInstance(connectionConfig: ConnectionConfig) {
  const client = new Pool(connectionConfig);
  return drizzle({
    schema,
    client,
    casing: 'snake_case',
  });
}

export type DrizzleDb = ReturnType<typeof getDrizzleInstance>;
