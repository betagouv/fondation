import { eq } from 'drizzle-orm';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { AppModule } from 'src/app.module';
import { IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI } from 'src/data-administrator-context/adapters/primary/nestjs/data-administration-context.module';
import { nominationFiles } from 'src/data-administrator-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { ImportNominationFileFromLocalFileCli } from 'src/data-administrator-context/business-logic/gateways/providers/import-nominations-from-local-file.cli';
import { NominationFileRead } from 'src/data-administrator-context/business-logic/models/nomination-file-read';
import {
  reportRules,
  reports,
} from 'src/reporter-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-instance';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';

const fileToImportPath = path.resolve(
  __dirname,
  './Nomination files (e2e test data).tsv',
);

describe('Import Nominations from local file', () => {
  let app: NestApplication;
  let importNominationFileFromLocalFileCli: ImportNominationFileFromLocalFileCli;

  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DRIZZLE_DB)
      .useValue(db)
      .compile();
    app = moduleFixture.createNestApplication();

    await app.init();

    importNominationFileFromLocalFileCli =
      app.get<ImportNominationFileFromLocalFileCli>(
        IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
      );
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await db.$client.end();
  });

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

    await expectReports(
      ...getExpectedContents()
        .map((content) =>
          content.reporters?.length
            ? content.reporters.map((reporterName) =>
                getReportPm({ ...content, reporterName }),
              )
            : [getReportPm({ ...content, reporterName: null })],
        )
        .flat(),
    );
  });

  describe('when a nomination file is already imported', () => {
    const nominationFileId = 'a725b384-f07a-4b19-814e-3610f055ea5c';
    const reportId = '8d9fc5f2-7254-4d04-b99a-e4d15fefee29';
    const transferTimeRuleId = 'b820be91-343f-478a-9e7e-58fe178e3ed1';

    it.only('updates the transfer time rule', async () => {
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
      await db.insert(reports).values({
        id: reportId,
        nominationFileId: nominationFileId,
        createdAt: new Date(),
        state: NominationFile.ReportState.NEW,
        dueDate: DateOnly.fromJson(firstTsvContent.dueDate!).toDbString(),
        formation: firstTsvContent.formation,
        name: firstTsvContent.name,
        reporterName: firstTsvContent.reporters![0]!,
        transparency: firstTsvContent.transparency,
        grade: firstTsvContent.grade,
        currentPosition: firstTsvContent.currentPosition,
        targettedPosition: firstTsvContent.targettedPosition,
        rank: firstTsvContent.rank,
        birthDate: DateOnly.fromJson(firstTsvContent.birthDate).toDbString(),
        biography: firstTsvContent.biography,
        comment: null,
      });
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

      await expectNominationFiles(
        ...getExpectedContents().map((content, index) =>
          index === 0
            ? {
                id: nominationFileId,
                createdAt: expect.any(Date),
                rowNumber: 1,
                content: {
                  ...content,
                  rules: {
                    ...content.rules,
                    management: {
                      ...content.rules.management,
                      TRANSFER_TIME: !previousTransferTimePreValidated,
                    },
                  },
                },
              }
            : {
                id: expect.any(String),
                createdAt: expect.any(Date),
                rowNumber: expect.any(Number),
                content,
              },
        ),
      );

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

  const expectReports = async (
    ...expectedReports: (typeof reports.$inferSelect)[]
  ) => {
    const reportsPm = await db.select().from(reports).execute();
    expect(reportsPm.length).toBe(expectedReports.length);
    expect(reportsPm).toEqual(expect.arrayContaining(expectedReports));
  };

  const getReportPm = (
    content: NominationFileRead['content'] & { reporterName: string | null },
  ): typeof reports.$inferSelect => ({
    id: expect.any(String),
    nominationFileId: expect.any(String),
    createdAt: expect.any(Date),
    state: content.state,
    dueDate: content.dueDate
      ? DateOnly.fromJson(content.dueDate).toDbString()
      : null,
    formation: content.formation,
    name: content.name,
    reporterName: content.reporterName,
    transparency: content.transparency,
    grade: content.grade,
    currentPosition: content.currentPosition,
    targettedPosition: content.targettedPosition,
    rank: content.rank,
    birthDate: DateOnly.fromJson(content.birthDate).toDbString(),
    biography: content.biography,
    comment: null,
  });
});

function getExpectedContents(): NominationFileRead['content'][] {
  return [
    {
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
      state: NominationFile.ReportState.NEW,
      targettedPosition:
        "Premier vice-président chargé de l'instruction TJ MARSEILLE - I",
      transparency: Transparency.AUTOMNE_2024,
    },
    {
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
      state: NominationFile.ReportState.OPINION_RETURNED,
      targettedPosition: 'Premier vice-président adjoint TJ RENNES - I',
      transparency: Transparency.AUTOMNE_2024,
    },
    {
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
      state: NominationFile.ReportState.NEW,
      targettedPosition:
        "Premier substitut à l'administration centrale du ministère de la justice AC PARIS - I",
      transparency: Transparency.MARCH_2025,
    },
  ];
}
