import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
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
import { sessions } from '../../secondary/gateways/repositories/drizzle/schema/session-pm';
import { ENCRYPTION_PROVIDER } from './tokens';

const aPassword = 'password-123';
const aUserDb = {
  id: 'f8e4f8e4-4f5b-4c8b-9b2d-e7b8a9d6e7b8',
  firstName: 'Luc',
  lastName: 'Denan',
  email: 'user@example.com',
  password: 'encrypted-password-123',
  role: Role.MEMBRE_DU_PARQUET,
} satisfies typeof users.$inferInsert;

describe('Auth Controller', () => {
  let app: INestApplication;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    await db.insert(users).values(aUserDb).execute();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DRIZZLE_DB)
      .useValue(db)
      .overrideProvider(ENCRYPTION_PROVIDER)
      .useClass(FakeEncryptionProvider)
      .compile();

    app = new MainAppConfigurator(moduleFixture.createNestApplication())
      .withCookies()
      .configure();

    const encryptionProvider =
      app.get<FakeEncryptionProvider>(ENCRYPTION_PROVIDER);
    encryptionProvider.encryptionMap = {
      [aPassword]: 'encrypted-password-123',
    };
    await app.init();
  });

  afterEach(() => app.close());
  afterAll(() => db.$client.end());

  it('logs in a user and receives a session id in a signed cookie', async () => {
    const loginDto = {
      email: 'user@example.com',
      password: aPassword,
    };

    await supertest(app.getHttpServer())
      .post('/api/auth/login')
      .send(loginDto)
      .expect(HttpStatus.OK)
      .expect('set-cookie', /sessionId=.*; HttpOnly; Secure/);

    expect(await db.select().from(sessions).execute()).toEqual<
      (typeof sessions.$inferSelect)[]
    >([
      {
        sessionId: expect.any(String),
        userId: aUserDb.id,
        createdAt: expect.any(Date),
        expiresAt: expect.any(Date),
        invalidatedAt: null,
      },
    ]);
  });

  it('validates a session id', async () => {
    const sessionId = 'ad4b3b3b-4b3b-4b3b-4b3b-4b3b4b3b4b3b';
    await givenSomeSessions({
      sessionId,
      userId: aUserDb.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour later
    });

    await supertest(app.getHttpServer())
      .post('/api/auth/validate-session')
      .send({ sessionId })
      .expect(HttpStatus.OK);
  });

  it('logs out a user and invalidates the session', async () => {
    const sessionId = 'ad4b3b3b-4b3b-4b3b-4b3b-4b3b4b3b4b3b';
    await givenSomeSessions({
      sessionId,
      userId: aUserDb.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour later
    });

    await supertest(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', `sessionId=${sessionId}`)
      .expect(HttpStatus.OK)
      .expect(
        'set-cookie',
        /sessionId=; Path=.*; Expires=Thu, 01 Jan 1970 .*; HttpOnly; Secure/,
      );

    await expectSession({
      sessionId,
      userId: aUserDb.id,
      createdAt: expect.any(Date),
      expiresAt: expect.any(Date),
      invalidatedAt: expect.any(Date),
    });
  });

  const givenSomeSessions = async (
    ...sessionsToInsert: (typeof sessions.$inferInsert)[]
  ) => {
    await db.insert(sessions).values(sessionsToInsert).execute();
  };

  const expectSession = async (
    ...expectedSessions: (typeof sessions.$inferSelect)[]
  ) => {
    const existingSessions = await db.select().from(sessions).execute();
    expect(existingSessions).toEqual<(typeof sessions.$inferSelect)[]>(
      expectedSessions,
    );
  };
});
