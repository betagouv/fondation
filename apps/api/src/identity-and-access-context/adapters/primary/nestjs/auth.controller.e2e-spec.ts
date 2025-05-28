import { HttpStatus, INestApplication } from '@nestjs/common';
import { AuthenticatedUser, Gender, Role } from 'shared-models';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema/user-pm';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import {
  RegisterUserCommand,
  RegisterUserUseCase,
} from 'src/identity-and-access-context/business-logic/use-cases/user-registration/register-user.use-case';
import { MainAppConfigurator } from 'src/main.configurator';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import {
  API_CONFIG,
  TRANSACTION_PERFORMER,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { DevApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import supertest from 'supertest';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';
import { SecureCrossContextRequestBuilder } from 'test/secure-cross-context-request.builder';
import { FakeEncryptionProvider } from '../../secondary/gateways/providers/fake-encryption.provider';
import { sessions } from '../../secondary/gateways/repositories/drizzle/schema/session-pm';
import { ENCRYPTION_PROVIDER } from './tokens';

const aPassword = 'password-123';
const aUserDb = {
  id: 'f8e4f8e4-4f5b-4c8b-9b2d-e7b8a9d6e7b8',
  firstName: 'luc',
  lastName: 'denan',
  email: 'user@example.com',
  password: 'encrypted-password-123',
  role: Role.MEMBRE_DU_PARQUET,
  gender: Gender.M,
} satisfies typeof users.$inferInsert;

const loginDto = {
  email: 'user@example.com',
  password: aPassword,
};

describe('Auth Controller', () => {
  let app: INestApplication;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    await db.insert(users).values(aUserDb).execute();
  });

  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  describe('With real encryption', () => {
    beforeEach(async () => {
      const moduleFixture = await new AppTestingModule().compile();
      app = new MainAppConfigurator(moduleFixture.createNestApplication())
        .withCookies()
        .configure();

      await app.init();
    });

    it('registers a user and logs in successfully', async () => {
      const registerUserUseCase =
        app.get<RegisterUserUseCase>(RegisterUserUseCase);
      const transactionPerformer = app.get<TransactionPerformer>(
        TRANSACTION_PERFORMER,
      );

      const user: RegisterUserCommand = {
        email: 'new-user@example.com',
        password: 'new-password-123',
        role: Role.MEMBRE_DU_PARQUET,
        firstName: 'New',
        lastName: 'User',
        gender: Gender.F,
      };
      await transactionPerformer.perform(registerUserUseCase.execute(user));

      const response = await supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'new-user@example.com', password: 'new-password-123' })
        .expect(HttpStatus.OK)
        .expect('set-cookie', new SetCookieRegex().build());

      const expectedAuthenticatedUser: AuthenticatedUser = {
        userId: expect.any(String),
        firstName: 'new',
        lastName: 'user',
        role: user.role,
        gender: user.gender,
      };
      expect(response.body).toEqual(expectedAuthenticatedUser);
    });

    it('says non-existing user are unauthorized to log in', async () => {
      await supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong-password' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('With fake encryption', () => {
    const cookieAgeInSeconds = 10;

    beforeEach(async () => {
      const moduleFixture = await new AppTestingModule()
        .withFakeEncryption()
        .withCookieMaxAgeInSeconds(cookieAgeInSeconds)
        .compile();

      app = new MainAppConfigurator(moduleFixture.createNestApplication())
        .withCors()
        .withCookies()
        .configure();

      await app.init();
    });

    it('logs in a user, has the session ID stored and receives it in a signed cookie', async () => {
      const response = await supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(HttpStatus.OK)
        .expect(
          'set-cookie',
          new SetCookieRegex().withMaxAge(cookieAgeInSeconds).build(),
        )
        .expect(
          'Access-Control-Allow-Origin',
          defaultApiConfig.frontendOriginUrl,
        )
        .expect('Access-Control-Allow-Credentials', 'true');

      expectUserDescriptor(response.body);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const sessionCookie = cookies.find((cookie: string) =>
        cookie.startsWith('sessionId='),
      );

      const signedSessionId = sessionCookie!.split('=')[1]!.split(';')[0]!;
      expect(signedSessionId.length).toBeGreaterThan(32);
      expectSessions({
        sessionId: expect.any(String),
        userId: aUserDb.id,
        createdAt: expect.any(Date),
        expiresAt: expect.any(Date),
        invalidatedAt: null,
      });
      const sessionsDb = await db.select().from(sessions).execute();
      expect(sessionsDb[0]!.sessionId).not.toEqual(signedSessionId);
    });
  });

  describe('Session validation with fake encryption and fake signatures', () => {
    const signedSessionId = 'signed-session-id';
    const sessionId = 'ad4b3b3b-4b3b-4b3b-4b3b-4b3b4b3b4b3b';

    beforeEach(async () => {
      const moduleFixture = await new AppTestingModule()
        .withFakeEncryption()
        .withFakeCookieSignature({
          [signedSessionId]: sessionId,
        })
        .compile();

      app = new MainAppConfigurator(moduleFixture.createNestApplication())
        .withCookies()
        .configure();

      await app.init();
    });

    it('validates a session id', async () => {
      await givenSomeSessions({
        sessionId,
        userId: aUserDb.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour later
      });

      const response = await supertest(app.getHttpServer())
        .post('/api/auth/validate-session')
        .send({ sessionId: signedSessionId })
        .expect(HttpStatus.OK);

      expectUserDescriptor(response.body);
    });

    it('validates a session id from cookie', async () => {
      await givenSomeSessions({
        sessionId,
        userId: aUserDb.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour later
      });

      const response = await supertest(app.getHttpServer())
        .post('/api/auth/validate-session-from-cookie')
        .set('Cookie', `sessionId=${signedSessionId}`)
        .expect(HttpStatus.OK);

      expectUserDescriptor(response.body);
    });

    it('logs out a user and invalidates the session', async () => {
      await givenSomeSessions({
        sessionId,
        userId: aUserDb.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour later
      });

      await supertest(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', `sessionId=${signedSessionId}`)
        .expect(HttpStatus.OK)
        .expect('set-cookie', new SetCookieRegex('cleared').build());

      await expectSessions({
        sessionId,
        userId: aUserDb.id,
        createdAt: expect.any(Date),
        expiresAt: expect.any(Date),
        invalidatedAt: expect.any(Date),
      });
    });
  });

  describe('User retrieval', () => {
    it.each`
      description    | pathname
      ${'full name'} | ${`user-with-full-name/wrong_last_name ${aUserDb.firstName}`}
      ${'ID'}        | ${`user-with-id/da4b3b3b-4b3b-4b3b-4b3b-4b3b4b3b4b3b`}
    `(
      'requires authenticated requests from other bounded contexts to get a user by $description',
      ({ pathname }) =>
        supertest(app.getHttpServer())
          .get(`/api/auth/${pathname}`)
          .expect(HttpStatus.UNAUTHORIZED),
    );

    it.each`
      description    | pathname
      ${'full name'} | ${`user-with-full-name/wrong_last_name ${aUserDb.firstName}`}
      ${'ID'}        | ${`user-with-id/da4b3b3b-4b3b-4b3b-4b3b-4b3b4b3b4b3b`}
    `(
      'says user is not found if no user matches the non-existing $description',
      ({ pathname }) => requestEndpoint(pathname, HttpStatus.NOT_FOUND),
    );

    it.each`
      description       | pathname
      ${'by full name'} | ${`user-with-full-name/${aUserDb.lastName} ${aUserDb.firstName}`}
      ${'by ID'}        | ${`user-with-id/${aUserDb.id}`}
    `('retrieves a user $description', async ({ pathname }) => {
      const response = await requestEndpoint(pathname, HttpStatus.OK);
      expectUserDescriptor(response.body);
    });

    const requestEndpoint = (pathname: string, statusCode: HttpStatus) =>
      new SecureCrossContextRequestBuilder(app)
        .withTestedEndpoint((agent) =>
          agent.get(`/api/auth/${pathname}`).expect(statusCode),
        )
        .request();
  });

  const givenSomeSessions = async (
    ...sessionsToInsert: (typeof sessions.$inferInsert)[]
  ) => {
    await db.insert(sessions).values(sessionsToInsert).execute();
  };

  const expectSessions = async (
    ...expectedSessions: (typeof sessions.$inferSelect)[]
  ) => {
    const existingSessions = await db.select().from(sessions).execute();
    expect(existingSessions).toEqual<(typeof sessions.$inferSelect)[]>(
      expectedSessions,
    );
  };
  const expectUserDescriptor = (body: any) =>
    expect(body).toEqual<UserDescriptorSerialized>({
      userId: aUserDb.id,
      firstName: aUserDb.firstName,
      lastName: aUserDb.lastName,
      role: aUserDb.role,
      gender: aUserDb.gender,
    });

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }

    withCookieMaxAgeInSeconds(maxAge: number) {
      this.moduleFixture.overrideProvider(API_CONFIG).useValue({
        ...defaultApiConfig,
        cookieMaxAgeInMs: maxAge * 1000,
      } satisfies DevApiConfig);

      return this;
    }

    withFakeEncryption() {
      this.moduleFixture.overrideProvider(ENCRYPTION_PROVIDER).useFactory({
        factory: () => {
          const encryptionProvider = new FakeEncryptionProvider();
          encryptionProvider.encryptionMap = {
            [aPassword]: 'encrypted-password-123',
          };
          return encryptionProvider;
        },
      });

      return this;
    }
  }
});

class SetCookieRegex {
  private mode: 'new' | 'cleared';
  private cookieAge: number | undefined;

  constructor(mode: 'new' | 'cleared' = 'new') {
    this.mode = mode;
  }

  withMaxAge(cookieAgeInSeconds: number) {
    this.cookieAge = cookieAgeInSeconds;
    return this;
  }

  build(): RegExp {
    const sessionId = this.cleared ? `sessionId=` : `sessionId=.*`;
    const cookieAge = this.cookieAge ? `; Max-Age=${this.cookieAge}` : '';
    const expires = this.cleared ? `; Expires=Thu, 01 Jan 1970 .*` : `; .*`;

    return new RegExp(
      sessionId +
        cookieAge +
        `; Path=.*` +
        expires +
        `; HttpOnly` +
        `; Secure` +
        `; SameSite=Strict`,
    );
  }

  private get cleared() {
    return this.mode === 'cleared';
  }
}
