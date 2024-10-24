import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { AppModule } from 'src/app.module';
import { NominationFilesImportedEvent } from 'src/data-administrator-context/business-logic/models/nomination-file-imported.event';
import { NominationFileRead } from 'src/data-administrator-context/business-logic/models/nomination-file-read';
import { reports } from 'src/reporter-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';
import {
  DATE_TIME_PROVIDER,
  DOMAIN_EVENT_REPOSITORY,
  DRIZZLE_DB,
} from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/providers/deterministic-date-provider';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-instance';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/repositories/fake-domain-event-repository';
import { clearDB } from 'test/docker-postgresql-manager';
import { IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI } from '../data-administration-context.module';
import { ImportNominationFileFromLocalFileCli } from './import-nominations-from-local-file.cli';

const fileToImportPath = path.resolve(
  __dirname,
  './Nomination files (e2e test data).tsv',
);

describe('Import Nominations from local file', () => {
  let domainEventRepository: FakeDomainEventRepository;
  let dateTimeProvider: DeterministicDateProvider;
  let app: NestApplication;
  let db: DrizzleDb;
  let importNominationFileFromLocalFileCli: ImportNominationFileFromLocalFileCli;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DRIZZLE_DB)
      .useValue(db)
      .compile();
    app = moduleFixture.createNestApplication();

    await app.init();

    dateTimeProvider = app.get<DeterministicDateProvider>(DATE_TIME_PROVIDER);
    db = app.get<DrizzleDb>(DRIZZLE_DB);
    domainEventRepository = app.get<FakeDomainEventRepository>(
      DOMAIN_EVENT_REPOSITORY,
    );
    importNominationFileFromLocalFileCli =
      app.get<ImportNominationFileFromLocalFileCli>(
        IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
      );
  });

  afterEach(async () => {
    await clearDB(db);
    await db.$client.end();
    await app.close();
  });

  it.only('informs about an imported file', async () => {
    await importNominationFileFromLocalFileCli.execute(fileToImportPath);

    expectEvents(
      new NominationFilesImportedEvent(
        expect.any(String),
        {
          contents: getExpectedContents(),
        },
        expect.any(Date),
      ),
    );
  });

  it('creates reports found in the imported file', async () => {
    await importNominationFileFromLocalFileCli.execute(fileToImportPath);

    await setTimeout(1000);

    expect(await db.select().from(reports).execute()).toEqual<
      NominationFileReport[]
    >([new ReportBuilder().build()]);
  });

  const expectEvents = async (...events: NominationFilesImportedEvent[]) =>
    expect(domainEventRepository.events).toEqual(events);
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
