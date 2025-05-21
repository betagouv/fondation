import { HttpStatus, INestApplication } from '@nestjs/common';
import { Gender } from 'shared-models/models/gender';
import { Role } from 'shared-models/models/role';
import { MainAppConfigurator } from 'src/main.configurator';
import { USER_SERVICE } from 'src/reports-context/adapters/primary/nestjs/tokens';
import { StubUserService } from 'src/reports-context/adapters/secondary/gateways/services/stub-user.service';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { SessionValidationService } from 'src/shared-kernel/business-logic/gateways/services/session-validation.service';
import request from 'supertest';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';

describe('Secretariat General Controller', () => {
  let app: INestApplication;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
  });
  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  describe('Nouvelle Transparence', () => {
    it('requires a valid user session', async () => {
      await initApp({ validatedSession: false });
      await app.listen(defaultApiConfig.port); // Run server to contact other contexts over REST
      const response = await uploadATestFile();
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should be able to upload a file', async () => {
      initApp({ validatedSession: true });
      const response = await uploadATestFile();
      expect(response.status).toBe(HttpStatus.OK);
    });

    const uploadATestFile = async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      return request(app.getHttpServer())
        .post('/api/secretariat-general/nouvelle-transparence')
        .set('Cookie', 'sessionId=unused')
        .attach('file', file);
    };
  });

  const initApp = async ({
    validatedSession,
  }: {
    validatedSession: boolean;
  }) => {
    const moduleFixture = await new AppTestingModule()
      .withStubSessionValidationService(validatedSession)
      .withStubUserService()
      .compile();

    app = new MainAppConfigurator(moduleFixture.createNestApplication())
      .withCookies()
      .configure();

    await app.init();
  };
  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }

    withStubSessionValidationService(validated: boolean) {
      this.moduleFixture.overrideProvider(SessionValidationService).useClass(
        class StubSessionValidationService {
          async validateSession(): ReturnType<
            SessionValidationService['validateSession']
          > {
            return validated ? stubUser : null;
          }
        },
      );
      return this;
    }

    withStubUserService() {
      this.moduleFixture.overrideProvider(USER_SERVICE).useFactory({
        factory: () => {
          const userService = new StubUserService();
          userService.user = stubUser;
          return userService;
        },
      });
      return this;
    }
  }

  const stubUser = {
    userId: 'user-id',
    firstName: 'First-name',
    lastName: 'REPORTER',
    role: Role.MEMBRE_COMMUN,
    gender: Gender.M,
  };
});
