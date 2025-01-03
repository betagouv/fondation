import { eq } from 'drizzle-orm';
import { UserRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/user-repository';
import { User } from 'src/identity-and-access-context/business-logic/models/user';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { users } from './schema/user-pm';

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

  byId(id: string): DrizzleTransactionableAsync<User | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (result.length === 0) return null;

      const userRow = result[0]!;
      return SqlUserRepository.mapToDomain(userRow);
    };
  }

  static mapToDb(user: User): typeof users.$inferInsert {
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  static mapToDomain(row: typeof users.$inferSelect): User {
    return new User(
      row.id,
      row.email,
      row.password,
      row.role,
      row.firstName,
      row.lastName,
    );
  }
}
