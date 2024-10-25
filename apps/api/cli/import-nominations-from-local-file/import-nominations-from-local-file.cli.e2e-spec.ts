import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { AppModule } from 'src/app.module';
import { nominationFiles } from 'src/data-administrator-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { NominationFileRead } from 'src/data-administrator-context/business-logic/models/nomination-file-read';
import { reports } from 'src/reporter-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-instance';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';
import { IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI } from 'src/data-administrator-context/adapters/primary/nestjs/data-administration-context.module';
import { ImportNominationFileFromLocalFileCli } from 'src/data-administrator-context/business-logic/gateways/providers/import-nominations-from-local-file.cli';

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

    await setTimeout(1000);

    expectReports(
      ...getExpectedContents().map((content) => ({
        id: expect.any(String),
        createdAt: expect.any(Date),
        state: content.state,
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
      })),
    );

    expectNominationFiles(
      ...getExpectedContents().map((content) => ({
        id: expect.any(String),
        createdAt: expect.any(Date),
        reportId: expect.any(String),
        rowNumber: expect.any(Number),
        content: content,
      })),
    );
  });

  const expectReports = async (
    ...expectedReports: (typeof reports.$inferSelect)[]
  ) => {
    expect(await db.select().from(reports).execute()).toIncludeAllMembers<
      typeof reports.$inferSelect
    >(expectedReports);
  };

  const expectNominationFiles = async (
    ...expectedNominationFiles: (typeof nominationFiles.$inferSelect)[]
  ) => {
    expect(
      await db.select().from(nominationFiles).execute(),
    ).toIncludeAllMembers<typeof nominationFiles.$inferSelect>(
      expectedNominationFiles,
    );
  };
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
      reporter: 'ROUSSIN Jules',
      rules: {
        management: {
          CASSATION_COURT_NOMINATION: true,
          GETTING_FIRST_GRADE: false,
          GETTING_GRADE_HH: false,
          GETTING_GRADE_IN_PLACE: false,
          JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: false,
          OVERSEAS_TO_OVERSEAS: false,
          PROFILED_POSITION: false,
          TRANSFER_TIME: false,
        },
        qualitative: {
          CONFLICT_OF_INTEREST_PRE_MAGISTRATURE: true,
          CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION: true,
          DISCIPLINARY_ELEMENTS: true,
          EVALUATIONS: true,
          HH_NOMINATION_CONDITIONS: true,
        },
        statutory: {
          GRADE_ON_SITE_AFTER_7_YEARS: false,
          GRADE_REGISTRATION: false,
          HH_WITHOUT_2_FIRST_GRADE_POSITIONS: false,
          JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION: false,
          LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO: false,
          MINISTER_CABINET: false,
          MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS: false,
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
      reporter: 'ROUSSIN Jules',
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
      reporter: 'ROUSSIN Jules JOSSELIN Martin-Luc',
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
