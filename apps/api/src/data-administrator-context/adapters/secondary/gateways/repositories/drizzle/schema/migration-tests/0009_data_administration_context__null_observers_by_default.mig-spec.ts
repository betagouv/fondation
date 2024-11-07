import { pushSchema } from 'drizzle-kit/api';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { jsonb, uuid } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import { clearDB } from 'test/docker-postgresql-manager';
import { dataAdministrationContextSchema } from '../nomination-file-schema.drizzle';

const previousNominationFiles = dataAdministrationContextSchema.table(
  'nomination_files',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    content: jsonb('content').notNull(),
  },
);
const nominationFileRow: typeof previousNominationFiles.$inferInsert = {
  id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
  content: {},
};
const schema = {
  nominationFiles: previousNominationFiles,
};

describe('Data administration context - migration 0009', () => {
  const pool = new Pool(drizzleConfigForTest);
  const db = drizzle({
    client: pool,
    schema: schema,
    casing: 'snake_case',
  });

  beforeAll(async () => {
    await db.execute(sql`CREATE SCHEMA data_administration_context;`);
  });

  beforeEach(async () => {
    const { apply } = await pushSchema(schema, db as unknown as NodePgDatabase);
    await apply();
    await givenANominationFile();
  });

  afterEach(async () => {
    await clearDB(db as unknown as NodePgDatabase, [previousNominationFiles]);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('adds a null value to content observers', async () => {
    await db.execute(getDrizzleMigrationSql(9));
    expect(await db.select().from(previousNominationFiles).execute()).toEqual([
      {
        id: nominationFileRow.id,
        content: { observers: null },
      },
    ]);
  });

  const givenANominationFile = async () => {
    await db
      .insert(previousNominationFiles)
      .values(nominationFileRow)
      .execute();
  };
});
