import { INestApplication } from '@nestjs/common';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import { UserWithFullNameUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-with-full-name/user-with-full-name.use-case';
import { MainAppConfigurator } from 'src/main.configurator';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { ReporterTranslatorService } from './reporter-translator.service';
import { UserWithIdUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-with-id/user-with-id.use-case';
import {
  Reporter,
  ReporterSnapshot,
} from 'src/reports-context/business-logic/models/reporter';

const reporterId = 'ad7b1b1e-0b7b-4b7b-8b7b-0b7b1b7b1b7b';
const reporterName = 'DOE John';
const aUserDescriptor: UserDescriptorSerialized = {
  userId: reporterId,
  firstName: 'John',
  lastName: 'DOE',
};

describe('Reporter Translator Service', () => {
  let app: INestApplication;
  let db: DrizzleDb;
  let reporterTranslatorService: ReporterTranslatorService;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    const moduleFixture = await new AppTestingModule()
      .withStubbedIdentityAndAccessContextUseCases()
      .compile();
    app = new MainAppConfigurator(
      moduleFixture.createNestApplication(),
    ).configure();

    reporterTranslatorService = moduleFixture.get(ReporterTranslatorService);

    await app.init();
    await app.listen(defaultApiConfig.port);
  });

  afterEach(() => app.close());
  afterAll(() => db.$client.end());

  it('fetches a reporter by name', async () => {
    const reporter =
      await reporterTranslatorService.reporterWithFullName(reporterName);
    expecReporter(reporter);
  });

  it('fetches a reporter by id', async () => {
    const reporter = await reporterTranslatorService.reporterWithId(reporterId);
    expecReporter(reporter);
  });

  const expecReporter = (reporter: Reporter) => {
    expect(reporter.toSnapshot()).toEqual<ReporterSnapshot>({
      reporterId,
      firstName: 'john',
      lastName: 'doe',
    });
  };

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }

    withStubbedIdentityAndAccessContextUseCases() {
      this.moduleFixture
        .overrideProvider(UserWithIdUseCase)
        .useFactory({
          factory: () => ({
            execute: async () => aUserDescriptor,
          }),
        })
        .overrideProvider(UserWithFullNameUseCase)
        .useFactory({
          factory: () => ({
            execute: async () => aUserDescriptor,
          }),
        });

      return this;
    }
  }
});
