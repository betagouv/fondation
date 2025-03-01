import 'tsconfig-paths/register';

import { sql } from 'drizzle-orm';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleInstance } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { startDockerPostgresql } from './docker-postgresql-manager';
import teardown from './teardown-postgresql-docker';

const setup = async (): Promise<void> => {
  try {
    await startDockerPostgresql();

    const db = getDrizzleInstance(drizzleConfigForTest);
    await db.transaction(async (trx) => {
      await trx.execute(sql`CREATE SCHEMA data_administration_context;`);
      await trx.execute(sql`CREATE SCHEMA reports_context;`);
      await trx.execute(sql`CREATE SCHEMA shared_kernel_context;`);
      await trx.execute(sql`CREATE SCHEMA identity_and_access_context;`);
    });
    await db.$client.end();
  } catch {
    await teardown();
  }
};

export default setup;
