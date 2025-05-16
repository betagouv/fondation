import { INestApplication } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { Magistrat } from 'shared-models';
import {
  AffectationRapporteursCréeEvent,
  AffectationRapporteursCréeEventPayload,
} from 'src/nominations-context/business-logic/models/events/affectation-rapporteurs-crée.event';
import { TypeDeSaisine } from 'shared-models';
import { AffectationRapporteursCrééeSubscriber } from 'src/reports-context/business-logic/subscribers/affectation-rapporteurs-créée.subscriber';
import { MainAppConfigurator } from 'src/main.configurator';
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

describe('Affectation Rapporteurs Créée Nest subscriber', () => {
  let app: INestApplication;
  let db: DrizzleDb;
  let handleMock: jest.Mock;
  let transactionPerformer: TransactionPerformer;
  let domainEventRepository: DomainEventRepository;

  beforeAll(async () => {
    db = getDrizzleInstance(drizzleConfigForTest);
    handleMock = jest.fn();

    const moduleFixture = await new BaseAppTestingModule(db).moduleFixture
      .overrideProvider(AffectationRapporteursCrééeSubscriber)
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
  beforeEach(async () => {
    jest.restoreAllMocks();
    await clearDB(db);
  });
  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  it("forward l'évènement au subscriber métier", async () => {
    const event = AffectationRapporteursCréeEvent.create(payload);
    await transactionPerformer.perform(domainEventRepository.save(event));
    await setTimeout(600);

    expect(handleMock).toHaveBeenCalledWith(payload);
  });
});

const payload: AffectationRapporteursCréeEventPayload = {
  id: 'affectation-id',
  sessionId: 'session-id',
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  formation: Magistrat.Formation.PARQUET,
  affectationsDossiersDeNominations: [
    {
      dossierDeNominationId: 'dossier-id',
      rapporteurIds: ['rapporteur-id'],
    },
  ],
};
