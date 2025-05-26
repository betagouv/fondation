import { NestApplication } from '@nestjs/core';
import { asc } from 'drizzle-orm';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { Gender, Magistrat, Role } from 'shared-models';
import { IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI } from 'src/data-administration-context/transparence-xlsx/adapters/primary/nestjs/tokens';
import { transparencesPm } from 'src/data-administration-context/transparence-xlsx/adapters/secondary/gateways/repositories/drizzle/schema';
import { ImportNominationFileFromLocalFileCli } from 'src/data-administration-context/transparence-tsv/business-logic/gateways/providers/import-nominations-from-local-file.cli';
import { NominationFileRead } from 'src/data-administration-context/transparence-tsv/business-logic/models/nomination-file-read';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema';
import {
  dossierDeNominationPm,
  sessionPm,
} from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/schema';
import { reports } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';
import {
  expectedSessionParquet,
  expectedSessionSiège,
  firstRow,
  firstRowRapport,
  reportersMap,
  secondRow,
  secondRowRapport,
  thirdRow,
  thirdRowRapportJules,
  thirdRowRapportMartin,
  transparenceParquet,
  transparenceSiège,
} from './import-nominations-from-local-file.fixtures';

const fileToImportPath = path.resolve(
  __dirname,
  './Nomination files (e2e test data).tsv',
);

describe('Import Nominations from local file', () => {
  let app: NestApplication;
  let db: DrizzleDb;
  let importNominationFileFromLocalFileCli: ImportNominationFileFromLocalFileCli;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    const moduleFixture = await new BaseAppTestingModule(db).compile();
    app = moduleFixture.createNestApplication();

    await app.init();
    await app.listen(defaultApiConfig.port);

    importNominationFileFromLocalFileCli =
      app.get<ImportNominationFileFromLocalFileCli>(
        IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
      );

    await db.insert(users).values([
      {
        id: reportersMap['ROUSSIN Jules'],
        lastName: 'roussin',
        firstName: 'jules',
        email: 'jules.roussin@example.fr',
        password: 'some-password',
        role: Role.MEMBRE_DU_PARQUET,
        gender: Gender.M,
      },
      {
        id: reportersMap['JOSSELIN-MARTEL Martin-Luc'],
        firstName: 'martin-luc',
        lastName: 'josselin-martel',
        email: 'martin-luc@example.fr',
        password: 'some-password',
        role: Role.MEMBRE_DU_SIEGE,
        gender: Gender.M,
      },
    ]);
  });

  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  it('crée les transparences', async () => {
    await importNominationFileFromLocalFileCli.execute(fileToImportPath);
    await setTimeout(1500);

    await expectTransparences(
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        name: transparenceSiège,
        formation: Magistrat.Formation.SIEGE,
        nominationFiles: [
          expectTransparenceNominationFile(1, firstRow),
          expectTransparenceNominationFile(2, secondRow),
        ],
      },
      {
        id: expect.any(String),
        createdAt: expect.any(Date),
        name: transparenceParquet,
        formation: Magistrat.Formation.PARQUET,
        nominationFiles: [expectTransparenceNominationFile(3, thirdRow)],
      },
    );
  });

  it('crée les sessions', async () => {
    await importNominationFileFromLocalFileCli.execute(fileToImportPath);
    await setTimeout(1500);
    await expectSessions(expectedSessionSiège, expectedSessionParquet);
  });

  it('crée les dossiers de nominations', async () => {
    await importNominationFileFromLocalFileCli.execute(fileToImportPath);
    await setTimeout(1500);

    await expectDossiersDeNominations(
      expectedDossierDeNominationFromContent(firstRow),
      expectedDossierDeNominationFromContent(secondRow),
      expectedDossierDeNominationFromContent(thirdRow),
    );
  });

  it('crée les rapports', async () => {
    await importNominationFileFromLocalFileCli.execute(fileToImportPath);
    await setTimeout(1500);
    await expectRapports(
      firstRowRapport,
      secondRowRapport,
      thirdRowRapportJules,
      thirdRowRapportMartin,
    );
  });

  describe('Dossier de nomination existant', () => {
    it.each<{
      testName: string;
      newContentKey: keyof NominationFileRead['content'];
      oldContentValue: NominationFileRead['content'][keyof NominationFileRead['content']];
    }>([
      {
        testName: 'du numéro de dossier',
        newContentKey: 'folderNumber',
        oldContentValue: 100,
      },
      {
        testName: 'des observants',
        newContentKey: 'observers',
        oldContentValue: ['Different Observer'],
      },
    ])(`update $testName`, async ({ newContentKey, oldContentValue }) => {
      const oldContent = { [newContentKey]: oldContentValue };
      await givenUnDossierDeNominationImporté(
        {
          ...firstRow,
          ...oldContent,
        },
        secondRow,
      );

      await importNominationFileFromLocalFileCli.execute(fileToImportPath);
      await setTimeout(1500);

      await expectTransparences(
        {
          id: expect.any(String),
          createdAt: expect.any(Date),
          name: transparenceSiège,
          formation: Magistrat.Formation.SIEGE,
          nominationFiles: [
            expectTransparenceNominationFile(1, firstRow),
            expectTransparenceNominationFile(2, secondRow),
          ],
        },
        {
          id: expect.any(String),
          createdAt: expect.any(Date),
          name: transparenceParquet,
          formation: Magistrat.Formation.PARQUET,
          nominationFiles: [expectTransparenceNominationFile(3, thirdRow)],
        },
      );
      await expectDossiersDeNominations(
        expectedDossierDeNominationFromContent(firstRow),
        expectedDossierDeNominationFromContent(secondRow),
        expectedDossierDeNominationFromContent(thirdRow),
      );
    });

    const givenUnDossierDeNominationImporté = async (
      ...contents: NominationFileRead['content'][]
    ) => {
      const sessionId = '80c2b303-8273-4e9c-8e04-8d5526a85766';
      const transpaDossier1Id = '68489090-d621-49e0-8249-cb75c713640e';
      const transpaDossier2Id = 'a1b0f3d4-5c7e-4b8c-8f6d-9a2e0f3d4b5e';
      const dossier1Id = 'a725b384-f07a-4b19-814e-3610f055ea5c';
      const dossier2Id = 'ec146568-54c4-4436-8df2-e545d7c1414a';

      await db.insert(transparencesPm).values({
        id: sessionId,
        name: transparenceSiège,
        formation: Magistrat.Formation.SIEGE,
        nominationFiles: contents.map((content, index) => ({
          id: index === 0 ? transpaDossier1Id : transpaDossier2Id,
          createdAt: new Date(),
          rowNumber: index + 1,
          content,
        })),
      });

      contents.forEach(async (content, index) => {
        await db
          .insert(dossierDeNominationPm)
          .values(
            dbInsertDossierDeNominationFromContent(
              content,
              index === 0 ? dossier1Id : dossier2Id,
              sessionId,
              index === 0 ? transpaDossier1Id : transpaDossier2Id,
            ),
          );
      });
    };
  });

  const expectTransparences = async (
    ...expectedTransparences: (typeof transparencesPm.$inferSelect)[]
  ) => {
    const transparences = await db.select().from(transparencesPm).execute();
    expect(transparences.length).toBe(expectedTransparences.length);
    expect(transparences).toEqual(expectedTransparences);
  };

  const expectSessions = async (
    ...expectedSessions: (typeof sessionPm.$inferSelect)[]
  ) => {
    const existingSessions = await db
      .select()
      .from(sessionPm)
      .orderBy(sessionPm.name)
      .execute();

    expect(existingSessions.length).toBe(expectedSessions.length);
    expect(existingSessions).toEqual(expectedSessions);
  };

  const expectDossiersDeNominations = async (
    ...expectedDossiers: (typeof dossierDeNominationPm.$inferSelect)[]
  ) => {
    const existingDossiers = await db
      .select()
      .from(dossierDeNominationPm)
      .orderBy(asc(dossierDeNominationPm.createdAt))
      .execute();

    expect(existingDossiers.length).toBe(expectedDossiers.length);
    expect(existingDossiers).toEqual(expect.arrayContaining(expectedDossiers));
  };

  const expectRapports = async (
    ...expectedRapports: (typeof reports.$inferSelect)[]
  ) => {
    const existingRapports = await db.select().from(reports).execute();

    expect(existingRapports.length).toBe(expectedRapports.length);
    expect(existingRapports).toEqual(expect.arrayContaining(expectedRapports));
  };
});

const expectTransparenceNominationFile = (
  rowNumber: number,
  content: NominationFileRead['content'],
) => ({
  id: expect.any(String),
  createdAt: expect.any(String),
  rowNumber,
  content,
});

const expectedDossierDeNominationFromContent = (
  content: NominationFileRead['content'],
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { transparency, reporters, rules, ...dossierContent } = content;
  return {
    id: expect.any(String),
    createdAt: expect.any(Date),
    sessionId: expect.any(String),
    dossierDeNominationImportéId: expect.any(String),
    content: dossierContent,
  };
};

const dbInsertDossierDeNominationFromContent = (
  content: NominationFileRead['content'],
  id: string,
  sessionId: string,
  dossierDeNominationImportéId: string,
): typeof dossierDeNominationPm.$inferInsert => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { transparency, reporters, rules, ...dossierContent } = content;
  return {
    id,
    sessionId,
    dossierDeNominationImportéId,
    content: dossierContent,
  };
};
