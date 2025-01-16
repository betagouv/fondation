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

const reporterName = 'Last-name First-name';
const reporterId = 'reporter-id';

describe('Reporter Translator Service', () => {
  let app: INestApplication;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    const moduleFixture = await new AppTestingModule()
      .withStubbedReporterTranslatorService()
      .compile();
    app = new MainAppConfigurator(
      moduleFixture.createNestApplication(),
    ).configure();

    await app.init();
    await app.listen(defaultApiConfig.port);
  });

  afterEach(() => app.close());
  afterAll(() => db.$client.end());

  it('fetches a reporter', async () => {
    const translateToReporter = app.get(ReporterTranslatorService);
    const reporter = await translateToReporter.reporterFrom(reporterName);
    expect(reporter.reporterId).toEqual(reporterId);
  });

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }

    withStubbedReporterTranslatorService() {
      this.moduleFixture.overrideProvider(UserWithFullNameUseCase).useFactory({
        factory: () => ({
          execute: async (): Promise<UserDescriptorSerialized> => ({
            userId: reporterId,
            firstName: 'First-name',
            lastName: 'Last-name',
          }),
        }),
      });

      return this;
    }
  }
});
