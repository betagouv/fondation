import { INestApplication } from '@nestjs/common';
import { Gender } from 'src/identity-and-access-context/business-logic/models/gender';
import { UserDescriptor } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import { UserWithFullNameUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-with-full-name/user-with-full-name.use-case';
import { UserWithIdUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-with-id/user-with-id.use-case';
import { MainAppConfigurator } from 'src/main.configurator';
import {
  Reporter,
  ReporterSnapshot,
} from 'src/reports-context/business-logic/models/reporter';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { ReporterTranslatorService } from './reporter-translator.service';
import { Role } from 'shared-models';

const reporterId = 'ad7b1b1e-0b7b-4b7b-8b7b-0b7b1b7b1b7b';
const reporterName = 'DOE John';
const aUserDescriptor: UserDescriptor = new UserDescriptor(
  reporterId,
  'john',
  'doe',
  Gender.M,
  Role.MEMBRE_COMMUN,
);

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

  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  it('fetches a reporter by id', async () => {
    const reporter = await reporterTranslatorService.reporterWithId(reporterId);
    expectReporter(reporter);
  });

  it('fetches a reporter by name', async () => {
    const reporter =
      await reporterTranslatorService.reporterWithFullName(reporterName);
    expectReporter(reporter);
  });

  const expectReporter = (reporter: Reporter) => {
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
            execute: () => aUserDescriptor,
          }),
        })
        .overrideProvider(UserWithFullNameUseCase)
        .useFactory({
          factory: () => ({
            execute: () => aUserDescriptor,
          }),
        });

      return this;
    }
  }
});
