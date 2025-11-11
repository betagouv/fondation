/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type */

import { drizzle } from 'drizzle-orm/node-postgres';
import { type Pool } from 'pg';
import * as schema from './schemas';

export function getDrizzleInstance(client: Pool) {
  return drizzle({ schema, client, casing: 'snake_case' });
}
type DrizzleDbInterface = ReturnType<typeof getDrizzleInstance>;

export interface DrizzleService extends DrizzleDbInterface {}
export abstract class DrizzleService implements DrizzleDbInterface {}

export type Tx = Parameters<
  Parameters<DrizzleDbInterface['transaction']>[0]
>[0];
