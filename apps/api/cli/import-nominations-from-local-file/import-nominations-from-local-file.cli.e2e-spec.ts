import { NestApplication } from '@nestjs/core';
import { asc } from 'drizzle-orm';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { Gender, NominationFile, Role } from 'shared-models';
import { IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI } from 'src/data-administration-context/adapters/primary/nestjs/tokens';
import { nominationFiles } from 'src/data-administration-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { ImportNominationFileFromLocalFileCli } from 'src/data-administration-context/business-logic/gateways/providers/import-nominations-from-local-file.cli';
import { NominationFileRead } from 'src/data-administration-context/business-logic/models/nomination-file-read';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { reports } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';
import { getExpectedContents } from './import-nominations-from-local-file.fixtures';

const fileToImportPath = path.resolve(
  __dirname,
  './Nomination files (e2e test data).tsv',
);

const reportersMap: Record<string, string> = {
  'ROUSSIN Jules': 'bc2588b6-fcd9-46d1-9baf-306dd0704015',
  'JOSSELIN-MARTEL Martin-Luc': 'bb8b1056-9573-4b9d-8161-d8e2b8fee462',
};

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

  it('creates reports found in the imported file', async () => {
    await importNominationFileFromLocalFileCli.execute(fileToImportPath);
    await setTimeout(1500);

    await expectNominationFiles(
      ...getExpectedContents().map((content) => ({
        id: expect.any(String),
        createdAt: expect.any(Date),
        rowNumber: expect.any(Number),
        content,
      })),
    );

    await expectAllReports(undefined, { version: 1 });
  });

  describe('when a nomination file is already imported', () => {
    const nominationFileId = 'a725b384-f07a-4b19-814e-3610f055ea5c';
    const reportId = '8d9fc5f2-7254-4d04-b99a-e4d15fefee29';

    it.each<{
      testName: string;
      newContentKey: keyof NominationFileRead['content'];
      oldContentValue: NominationFileRead['content'][keyof NominationFileRead['content']];
    }>([
      {
        testName: 'the folder number',
        newContentKey: 'folderNumber',
        oldContentValue: 100,
      },
      {
        testName: 'the observers',
        newContentKey: 'observers',
        oldContentValue: ['Different Observer'],
      },
    ])(`updates $testName`, async ({ newContentKey, oldContentValue }) => {
      const firstTsvContent = getExpectedContents()[0]!;
      const oldContent = { [newContentKey]: oldContentValue };
      await db.insert(nominationFiles).values({
        id: nominationFileId,
        rowNumber: 1,
        content: { ...firstTsvContent, ...oldContent },
      });
      await givenAReportPm(
        {
          ...firstTsvContent,
          ...oldContent,
        },
        reportersMap[firstTsvContent.reporters![0]!]!,
      );

      await importNominationFileFromLocalFileCli.execute(fileToImportPath);
      await setTimeout(1500);

      await expectNominationFilesWithFirstOneChanged(() => ({
        [newContentKey]: firstTsvContent[newContentKey],
      }));
      await expectAllReports({
        [newContentKey]: firstTsvContent[newContentKey],
      });
    });

    const givenAReportPm = async (
      content: Omit<NominationFileRead['content'], 'reporters'>,
      reporterId: string,
    ) => {
      await db.insert(reports).values({
        ...content,
        id: reportId,
        dossierDeNominationId: nominationFileId,
        sessionId: 'session-id',
        reporterId,
        createdAt: new Date(),
        comment: null,
      });
    };

    const expectNominationFilesWithFirstOneChanged = async (
      overrideFirstContent: (
        firstContent: NominationFileRead['content'],
      ) => Partial<NominationFileRead['content']>,
    ) => {
      await expectNominationFiles(
        ...getExpectedContents().map((content, index) =>
          index === 0
            ? {
                id: nominationFileId,
                createdAt: expect.any(Date),
                rowNumber: 1,
                content: {
                  ...content,
                  ...overrideFirstContent(content),
                },
              }
            : {
                id: expect.any(String),
                createdAt: expect.any(Date),
                rowNumber: index + 1,
                content,
              },
        ),
      );
    };
  });

  const expectNominationFiles = async (
    ...expectedNominationFiles: (typeof nominationFiles.$inferSelect)[]
  ) => {
    const nominationFilesPm = await db.select().from(nominationFiles).execute();
    expect(nominationFilesPm.length).toBe(expectedNominationFiles.length);
    expect(nominationFilesPm).toEqual(
      expect.arrayContaining(expectedNominationFiles),
    );
  };

  const expectAllReports = async (
    moreFirstContent?: Partial<NominationFileRead['content']>,
    opts?: { version: number },
  ) => {
    const version = opts?.version ?? 2;
    const allReports = getExpectedContents()
      .map((content, index) =>
        content.reporters?.length
          ? content.reporters.map((reporterName) =>
              getReportPm(
                {
                  ...content,
                  reporterName,
                  ...(index === 0 && moreFirstContent),
                },
                index === 0 ? version : 1,
              ),
            )
          : [
              getReportPm(
                {
                  ...content,
                  reporterName: null,
                  ...(index === 0 && moreFirstContent),
                },
                index === 0 ? version : 1,
              ),
            ],
      )
      .flat();
    const reportsPm = await db
      .select()
      .from(reports)
      .orderBy(asc(reports.folderNumber), asc(reports.reporterId))
      .execute();

    expect(reportsPm.length).toBe(allReports.length);
    expect(reportsPm).toEqual([
      allReports[0],
      allReports[1],
      allReports[3],
      allReports[2],
    ]);
  };

  const getReportPm = (
    content: NominationFileRead['content'] & { reporterName: string | null },
    version: number,
  ): typeof reports.$inferSelect => ({
    id: expect.any(String),
    dossierDeNominationId: expect.any(String),
    createdAt: expect.any(Date),
    reporterId: reportersMap[content.reporterName!]!,
    version,
    folderNumber: content.folderNumber,
    state: NominationFile.ReportState.NEW,
    dueDate: content.dueDate
      ? DateOnly.fromJson(content.dueDate).toDbString()
      : null,
    formation: content.formation,
    name: content.name,
    transparency: content.transparency,
    grade: content.grade,
    currentPosition: content.currentPosition,
    targettedPosition: content.targettedPosition,
    rank: content.rank,
    birthDate: DateOnly.fromJson(content.birthDate).toDbString(),
    biography: content.biography,
    comment: null,
    observers: content.observers,
    attachedFiles: null,
  });
});
