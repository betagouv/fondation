import { HttpStatus, INestApplication } from '@nestjs/common';
import { Gender } from 'shared-models/models/gender';
import { Role } from 'shared-models/models/role';
import { MainAppConfigurator } from 'src/main.configurator';
import { USER_SERVICE } from 'src/reports-context/adapters/primary/nestjs/tokens';
import { StubUserService } from 'src/reports-context/adapters/secondary/gateways/services/stub-user.service';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
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
      const response = await uploadATestFile();
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should be able to upload a file', async () => {
      await initApp({ validatedSession: true });
      const response = await uploadATestFile();
      expect(response.status).toBe(HttpStatus.CREATED);
    });

    const uploadATestFile = () =>
      request(app.getHttpServer())
        .post('/api/secretariat-general/nouvelle-transparence')
        .set('Cookie', 'sessionId=unused')
        .attach('fichier', Buffer.from(''), 'test.txt');
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
