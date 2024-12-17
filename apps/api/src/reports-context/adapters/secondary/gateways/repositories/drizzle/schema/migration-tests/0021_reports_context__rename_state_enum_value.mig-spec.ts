import { pushSchema } from 'drizzle-kit/api';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { pgEnum, uuid } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { reportsContextSchema } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/reports-context-schema.drizzle';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import { clearDB } from 'test/docker-postgresql-manager';

enum OldState {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_TO_SUPPORT = 'READY_TO_SUPPORT',
  OPINION_RETURNED = 'OPINION_RETURNED',
}

enum NewState {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_TO_SUPPORT = 'READY_TO_SUPPORT',
  SUPPORTED = 'SUPPORTED',
}

const statePgEnum = pgEnum(
  'report_state',
  Object.values(OldState) as [OldState, ...OldState[]],
);
const reports = reportsContextSchema.table('reports', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  state: statePgEnum('state').notNull().default(OldState.NEW),
});

const reportRow: typeof reports.$inferInsert = {
  id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
  state: OldState.OPINION_RETURNED,
};
const unchangedReportRow: typeof reports.$inferInsert = {
  id: '53492bf1-b48c-4960-a171-87a57657079a',
  state: OldState.IN_PROGRESS,
};

const schema = {
  statePgEnum,
  reports,
};

const migrationNumber = 21;

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

  it("rename the report state enum's value 'OPINION_RETURNED' to 'SUPPORTED'", async () => {
    await givenSomeReports();
    await db.execute(getDrizzleMigrationSql(migrationNumber));
    await expectReportsWithStateChanged(NewState.SUPPORTED);
  });

  const givenSomeReports = async () => {
    await db.insert(reports).values([reportRow, unchangedReportRow]).execute();
  };

  const expectReportsWithStateChanged = async (newState: NewState) => {
    expect(await db.select().from(reports).execute()).toEqual([
      {
        id: reportRow.id,
        state: newState,
      },
      unchangedReportRow,
    ]);
  };
});
