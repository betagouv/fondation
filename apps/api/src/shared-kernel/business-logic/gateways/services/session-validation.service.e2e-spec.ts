import { INestApplication } from '@nestjs/common';
import { join } from 'node:path/posix';
import { SIGNATURE_PROVIDER } from 'src/identity-and-access-context/adapters/primary/nestjs/tokens';
import { FakeSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/fake-signature.provider';
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

const sessionId = 'valid-session-id';
const userId = 'valid-user-id';

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

  afterEach(() => app.close());
  afterAll(() => db.$client.end());

  it('validates a session', async () => {
    const pathname = join('/', baseRoute, endpointsPaths.validateSession);

    const response = await request(app.getHttpServer())
      .post(pathname)
      .send({ sessionId })
      .expect(200);

    expect(response.text).toEqual(userId);
  });

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }

    withStubbedRemoteSessionValidation() {
      this.withFakeSignature();
      this.withStubbedValidateSessionUseCase();
      return this;
    }

    private withFakeSignature() {
      this.moduleFixture.overrideProvider(SIGNATURE_PROVIDER).useFactory({
        factory: () => {
          const signatureProvider = new FakeSignatureProvider();

          signatureProvider.signedValuesMap = {
            [sessionId]: sessionId,
          };

          return signatureProvider;
        },
      });

      return this;
    }

    private withStubbedValidateSessionUseCase() {
      this.moduleFixture.overrideProvider(ValidateSessionUseCase).useClass(
        class StubbedValidateSessionUseCase {
          async execute() {
            return userId;
          }
        },
      );

      return this;
    }
  }
});
