import { drizzle } from 'drizzle-orm/node-postgres';
import { ConnectionConfig, Pool } from 'pg';
import * as dataAdministrationContextSchema from 'src/data-administration-context/adapters/secondary/gateways/repositories/drizzle/schema';
import * as filesContextSchema from 'src/files-context/adapters/secondary/gateways/repositories/drizzle/schema';
import * as identityAndAccessContextSchema from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema';
import * as reportsContextSchema from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema';
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
      ...identityAndAccessContextSchema,
    },
    casing: 'snake_case',
  });
};

export type DrizzleDb = ReturnType<typeof getDrizzleInstance>;
