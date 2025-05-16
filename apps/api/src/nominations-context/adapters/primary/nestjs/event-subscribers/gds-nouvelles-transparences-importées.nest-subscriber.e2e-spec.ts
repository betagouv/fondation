import { INestApplication } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { Magistrat, RulesBuilder, Transparency } from 'shared-models';
import {
  GdsNewTransparenceImportedEvent,
  GdsNewTransparenceImportedEventPayload,
} from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import {
  ManagementRule,
  StatutoryRule,
  QualitativeRule,
  allRulesMapV1,
} from 'src/data-administration-context/business-logic/models/rules';
import { MainAppConfigurator } from 'src/main.configurator';
import { GdsNouvellesTransparencesImportéesSubscriber } from 'src/nominations-context/business-logic/listeners/gds-nouvelles-transparences-importées.subscriber';
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

describe('GDS nouvelles transparences importées Nest subscriber', () => {
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
      .overrideProvider(GdsNouvellesTransparencesImportéesSubscriber)
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

const dossierDeNominationPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'][number] =
  {
    nominationFileId: 'nomination-file-id',
    content: {
      transparency: Transparency.AUTOMNE_2024,
      biography: 'biography',
      birthDate: {
        day: 1,
        month: 1,
        year: 2000,
      },
      currentPosition: 'currentPosition',
      targettedPosition: 'targettedPosition',
      dueDate: {
        day: 1,
        month: 1,
        year: 2000,
      },
      folderNumber: 1,
      formation: Magistrat.Formation.PARQUET,
      grade: Magistrat.Grade.I,
      name: 'name',
      observers: [],
      rank: 'rank',
      reporterIds: ['luc-loic-reporter-id'],
      rules: new PayloadRules().build(),
    },
  };
const payload: GdsNewTransparenceImportedEventPayload = {
  transparenceId: Transparency.AUTOMNE_2024,
  transparenceName: Transparency.AUTOMNE_2024,
  formation: Magistrat.Formation.SIEGE,
  nominationFiles: [dossierDeNominationPayload],
};

const event = new GdsNewTransparenceImportedEvent(
  '1813645f-c1ff-40fa-8f5d-d6af28654de3',
  payload,
  new Date(),
);
