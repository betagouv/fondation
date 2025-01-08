import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema/user-pm';
import { Role } from 'src/identity-and-access-context/business-logic/models/role';
import { MainAppConfigurator } from 'src/main.configurator';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import supertest from 'supertest';
import { clearDB } from 'test/docker-postgresql-manager';
import { FakeEncryptionProvider } from '../../secondary/gateways/providers/fake-encryption.provider';
import { FakeSignatureProvider } from '../../secondary/gateways/providers/fake-signature.provider';
import { sessions } from '../../secondary/gateways/repositories/drizzle/schema/session-pm';
import { ENCRYPTION_PROVIDER, SIGNATURE_PROVIDER } from './tokens';

const aPassword = 'password-123';
const aUserDb = {
  id: 'f8e4f8e4-4f5b-4c8b-9b2d-e7b8a9d6e7b8',
  firstName: 'Luc',
  lastName: 'Denan',
  email: 'user@example.com',
  password: 'encrypted-password-123',
  role: Role.MEMBRE_DU_PARQUET,
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

  afterEach(() => app.close());
  afterAll(() => db.$client.end());

  describe('With fake encryption', () => {
    beforeEach(async () => {
      const moduleFixture = await new AppTestingModule()
        .withFakeEncryption()
        .compile();

      app = new MainAppConfigurator(moduleFixture.createNestApplication())
        .withCookies()
        .configure();

      await app.init();
    });

    it('logs in a user, has the session ID stored and receives it in a signed cookie', async () => {
      const response = await supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(HttpStatus.OK)
        .expect('set-cookie', /sessionId=.*; Path=.*; HttpOnly; Secure/);

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
        .withFakeSignature({
          signedValuesMap: {
            [signedSessionId]: sessionId,
          },
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

      await supertest(app.getHttpServer())
        .post('/api/auth/validate-session')
        .send({ sessionId: signedSessionId })
        .expect(HttpStatus.OK);
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
        .expect(
          'set-cookie',
          /sessionId=; Path=.*; Expires=Thu, 01 Jan 1970 .*; HttpOnly; Secure/,
        );

      await expectSessions({
        sessionId,
        userId: aUserDb.id,
        createdAt: expect.any(Date),
        expiresAt: expect.any(Date),
        invalidatedAt: expect.any(Date),
      });
    });
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

  class AppTestingModule {
    moduleFixture: TestingModuleBuilder;

    constructor() {
      this.moduleFixture = Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(DRIZZLE_DB)
        .useValue(db);
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

    withFakeSignature(options?: { signedValuesMap?: Record<string, string> }) {
      this.moduleFixture.overrideProvider(SIGNATURE_PROVIDER).useFactory({
        factory: () => {
          const signatureProvider = new FakeSignatureProvider();

          if (options?.signedValuesMap) {
            signatureProvider.signedValuesMap = options.signedValuesMap;
          }

          return signatureProvider;
        },
      });

      return this;
    }

    compile() {
      return this.moduleFixture.compile();
    }
  }
});
