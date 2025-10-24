import { pushSchema } from 'drizzle-kit/api';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { jsonb, uuid } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { dataAdministrationContextSchema } from 'src/modules/framework/drizzle/schemas/data-administration-context.schema';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import { clearDB } from 'test/docker-postgresql-manager';

const nominationFiles = dataAdministrationContextSchema.table(
  'nomination_files',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    content: jsonb('content').notNull(),
  },
);
const nominationFileRow: typeof nominationFiles.$inferInsert = {
  id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
  content: {},
};
const schema = {
  nominationFiles: nominationFiles,
};

describe('Data administration context - migration 0009', () => {
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

  it('adds a null value to content observers', async () => {
    await givenANominationFile();
    await db.execute(getDrizzleMigrationSql(9));
    await expectNominationFileWithContent({ observers: null });
  });

  const givenANominationFile = async () => {
    await db.insert(nominationFiles).values(nominationFileRow).execute();
  };

  const expectNominationFileWithContent = async (
    content: (typeof nominationFileRow)['content'],
  ) => {
    expect(await db.select().from(nominationFiles).execute()).toEqual([
      {
        id: nominationFileRow.id,
        content,
      },
    ]);
  };
});
