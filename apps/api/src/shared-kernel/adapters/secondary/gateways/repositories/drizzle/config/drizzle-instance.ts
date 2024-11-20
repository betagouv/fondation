import { drizzle } from 'drizzle-orm/node-postgres';
import { ConnectionConfig, Pool } from 'pg';
import * as dataAdministrationContextSchema from '../../../../../../../data-administration-context/adapters/secondary/gateways/repositories/drizzle/schema';
import * as reportsContextSchema from '../../../../../../../reports-context/adapters/secondary/gateways/repositories/drizzle/schema';
import * as filesContextSchema from '../../../../../../../files-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { sharedKernelContextSchema } from '../schema/shared-kernel-context-schema.drizzle';

export const getDrizzleInstance = (connectionConfig: ConnectionConfig) => {
  const pool = new Pool(connectionConfig);
  return drizzle({
    client: pool,
    schema: {
      ...sharedKernelContextSchema,
      ...reportsContextSchema,
      ...dataAdministrationContextSchema,
      ...filesContextSchema,
    },
    casing: 'snake_case',
  });
};

export type DrizzleDb = ReturnType<typeof getDrizzleInstance>;
