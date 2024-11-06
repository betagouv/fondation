import { drizzle } from 'drizzle-orm/node-postgres';
import { ConnectionConfig, Pool } from 'pg';
import * as dataAdministrationContextSchema from '../../../../../../../data-administrator-context/adapters/secondary/gateways/repositories/drizzle/schema';
import * as reportsContextSchema from '../../../../../../../reporter-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { sharedKernelContextSchema } from '../schema/shared-kernel-context-schema.drizzle';

export const getDrizzleInstance = (connectionConfig: ConnectionConfig) => {
  const pool = new Pool(connectionConfig);
  return drizzle({
    client: pool,
    schema: {
      schema: {
        ...sharedKernelContextSchema,
        ...reportsContextSchema,
        ...dataAdministrationContextSchema,
      },
      casing: 'snake_case',
    },
  });
};

export type DrizzleDb = ReturnType<typeof getDrizzleInstance>;
