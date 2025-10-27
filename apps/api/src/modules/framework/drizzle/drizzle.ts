/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type */

import { drizzle } from 'drizzle-orm/node-postgres';
import { ConnectionConfig, Pool } from 'pg';
import * as schema from './schemas';

export const getDrizzleInstance = (connectionConfig: ConnectionConfig) => {
  const client = new Pool(connectionConfig);
  return drizzle({ schema, client, casing: 'snake_case' });
};

type DrizzleDbInterface = ReturnType<typeof getDrizzleInstance>;

export interface Db extends DrizzleDbInterface {}
export abstract class Db implements DrizzleDbInterface {}
