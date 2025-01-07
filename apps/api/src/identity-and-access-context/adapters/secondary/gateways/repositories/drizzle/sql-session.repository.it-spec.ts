import { DomainRegistry } from 'src/identity-and-access-context/business-logic/models/domain-registry';
import { Role } from 'src/identity-and-access-context/business-logic/models/role';
import { UserSession } from 'src/identity-and-access-context/business-logic/models/session';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { clearDB } from 'test/docker-postgresql-manager';
import { sessions } from './schema/session-pm';
import { users } from './schema/user-pm';
import { SqlSessionRepository } from './sql-session.repository';

const currentDate = new Date(2030, 0, 10);
const expiryTimeInDays = 10;
const expiresAt = new Date(2030, 0, 20);
const aSessionId = '123e4567-e89b-12d3-a456-426614174000';
const aUserId = 'f8e4f8e4-4f5b-4c8b-9b2d-e7b8a9d6e7b8';

describe('SQL Session Repository', () => {
  let sqlSessionRepository: SqlSessionRepository;
  let transactionPerformer: TransactionPerformer;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    transactionPerformer = new DrizzleTransactionPerformer(db);
    const dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    sqlSessionRepository = new SqlSessionRepository(dateTimeProvider);
    DomainRegistry.setDateTimeProvider(dateTimeProvider);
  });

  afterAll(() => db.$client.end());

  it('creates a session', async () => {
    await givenAUser();
    const session = givenASessionModel();

    await transactionPerformer.perform(sqlSessionRepository.create(session));

    await expectSessions({
      sessionId: aSessionId,
      userId: aUserId,
      createdAt: currentDate,
      expiresAt,
      invalidatedAt: null,
    });
  });

  it('soft deletes a session', async () => {
    await givenAUser();
    await givenASession({ createdAt: new Date(2029, 10, 1) });

    await transactionPerformer.perform(
      sqlSessionRepository.deleteSession(aSessionId),
    );

    const existingSessions = await db.select().from(sessions).execute();
    expect(existingSessions).toEqual([
      {
        sessionId: aSessionId,
        userId: aUserId,
        createdAt: new Date(2029, 10, 1),
        expiresAt,
        invalidatedAt: currentDate,
      },
    ]);
  });

  const givenAUser = async () => {
    await db
      .insert(users)
      .values({
        id: aUserId,
        createdAt: new Date(),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'securepassword',
        role: Role.MEMBRE_COMMUN,
      })
      .execute();
  };
  const givenASessionModel = () =>
    UserSession.create(expiryTimeInDays, aSessionId, aUserId);
  const givenASession = async (
    override?: Partial<typeof sessions.$inferInsert>,
  ) => {
    await db
      .insert(sessions)
      .values({
        sessionId: aSessionId,
        userId: aUserId,
        createdAt: currentDate,
        expiresAt,
        ...override,
      })
      .execute();
  };

  const expectSessions = async (
    ...expectedSessions: (typeof sessions.$inferSelect)[]
  ) => {
    const existingSessions = await db.select().from(sessions).execute();
    expect(existingSessions).toEqual(expectedSessions);
  };
});
