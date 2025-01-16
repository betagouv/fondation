import { UserBuilder } from 'src/identity-and-access-context/business-logic/builders/user.builder';
import { Role } from 'src/identity-and-access-context/business-logic/models/role';
import { User } from 'src/identity-and-access-context/business-logic/models/user';
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

const aUser = User.fromSnapshot(
  new UserBuilder().with('id', 'e7b8a9d6-4f5b-4c8b-9b2d-2f8e4f8e4f8e').build(),
);

const anotherUser = User.fromSnapshot(
  new UserBuilder()
    .with('id', 'f8e4f8e4-4f5b-4c8b-9b2d-e7b8a9d6e7b8')
    .with('email', 'another-user@example.fr')
    .with('password', 'another-password')
    .with('role', Role.MEMBRE_COMMUN)
    .with('firstName', 'Jane')
    .with('lastName', 'Smith')
    .build(),
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

    it.each([
      { email: aUser.email, expected: aUser },
      { email: 'nonexistent@example.com', expected: null },
    ])(
      'finds a user by email or return nothing',
      async ({ email, expected }) => {
        expect(
          await transactionPerformer.perform(
            sqlUserRepository.userWithEmail(email),
          ),
        ).toEqual(expected);
      },
    );

    it.each([
      { firstName: aUser.firstName, lastName: aUser.lastName, expected: aUser },
      { firstName: 'Nonexistent', lastName: 'User', expected: null },
    ])(
      'finds a user by full name or return nothing',
      async ({ firstName, lastName, expected }) => {
        expect(
          await transactionPerformer.perform(
            sqlUserRepository.userWithFullName(firstName, lastName),
          ),
        ).toEqual(expected);
      },
    );

    it('should not allow two users with the same email', async () => {
      const duplicateUser = User.fromSnapshot(
        new UserBuilder()
          .with('id', 'd8e4f8e4-4f5b-4c8b-9b2d-e7b8a9d6e7b8')
          .with('email', aUser.email)
          .build(),
      );

      await expect(
        transactionPerformer.perform(sqlUserRepository.save(duplicateUser)),
      ).rejects.toThrow();
    });
  });
});
