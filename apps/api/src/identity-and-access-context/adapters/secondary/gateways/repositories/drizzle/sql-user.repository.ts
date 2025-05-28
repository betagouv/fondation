import { and, eq, sql } from 'drizzle-orm';
import { UserRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/user-repository';
import { User } from 'src/identity-and-access-context/business-logic/models/user';
import {
  DrizzleTransactionableAsync,
  tx,
} from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { users } from './schema/user-pm';

export class SqlUserRepository implements UserRepository {
  async save(user: User): Promise<void> {
    const userRow = SqlUserRepository.mapToDb(user);
    await tx()
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
    return user.toSnapshot();
  }

  static mapToDomain(row: typeof users.$inferSelect): User {
    return User.fromSnapshot(row);
  }
}
