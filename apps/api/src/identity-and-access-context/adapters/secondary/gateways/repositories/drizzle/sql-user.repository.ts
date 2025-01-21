import { and, eq, sql } from 'drizzle-orm';
import { UserRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/user-repository';
import {
  User,
  UserSnapshot,
} from 'src/identity-and-access-context/business-logic/models/user';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { users } from './schema/user-pm';
import { FullName } from 'src/identity-and-access-context/business-logic/models/full-name';

export class SqlUserRepository implements UserRepository {
  save(user: User): DrizzleTransactionableAsync<void> {
    return async (db) => {
      const userRow = SqlUserRepository.mapToDb(user);
      await db
        .insert(users)
        .values(userRow)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userRow.email,
            password: userRow.password,
            role: userRow.role,
            firstName: userRow.firstName,
            lastName: userRow.lastName,
          },
        });
    };
  }

  userWithEmail(email: string): DrizzleTransactionableAsync<User | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (result.length === 0) return null;

      const userRow = result[0]!;
      return SqlUserRepository.mapToDomain(userRow);
    };
  }

  userWithFullName(
    firstName: string,
    lastName: string,
  ): DrizzleTransactionableAsync<User | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(users)
        .where(
          and(
            sql`unaccent(${users.firstName}) = ${firstName}`,
            sql`unaccent(${users.lastName}) = ${lastName}`,
          ),
        )
        .limit(1);

      if (result.length === 0) return null;

      const userRow = result[0]!;
      return SqlUserRepository.mapToDomain(userRow);
    };
  }

  userWithId(userId: string): DrizzleTransactionableAsync<User | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (result.length === 0) return null;

      const userRow = result[0]!;
      return SqlUserRepository.mapToDomain(userRow);
    };
  }

  static mapToDb(user: User): typeof users.$inferInsert {
    const snapshot = user.toSnapshot();
    return SqlUserRepository.mapSnapshotToDb(snapshot);
  }

  static mapSnapshotToDb(snapshot: UserSnapshot): typeof users.$inferInsert {
    return {
      id: snapshot.id,
      createdAt: snapshot.createdAt,
      email: snapshot.email,
      password: snapshot.password,
      role: snapshot.role,
      firstName: snapshot.firstName,
      lastName: snapshot.lastName,
    };
  }

  static mapToDomain(row: typeof users.$inferSelect): User {
    return new User(
      row.id,
      row.createdAt,
      row.email,
      row.password,
      row.role,
      new FullName(row.firstName, row.lastName),
    );
  }
}
