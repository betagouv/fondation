import { INestApplication } from '@nestjs/common';
import { join } from 'node:path/posix';
import { Gender } from 'src/identity-and-access-context/business-logic/models/gender';
import { UserDescriptor } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import { ValidateSessionUseCase } from 'src/identity-and-access-context/business-logic/use-cases/session-validation/validate-session.use-case';
import { MainAppConfigurator } from 'src/main.configurator';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import request from 'supertest';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { baseRoute, endpointsPaths } from './session-validation.service';
import { Role } from 'shared-models';

const sessionId = 'valid-session-id';

const stubUser = {
  userId: 'valid-user-id',
  firstName: 'John',
  lastName: 'Doe',
  role: Role.MEMBRE_COMMUN,
};

describe('Session Validation Service', () => {
  let app: INestApplication;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    const moduleFixture = await new AppTestingModule()
      .withStubbedRemoteSessionValidation()
      .compile();
    app = new MainAppConfigurator(
      moduleFixture.createNestApplication(),
    ).configure();

    await app.init();
    await app.listen(defaultApiConfig.port);
  });

  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  it('validates a session', async () => {
    const pathname = join('/', baseRoute, endpointsPaths.validateSession);

    const response = await request(app.getHttpServer())
      .post(pathname)
      .send({ sessionId })
      .expect(200);

    expect(response.body).toEqual(stubUser);
  });

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }

    withStubbedRemoteSessionValidation() {
      this.withFakeCookieSignature({
        [sessionId]: sessionId,
      });
      return this.withStubbedValidateSessionUseCase();
    }

    private withStubbedValidateSessionUseCase() {
      this.moduleFixture.overrideProvider(ValidateSessionUseCase).useClass(
        class StubbedValidateSessionUseCase {
          async execute(): ReturnType<ValidateSessionUseCase['execute']> {
            return new UserDescriptor(
              stubUser.userId,
              stubUser.firstName,
              stubUser.lastName,
              Gender.M,
              Role.MEMBRE_COMMUN,
            );
          }
        },
      );

      return this;
    }
  }
});
