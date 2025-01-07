import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { clearDB } from 'test/docker-postgresql-manager';
import { users } from './schema/user-pm';
import { SqlUserRepository } from './sql-user.repository';
import { User } from 'src/identity-and-access-context/business-logic/models/user';
import { Role } from 'src/identity-and-access-context/business-logic/models/role';

const currentDate = new Date(2030, 0, 10);
const aUser = new User(
  'e7b8a9d6-4f5b-4c8b-9b2d-2f8e4f8e4f8e',
  currentDate,
  'user@example.fr',
  'password',
  Role.MEMBRE_DU_SIEGE,
  'John',
  'Doe',
);
const anotherUser = new User(
  'f8e4f8e4-4f5b-4c8b-9b2d-e7b8a9d6e7b8',
  currentDate,
  'another-user@example.fr',
  'another-password',
  Role.MEMBRE_DU_SIEGE,
  'Jane',
  'Smith',
);

describe('SQL User Repository', () => {
  let sqlUserRepository: SqlUserRepository;
  let transactionPerformer: TransactionPerformer;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlUserRepository = new SqlUserRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a user', async () => {
    await transactionPerformer.perform(sqlUserRepository.save(aUser));

    const existingUsers = await db.select().from(users).execute();
    expect(existingUsers).toEqual([SqlUserRepository.mapToDb(aUser)]);
  });

  describe('when there are users', () => {
    beforeEach(async () => {
      const userRow = SqlUserRepository.mapToDb(aUser);
      const anotherUserRow = SqlUserRepository.mapToDb(anotherUser);
      await db.insert(users).values([userRow, anotherUserRow]).execute();
    });

    it("finds a user by email and password and returns the user's data", async () => {
      const result = await transactionPerformer.perform(
        sqlUserRepository.userFromCredentials(aUser.email, aUser.password),
      );
      expect(result).toEqual(aUser);
    });
  });
});
