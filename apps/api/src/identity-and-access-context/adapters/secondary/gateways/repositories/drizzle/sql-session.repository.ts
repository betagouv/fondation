import { eq } from 'drizzle-orm';
import { SessionRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/session-repository';
import { UserSession } from 'src/identity-and-access-context/business-logic/models/session';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { sessions } from './schema/session-pm';

export class SqlSessionRepository implements SessionRepository {
  session(sessionId: string): DrizzleTransactionableAsync<UserSession | null> {
    return async (db) => {
      const sessionRow = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionId, sessionId))
        .execute();
      return sessionRow.length === 0
        ? null
        : SqlSessionRepository.mapToDomain(sessionRow[0]!);
    };
  }
  create(session: UserSession): DrizzleTransactionableAsync<void> {
    return async (db) => {
      const sessionRow = SqlSessionRepository.mapToDb(session);
      await db.insert(sessions).values(sessionRow).execute();
    };
  }

  static mapToDomain(sessionRow: typeof sessions.$inferSelect): UserSession {
    return new UserSession(
      sessionRow.createdAt,
      sessionRow.expiresAt,
      sessionRow.userId,
      sessionRow.sessionId,
    );
  }
  static mapToDb(session: UserSession): typeof sessions.$inferInsert {
    return {
      sessionId: session.sessionId,
      userId: session.userId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  }
}
