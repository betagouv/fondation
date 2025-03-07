import { NestApplication } from '@nestjs/core';
import { asc, eq } from 'drizzle-orm';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI } from 'src/data-administration-context/adapters/primary/nestjs/data-administration-context.module';
import { nominationFiles } from 'src/data-administration-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { ImportNominationFileFromLocalFileCli } from 'src/data-administration-context/business-logic/gateways/providers/import-nominations-from-local-file.cli';
import { NominationFileRead } from 'src/data-administration-context/business-logic/models/nomination-file-read';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { Gender } from 'src/identity-and-access-context/business-logic/models/gender';
import { Role } from 'src/identity-and-access-context/business-logic/models/role';
import {
  reportRules,
  reports,
} from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';

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

  afterEach(() => app.close());
  afterAll(() => db.$client.end());

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

    await expectAllReports();
  });

  describe('when a nomination file is already imported', () => {
    const nominationFileId = 'a725b384-f07a-4b19-814e-3610f055ea5c';
    const reportId = '8d9fc5f2-7254-4d04-b99a-e4d15fefee29';
    const transferTimeRuleId = 'b820be91-343f-478a-9e7e-58fe178e3ed1';

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

    it('updates the transfer time rule', async () => {
      const firstTsvContent = getExpectedContents()[0]!;
      const previousTransferTimePreValidated = false;
      await db.insert(nominationFiles).values({
        id: nominationFileId,
        rowNumber: 1,
        content: {
          ...firstTsvContent,
          rules: {
            ...firstTsvContent.rules,
            management: {
              ...firstTsvContent.rules.management,
              TRANSFER_TIME: previousTransferTimePreValidated,
            },
          },
        },
      });
      await givenAReportPm(
        firstTsvContent,
        reportersMap[firstTsvContent.reporters![0]!]!,
      );

      await db.insert(reportRules).values({
        id: transferTimeRuleId,
        reportId,
        ruleGroup: NominationFile.RuleGroup.MANAGEMENT,
        ruleName: NominationFile.ManagementRule.TRANSFER_TIME,
        preValidated: previousTransferTimePreValidated,
        validated: false,
        comment: 'some comment',
      });

      await importNominationFileFromLocalFileCli.execute(fileToImportPath);
      await setTimeout(1500);

      await expectNominationFilesWithFirstOneChanged((firstContent) => ({
        rules: {
          ...firstContent.rules,
          management: {
            ...firstContent.rules.management,
            TRANSFER_TIME: !previousTransferTimePreValidated,
          },
        },
      }));

      await expectReportRule({
        id: transferTimeRuleId,
        createdAt: expect.any(Date),
        reportId,
        ruleGroup: NominationFile.RuleGroup.MANAGEMENT,
        ruleName: NominationFile.ManagementRule.TRANSFER_TIME,
        preValidated: !previousTransferTimePreValidated,
        validated: false,
        comment: 'some comment',
      });
    });

    const givenAReportPm = async (
      content: Omit<NominationFileRead['content'], 'reporters'>,
      reporterId: string,
    ) => {
      await db.insert(reports).values({
        ...content,
        id: reportId,
        nominationFileId,
        reporterId,
        createdAt: new Date(),
        dueDate: DateOnly.fromJson(content.dueDate!).toDbString(),
        birthDate: DateOnly.fromJson(content.birthDate).toDbString(),
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

  const expectReportRule = async (
    expectedReportRule: typeof reportRules.$inferSelect,
  ) => {
    const reportRulesPm = await db
      .select()
      .from(reportRules)
      .where(eq(reportRules.id, expectedReportRule.id))
      .execute();
    expect(reportRulesPm).toEqual([expectedReportRule]);
  };

  const expectAllReports = async (
    moreFirstContent?: Partial<NominationFileRead['content']>,
  ) => {
    const allReports = getExpectedContents()
      .map((content, index) =>
        content.reporters?.length
          ? content.reporters.map((reporterName) =>
              getReportPm({
                ...content,
                reporterName,
                ...(index === 0 && moreFirstContent),
              }),
            )
          : [
              getReportPm({
                ...content,
                reporterName: null,
                ...(index === 0 && moreFirstContent),
              }),
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
  ): typeof reports.$inferSelect => ({
    id: expect.any(String),
    nominationFileId: expect.any(String),
    createdAt: expect.any(Date),
    reporterId: reportersMap[content.reporterName!]!,
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

function getExpectedContents(): NominationFileRead['content'][] {
  return [
    {
      folderNumber: 1,
      biography:
        '- blabla julien pierre   - blabla.   - blabla BEAUVAIS (1er grade), 11/10/2013 (Ins.11/10/2013).   - VPLILLES 25/06/2014 (Ins.03/09/2018).',
      birthDate: {
        day: 11,
        month: 10,
        year: 1979,
      },
      currentPosition: 'Vice-président TJ BEAUVAIS',
      dueDate: {
        day: 10,
        month: 11,
        year: 2024,
      },
      formation: Magistrat.Formation.SIEGE,
      grade: Magistrat.Grade.I,
      name: 'Julien Pierre',
      rank: '(1 sur une liste de 4)',
      reporters: ['ROUSSIN Jules'],
      observers: [
        'LUCIEN MARC VPI TJ NANTES\n(2 sur une liste de 4)',
        'DAMIEN JEAN\n(2 sur une liste de 100)\nProcureur TJ de Marseilles',
      ],
      rules: {
        management: {
          TRANSFER_TIME: true,
          CASSATION_COURT_NOMINATION: false,
          GETTING_FIRST_GRADE: false,
          GETTING_GRADE_HH: false,
          GETTING_GRADE_IN_PLACE: false,
          JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: false,
          OVERSEAS_TO_OVERSEAS: false,
          PROFILED_POSITION: false,
        },
        statutory: {
          GRADE_ON_SITE_AFTER_7_YEARS: true,
          GRADE_REGISTRATION: true,
          HH_WITHOUT_2_FIRST_GRADE_POSITIONS: true,
          JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION: true,
          LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO: true,
          MINISTER_CABINET: true,
          MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS: true,
        },
        qualitative: {
          CONFLICT_OF_INTEREST_PRE_MAGISTRATURE: false,
          CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION: false,
          DISCIPLINARY_ELEMENTS: false,
          EVALUATIONS: false,
          HH_NOMINATION_CONDITIONS: false,
        },
      },
      targettedPosition:
        "Premier vice-président chargé de l'instruction TJ MARSEILLE - I",
      transparency: Transparency.AUTOMNE_2024,
    },
    {
      folderNumber: 2,
      biography:
        '- blabla dupont marcel   - blabla.   - blabla BEAUVAIS (1er grade), 11/10/2013 (Ins.11/10/2013).   - VPLILLES 25/06/2014 (Ins.03/09/2018).',
      birthDate: {
        day: 16,
        month: 1,
        year: 1981,
      },
      currentPosition:
        "Premier substitut à l'administration centrale du ministère de la justice AC MARSEILLE",
      dueDate: {
        day: 1,
        month: 12,
        year: 2025,
      },
      formation: Magistrat.Formation.SIEGE,
      grade: Magistrat.Grade.I,
      name: 'Dupont Marcel',
      rank: '(1 sur une liste de 1)',
      reporters: ['ROUSSIN Jules'],
      observers: null,
      rules: {
        management: {
          CASSATION_COURT_NOMINATION: true,
          GETTING_FIRST_GRADE: false,
          GETTING_GRADE_HH: false,
          GETTING_GRADE_IN_PLACE: false,
          JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: false,
          OVERSEAS_TO_OVERSEAS: false,
          PROFILED_POSITION: true,
          TRANSFER_TIME: true,
        },
        qualitative: {
          CONFLICT_OF_INTEREST_PRE_MAGISTRATURE: false,
          CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION: false,
          DISCIPLINARY_ELEMENTS: false,
          EVALUATIONS: true,
          HH_NOMINATION_CONDITIONS: false,
        },
        statutory: {
          GRADE_ON_SITE_AFTER_7_YEARS: false,
          GRADE_REGISTRATION: false,
          HH_WITHOUT_2_FIRST_GRADE_POSITIONS: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION: false,
          LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO: true,
          MINISTER_CABINET: false,
          MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS: false,
        },
      },
      targettedPosition: 'Premier vice-président adjoint TJ RENNES - I',
      transparency: Transparency.AUTOMNE_2024,
    },
    {
      folderNumber: 5,
      biography:
        '- blabla brusse émilien   - blabla.   - blabla BEAUVAIS (1er grade), 11/10/2013 (Ins.11/10/2013).   - VPLILLES 25/06/2014 (Ins.03/09/2018).',
      birthDate: {
        day: 24,
        month: 2,
        year: 1987,
      },
      currentPosition: 'DETACHEMENT',
      dueDate: null,
      formation: Magistrat.Formation.PARQUET,
      grade: Magistrat.Grade.I,
      name: 'Brusse Emilien Ep. François',
      rank: '1 sur une liste de 12)',
      reporters: ['ROUSSIN Jules', 'JOSSELIN-MARTEL Martin-Luc'],
      observers: ['LUDIVINE Jeanne'],
      rules: {
        management: {
          CASSATION_COURT_NOMINATION: true,
          GETTING_FIRST_GRADE: false,
          GETTING_GRADE_HH: false,
          GETTING_GRADE_IN_PLACE: false,
          JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: false,
          OVERSEAS_TO_OVERSEAS: false,
          PROFILED_POSITION: true,
          TRANSFER_TIME: false,
        },
        qualitative: {
          CONFLICT_OF_INTEREST_PRE_MAGISTRATURE: false,
          CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION: false,
          DISCIPLINARY_ELEMENTS: false,
          EVALUATIONS: false,
          HH_NOMINATION_CONDITIONS: false,
        },
        statutory: {
          GRADE_ON_SITE_AFTER_7_YEARS: false,
          GRADE_REGISTRATION: false,
          HH_WITHOUT_2_FIRST_GRADE_POSITIONS: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION: false,
          LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO: true,
          MINISTER_CABINET: true,
          MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS: false,
        },
      },
      targettedPosition:
        "Premier substitut à l'administration centrale du ministère de la justice AC PARIS - I",
      transparency: Transparency.GRANDE_TRANSPA_DU_21_MARS_2025,
    },
  ];
}
