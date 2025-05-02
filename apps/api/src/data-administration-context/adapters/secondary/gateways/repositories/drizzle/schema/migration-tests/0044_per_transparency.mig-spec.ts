import { pushSchema } from 'drizzle-kit/api';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { integer, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { Magistrat, Transparency } from 'shared-models';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { getDrizzleMigrationSql } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import { clearDB } from 'test/docker-postgresql-manager';
import { dataAdministrationContextSchema } from '../nomination-file-schema.drizzle';
import { transparencesPm } from '../transparence-pm';
import {
  formationEnum,
  transparencyEnum,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';

const nominationFiles = dataAdministrationContextSchema.table(
  'nomination_files',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    rowNumber: integer('row_number').notNull(),
    content: jsonb('content').notNull(),
  },
);
const prevFirstNominationFileRow: typeof nominationFiles.$inferInsert = {
  id: 'ca1619e2-263d-49b6-b928-6a04ee681138',
  createdAt: new Date(),
  rowNumber: 1,
  content: {
    folderNumber: 2,
    transparency: Transparency.AUTOMNE_2024,
    formation: Magistrat.Formation.SIEGE,
  },
};

const prevSecondNominationFileRow: typeof nominationFiles.$inferInsert = {
  id: 'e8e84c9f-7b2c-46a5-b47f-e1c6e9b80120',
  createdAt: new Date(),
  rowNumber: 3,
  content: {
    folderNumber: 40,
    transparency: Transparency.AUTOMNE_2024,
    formation: Magistrat.Formation.PARQUET,
  },
};

const prevOtherTransparencyNominationFileRow: typeof nominationFiles.$inferInsert =
  {
    id: '258e2a60-a6aa-4a25-b4f2-e4a9194dd980',
    createdAt: new Date(),
    rowNumber: 3,
    content: {
      folderNumber: 40,
      transparency: Transparency.DU_03_MARS_2025,
      formation: Magistrat.Formation.SIEGE,
    },
  };

const schema = {
  nominationFiles,
  transparencyEnum,
  formationEnum,
};

const migrationNumber = 44;

describe(`migration 00${migrationNumber}`, () => {
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
    await givenSomeNominationFiles();
    await db.execute(getDrizzleMigrationSql(migrationNumber));
    await expectTransparences();
  });

  const givenSomeNominationFiles = async () => {
    const nominationFilesDb = [
      prevFirstNominationFileRow,
      prevSecondNominationFileRow,
      prevOtherTransparencyNominationFileRow,
    ];

    for (const nominationFileDb of nominationFilesDb) {
      await db.insert(nominationFiles).values(nominationFileDb).execute();
    }
  };

  const expectTransparences = async () => {
    expect(
      await db
        .select()
        .from(transparencesPm)
        .orderBy(transparencesPm.createdAt)
        .execute(),
    ).toEqual<(typeof transparencesPm.$inferSelect)[]>([
      {
        id: Transparency.AUTOMNE_2024,
        createdAt: expect.any(Date),
        formations: [Magistrat.Formation.PARQUET, Magistrat.Formation.SIEGE],
        nominationFiles: [
          {
            id: prevFirstNominationFileRow.id,
            createdAt: expect.any(String),
            rowNumber: prevFirstNominationFileRow.rowNumber,
            content: {
              formation: (prevFirstNominationFileRow.content as any).formation,
              folderNumber: (prevFirstNominationFileRow.content as any)
                .folderNumber,
            },
          },
          {
            id: prevSecondNominationFileRow.id,
            createdAt: expect.any(String),
            rowNumber: prevSecondNominationFileRow.rowNumber,
            content: {
              formation: (prevSecondNominationFileRow.content as any).formation,
              folderNumber: (prevSecondNominationFileRow.content as any)
                .folderNumber,
            },
          },
        ],
      },
      {
        id: Transparency.DU_03_MARS_2025,
        createdAt: expect.any(Date),
        formations: [Magistrat.Formation.SIEGE],
        nominationFiles: [
          {
            id: prevOtherTransparencyNominationFileRow.id,
            createdAt: expect.any(String),
            rowNumber: prevOtherTransparencyNominationFileRow.rowNumber,
            content: {
              formation: (prevOtherTransparencyNominationFileRow.content as any)
                .formation,
              folderNumber: (
                prevOtherTransparencyNominationFileRow.content as any
              ).folderNumber,
            },
          },
        ],
      },
    ]);
  };
});
