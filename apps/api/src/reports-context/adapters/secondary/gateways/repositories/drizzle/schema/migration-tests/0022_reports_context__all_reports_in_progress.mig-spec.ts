import { pushSchema } from 'drizzle-kit/api';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { pgEnum, uuid } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { reportsContextSchema } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/reports-context-schema.drizzle';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import { clearDB } from 'test/docker-postgresql-manager';

enum State {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_TO_SUPPORT = 'READY_TO_SUPPORT',
  SUPPORTED = 'SUPPORTED',
}

const statePgEnum = pgEnum(
  'report_state',
  Object.values(State) as [State, ...State[]],
);
const reports = reportsContextSchema.table('reports', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  state: statePgEnum('state').notNull().default(State.NEW),
});

const reportRow: typeof reports.$inferInsert = {
  id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
  state: State.NEW,
};
const unchangedReportRow: typeof reports.$inferInsert = {
  id: '53492bf1-b48c-4960-a171-87a57657079a',
  state: State.SUPPORTED,
};

const schema = {
  statePgEnum,
  reports,
};

const migrationNumber = 22;

describe(`Reports context - migration 00${migrationNumber}`, () => {
  const pool = new Pool(drizzleConfigForTest);
  const db = drizzle({
    client: pool,
    schema: schema,
    casing: 'snake_case',
  });

  beforeEach(async () => {
    const { apply } = await pushSchema(schema, db as unknown as NodePgDatabase);
    await apply();
  });

  afterEach(async () => {
    await clearDB(db as unknown as NodePgDatabase, [reports]);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it("make all new reports have 'IN_PROGRESS' state because state managed by users is a new feature", async () => {
    await givenSomeReports();
    await db.execute(getDrizzleMigrationSql(migrationNumber));
    await expectReportsWithStateChanged(State.IN_PROGRESS);
  });

  const givenSomeReports = async () => {
    await db.insert(reports).values([reportRow, unchangedReportRow]).execute();
  };

  const expectReportsWithStateChanged = async (newState: State) => {
    expect(await db.select().from(reports).execute()).toEqual([
      unchangedReportRow,
      {
        id: reportRow.id,
        state: newState,
      },
    ]);
  };
});
