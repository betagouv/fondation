import { INestApplication } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { Magistrat, RulesBuilder, Transparency } from 'shared-models';
import {
  GdsTransparenceNominationFilesAddedEvent,
  GdsTransparenceNominationFilesAddedEventPayload,
} from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-added.event';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from 'src/data-administration-context/transparence-tsv/business-logic/models/rules';
import { lucLoïcReporterId } from 'src/data-administration-context/transparence-tsv/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case.fixtures';
import { Avancement } from 'src/data-administration-context/transparence-xlsx/business-logic/models/avancement';
import { MainAppConfigurator } from 'src/main.configurator';
import { GdsTransparenceNouveauxDossiersSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/gds-transparence-nouveaux-dossiers.subscriber';
import {
  DOMAIN_EVENT_REPOSITORY,
  TRANSACTION_PERFORMER,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';

describe('GDS transparence nouveaux dossiers Nest subscriber', () => {
  let app: INestApplication;
  let db: DrizzleDb;
  let handleMock: jest.Mock;
  let transactionPerformer: TransactionPerformer;
  let domainEventRepository: DomainEventRepository;

  beforeAll(async () => {
    jest.restoreAllMocks();

    db = getDrizzleInstance(drizzleConfigForTest);
    handleMock = jest.fn();

    const moduleFixture = await new BaseAppTestingModule(db).moduleFixture
      .overrideProvider(GdsTransparenceNouveauxDossiersSubscriber)
      .useValue({
        handle: handleMock,
      })
      .compile();
    app = new MainAppConfigurator(
      moduleFixture.createNestApplication(),
    ).configure();

    await app.init();

    transactionPerformer = app.get<TransactionPerformer>(TRANSACTION_PERFORMER);
    domainEventRepository = app.get<DomainEventRepository>(
      DOMAIN_EVENT_REPOSITORY,
    );
  });
  beforeEach(async () => await clearDB(db));
  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  it("forward l'évènement au subscriber métier", async () => {
    await transactionPerformer.perform(domainEventRepository.save(event));
    await setTimeout(600);

    expect(handleMock).toHaveBeenCalledWith(payload);
  });
});

class PayloadRules extends RulesBuilder<
  boolean,
  ManagementRule,
  StatutoryRule,
  QualitativeRule
> {
  constructor() {
    super(true, allRulesMapV1);
  }
}

const uneTransparence = Transparency.AUTOMNE_2024;

const dossierDeNominationPayload: GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: 'nouveau-dossier-id',
    content: {
      transparency: uneTransparence,
      biography: 'nouvelle biographie',
      birthDate: {
        day: 1,
        month: 1,
        year: 2000,
      },
      currentPosition: 'nouvelle position actuelle',
      targettedPosition: 'nouvelle position visée',
      dueDate: {
        day: 1,
        month: 1,
        year: 2000,
      },
      folderNumber: 2,
      formation: Magistrat.Formation.SIEGE,
      grade: Magistrat.Grade.II,
      name: 'nouveau nom',
      observers: [],
      rank: 'nouveau rang',
      reporterIds: [lucLoïcReporterId],
      rules: new PayloadRules().build(),

      avancement: Avancement.AVANCEMENT,
      datePassageAuGrade: {
        day: 1,
        month: 1,
        year: 2000,
      },
      datePriseDeFonctionPosteActuel: {
        day: 1,
        month: 1,
        year: 2002,
      },
      informationCarrière: 'information de carrière',
    },
  };

const payload: GdsTransparenceNominationFilesAddedEventPayload = {
  transparenceId: 'trasparence-id',
  transparenceName: uneTransparence,
  nominationFiles: [dossierDeNominationPayload],
};

const event = new GdsTransparenceNominationFilesAddedEvent(
  '1813645f-c1ff-40fa-8f5d-d6af28654de3',
  payload,
  new Date(),
);
