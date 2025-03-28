import { pushSchema } from 'drizzle-kit/api';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { jsonb, uuid } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import { clearDB } from 'test/docker-postgresql-manager';
import { dataAdministrationContextSchema } from '../nomination-file-schema.drizzle';

const nominationFiles = dataAdministrationContextSchema.table(
  'nomination_files',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    content: jsonb('content').notNull(),
  },
);
const prevNominationFileRow: typeof nominationFiles.$inferInsert = {
  id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
  content: {
    someField: 'some value',
    state: 'OPINION_RETURNED',
  },
};
const schema = {
  nominationFiles,
};

const migrationNumber = 32;

describe(`Data administration context - migration 00${migrationNumber}`, () => {
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
    await clearDB(db as unknown as NodePgDatabase);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it("removes the state from content's JSON binary", async () => {
    await givenANominationFile();
    await db.execute(getDrizzleMigrationSql(migrationNumber));
    await expectNominationFileWithContent({
      someField: 'some value',
    });
  });

  const givenANominationFile = async () => {
    await db.insert(nominationFiles).values(prevNominationFileRow).execute();
  };

  const expectNominationFileWithContent = async (content: any) => {
    expect(await db.select().from(nominationFiles).execute()).toEqual([
      {
        id: prevNominationFileRow.id,
        content,
      },
    ]);
  };
});
