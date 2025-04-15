import { pushSchema } from 'drizzle-kit/api';
import { desc, sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { text, uuid, varchar } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { identityAndAccessContextSchema } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema/identity-and-access-context-schema.drizzle';
import { reportsContextSchema } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/reports-context-schema.drizzle';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import { clearDB } from 'test/docker-postgresql-manager';

const reports = reportsContextSchema.table('reports', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reporterId: uuid('reporter_id'),
  reporterName: text('reporter_name'),
});

const users = identityAndAccessContextSchema.table('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
});

const firstReport: typeof reports.$inferInsert = {
  id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
  reporterName: 'ELISABETH Rémi',
};
const secondReport: typeof reports.$inferInsert = {
  id: '53492bf1-b48c-4960-a171-87a57657079a',
  reporterName: 'DOE Adele',
};

const firstReportUser: typeof users.$inferInsert = {
  id: 'ad7b3b1b-0b3b-4b3b-8b3b-0b3b3b3b3b3b',
  firstName: 'rémi',
  lastName: 'élisabeth',
};
const secondReportUser: typeof users.$inferInsert = {
  id: '65bfdcb3-048b-4668-9561-b74af5332583',
  firstName: 'adèle',
  lastName: 'doe',
};

const schema = {
  reports,
  users,
};

const migrationNumber = 29;

describe(`Reports context - migration 00${migrationNumber}`, () => {
  const pool = new Pool(drizzleConfigForTest);
  const db = drizzle({
    client: pool,
    schema,
    casing: 'snake_case',
  });

  beforeEach(async () => {
    const { apply } = await pushSchema(schema, db as unknown as NodePgDatabase);
    await apply();
  });

  afterEach(async () => {
    await clearDB(db as unknown as NodePgDatabase);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('removes from reports the reporter names and add reporter ids', async () => {
    await givenSomeReports(firstReport, secondReport);
    await givenSomeUsers(firstReportUser, secondReportUser);

    await db.execute(getDrizzleMigrationSql(migrationNumber));
    await expectReports(
      {
        id: firstReport.id!,
        reporterId: firstReportUser.id!,
      },
      {
        id: secondReport.id!,
        reporterId: secondReportUser.id!,
      },
    );
  });

  const givenSomeUsers = async (
    ...someUsers: (typeof users.$inferInsert)[]
  ) => {
    await db.insert(users).values(someUsers).execute();
  };

  const givenSomeReports = async (
    ...someReports: (typeof reports.$inferInsert)[]
  ) => {
    await db.insert(reports).values(someReports).execute();
  };

  const expectReports = async (
    ...expectedReports: { id: string; reporterId: string }[]
  ) => {
    expect(
      await db
        .select({
          id: reports.id,
          reporterId: reports.reporterId,
        })
        .from(reports)
        .orderBy(desc(reports.id))
        .execute(),
    ).toEqual(expectedReports);
  };
});
