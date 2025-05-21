import { INestApplication } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { Transparency } from 'shared-models';
import {
  GdsTransparenceNominationFilesModifiedEvent,
  GdsTransparenceNominationFilesModifiedEventPayload,
} from 'src/data-administration-context/business-logic/models/events/gds-transparence-nomination-files-modified.event';
import { MainAppConfigurator } from 'src/main.configurator';
import { GdsTransparenceDossiersModifiésSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/gds-transparence-dossiers-modifiés.subscriber';
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

describe('GDS transparence dossiers modifiés Nest subscriber', () => {
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
      .overrideProvider(GdsTransparenceDossiersModifiésSubscriber)
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

const payload: GdsTransparenceNominationFilesModifiedEventPayload = {
  transparenceId: 'e4976cfe-8a8f-4a5a-a70b-e6e6bd81acf7',
  transparenceName: Transparency.AUTOMNE_2024,
  nominationFiles: [
    {
      nominationFileId: '43a39b04-2ee3-4d2f-8a99-aa4497e61338',
      content: {
        folderNumber: 42,
      },
    },
  ],
};

const event = new GdsTransparenceNominationFilesModifiedEvent(
  '1813645f-c1ff-40fa-8f5d-d6af28654de3',
  payload,
  new Date(),
);
