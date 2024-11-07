import { pushSchema } from 'drizzle-kit/api';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { timestamp } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import { sharedKernelContextSchema } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema/shared-kernel-context-schema.drizzle';
import { clearDB } from 'test/docker-postgresql-manager';

const previousDomainEventsTable = sharedKernelContextSchema.table(
  'domain_events',
  {
    occurredOn: timestamp().notNull(),
  },
);

const schema = {
  domainEvents: previousDomainEventsTable,
};

describe('Shared Kernel Context - migration 0010', () => {
  const pool = new Pool(drizzleConfigForTest);
  const db = drizzle({ client: pool, schema });

  beforeAll(async () => {
    await db.execute(sql`CREATE SCHEMA shared_kernel_context;`);
  });

  beforeEach(async () => {
    const { apply } = await pushSchema(schema, db as unknown as NodePgDatabase);
    await apply();
  });

  afterEach(async () => {
    await clearDB(db as unknown as NodePgDatabase, [previousDomainEventsTable]);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('rename occuredOn column by occurred_on', async () => {
    await expectColumnName('occurredOn');
    await db.execute(getDrizzleMigrationSql(10));
    await expectColumnName('occurred_on');
  });

  const expectColumnName = async (columnName: string) => {
    expect(
      (
        (await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'domain_events';
`)) as any
      ).rows,
    ).toEqual([{ column_name: columnName }]);
  };
});
