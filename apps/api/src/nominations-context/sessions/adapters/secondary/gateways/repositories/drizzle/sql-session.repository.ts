import { eq } from 'drizzle-orm';
import { SessionSnapshot } from 'shared-models/models/session/session-content';
import { SessionRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/session.repository';
import { Session } from 'src/nominations-context/sessions/business-logic/models/session';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { sessionPm } from './schema/session-pm';
import { toFormation } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { toTypeDeSaisine } from './schema';

export class SqlSessionRepository implements SessionRepository {
  findAll(): DrizzleTransactionableAsync<Session[]> {
    return async (db) => {
      const result = await db.select().from(sessionPm);
      return result.map(SqlSessionRepository.mapToDomain);
    };
  }

  save(session: Session): DrizzleTransactionableAsync<void> {
    return async (db) => {
      const sessionSnapshot = session.snapshot();

      const existingSession = await db
        .select({ id: sessionPm.id })
        .from(sessionPm)
        .where(eq(sessionPm.id, sessionSnapshot.id))
        .limit(1);

      if (existingSession.length === 0) {
        const sessionDb = SqlSessionRepository.mapToDb(session);
        await db.insert(sessionPm).values({ ...sessionDb, version: 1 });
      } else {
        await db
          .update(sessionPm)
          .set({
            name: sessionSnapshot.name,
            formation: sessionSnapshot.formation,
            typeDeSaisine: sessionSnapshot.typeDeSaisine,
            version: sessionSnapshot.version + 1,
          })
          .where(eq(sessionPm.id, sessionSnapshot.id));
      }
    };
  }

  session(id: string): DrizzleTransactionableAsync<Session | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(sessionPm)
        .where(eq(sessionPm.id, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const sessionRow = result[0]!;
      return SqlSessionRepository.mapToDomain(sessionRow);
    };
  }

  bySessionImportéeId(
    sessionImportéeId: string,
  ): DrizzleTransactionableAsync<Session | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(sessionPm)
        .where(eq(sessionPm.sessionImportéeId, sessionImportéeId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const sessionRow = result[0]!;
      return SqlSessionRepository.mapToDomain(sessionRow);
    };
  }

  static mapToDb(session: Session): typeof sessionPm.$inferInsert {
    return SqlSessionRepository.mapSnapshotToDb(session.snapshot());
  }

  static mapSnapshotToDb(
    sessionSnapshot: SessionSnapshot,
  ): typeof sessionPm.$inferInsert {
    return sessionSnapshot;
  }

  static mapToDomain(row: typeof sessionPm.$inferSelect): Session {
    return Session.fromSnapshot({
      ...row,
      formation: toFormation(row.formation),
      typeDeSaisine: toTypeDeSaisine(row.typeDeSaisine),
    });
  }
}
