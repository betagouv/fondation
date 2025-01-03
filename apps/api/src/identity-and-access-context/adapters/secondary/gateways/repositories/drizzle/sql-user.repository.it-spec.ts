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

const aUser = new User(
  'e7b8a9d6-4f5b-4c8b-9b2d-2f8e4f8e4f8e',
  'user@example.fr',
  'password',
  Role.MEMBRE_DU_SIEGE,
  'John',
  'Doe',
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

  describe('when there is a user', () => {
    beforeEach(async () => {
      const userRow = SqlUserRepository.mapToDb(aUser);
      await db.insert(users).values(userRow).execute();
    });

    it('finds a user by id', async () => {
      const result = await transactionPerformer.perform(
        sqlUserRepository.byId(aUser.id),
      );
      expect(result).toEqual(aUser);
    });
  });
});
