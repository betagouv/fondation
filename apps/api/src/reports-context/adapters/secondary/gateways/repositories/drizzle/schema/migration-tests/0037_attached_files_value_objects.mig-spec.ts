import { pushSchema } from 'drizzle-kit/api';
import { desc, sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  jsonb,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { reportsContextSchema } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/reports-context-schema.drizzle';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import { clearDB } from 'test/docker-postgresql-manager';

const oldReportsPm = reportsContextSchema.table('reports', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
});
const oldAttachedFilesPm = reportsContextSchema.table(
  'attached_files',
  {
    createdAt: timestamp('created_at').notNull().defaultNow(),
    reportId: uuid('report_id').notNull(),
    name: varchar('name').notNull(),
    fileId: varchar('file_id').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.reportId, table.name] }),
  }),
);
const newReportsPm = reportsContextSchema.table('reports', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  attachedFiles: jsonb('attached_files'),
});

const firstReport: typeof oldReportsPm.$inferInsert = {
  id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
};
const secondReport: typeof oldReportsPm.$inferInsert = {
  id: '53492bf1-b48c-4960-a171-87a57657079a',
};
const thirdReport: typeof oldReportsPm.$inferInsert = {
  id: '53492bf1-b48c-4960-a171-87a57657079b',
};

const firstReportAttachedFile1: typeof oldAttachedFilesPm.$inferInsert = {
  fileId: 'ca1619e2-263d-49b6-b928-6a04ee681138',
  name: 'file1.pdf',
  reportId: firstReport.id!,
};
const firstReportAttachedFile2: typeof oldAttachedFilesPm.$inferInsert = {
  fileId: 'ca1619e2-263d-49b6-b928-6a04ee681138',
  name: 'file2.pdf',
  reportId: firstReport.id!,
};

const secondReportAttachedFile: typeof oldAttachedFilesPm.$inferInsert = {
  fileId: '65bfdcb3-048b-4668-9561-b74af5332583',
  name: 'second-report-file.pdf',
  reportId: secondReport.id!,
};

const schema = {
  oldReportsSchema: oldReportsPm,
  oldAttachedFiles: oldAttachedFilesPm,
};

const migrationNumber = 37;

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

  it('migrate attached files on their reports', async () => {
    await givenSomeReports(firstReport, secondReport, thirdReport);
    await givenSomeAttachedFiles(
      secondReportAttachedFile,
      firstReportAttachedFile1,
      firstReportAttachedFile2,
    );

    await db.execute(getDrizzleMigrationSql(migrationNumber));

    await expectReports(
      {
        id: thirdReport.id!,
        attachedFiles: null,
      },
      {
        id: firstReport.id!,
        attachedFiles: [
          {
            fileId: firstReportAttachedFile1.fileId,
            name: firstReportAttachedFile1.name,
            usage: 'ATTACHMENT',
          },
          {
            fileId: firstReportAttachedFile2.fileId,
            name: firstReportAttachedFile2.name,
            usage: 'ATTACHMENT',
          },
        ],
      },
      {
        id: secondReport.id!,
        attachedFiles: [
          {
            fileId: secondReportAttachedFile.fileId,
            name: secondReportAttachedFile.name,
            usage: 'ATTACHMENT',
          },
        ],
      },
    );
  });

  const givenSomeAttachedFiles = async (
    ...someAttachedFiles: (typeof oldAttachedFilesPm.$inferInsert)[]
  ) => {
    await db.insert(oldAttachedFilesPm).values(someAttachedFiles).execute();
  };

  const givenSomeReports = async (
    ...someReports: (typeof oldReportsPm.$inferInsert)[]
  ) => {
    await db.insert(oldReportsPm).values(someReports).execute();
  };

  const expectReports = async (
    ...expectedReports: (typeof newReportsPm.$inferSelect)[]
  ) => {
    expect(
      await db
        .select()
        .from(newReportsPm)
        .orderBy(desc(newReportsPm.attachedFiles))
        .execute(),
    ).toEqual(expectedReports);
  };
});
