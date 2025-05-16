import { eq } from 'drizzle-orm';
import { AffectationRepository } from 'src/nominations-context/business-logic/gateways/repositories/affectation.repository';
import {
  Affectation,
  affectationsDossiersDeNominationsSchema,
  AffectationSnapshot,
} from 'src/nominations-context/business-logic/models/affectation';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { affectationPm } from './schema/affectation-pm';

export class SqlAffectationRepository implements AffectationRepository {
  save(affectation: Affectation): DrizzleTransactionableAsync<void> {
    return async (db) => {
      const affectationSnapshot = affectation.snapshot();

      const existingAffectation = await db
        .select({ id: affectationPm.id })
        .from(affectationPm)
        .where(eq(affectationPm.id, affectationSnapshot.id))
        .limit(1);

      if (existingAffectation.length === 0) {
        const affectationDb = SqlAffectationRepository.mapToDb(affectation);
        await db.insert(affectationPm).values(affectationDb);
      } else {
        await db
          .update(affectationPm)
          .set({
            formation: affectationSnapshot.formation,
            affectationsDossiersDeNominations:
              affectationSnapshot.affectationsDossiersDeNominations,
          })
          .where(eq(affectationPm.id, affectationSnapshot.id));
      }
    };
  }

  bySessionId(
    sessionId: string,
  ): DrizzleTransactionableAsync<Affectation | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(affectationPm)
        .where(eq(affectationPm.sessionId, sessionId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return SqlAffectationRepository.mapToDomain(result[0]!);
    };
  }

  static mapToDb(affectation: Affectation): typeof affectationPm.$inferInsert {
    return SqlAffectationRepository.mapSnapshotToDb(affectation.snapshot());
  }

  static mapSnapshotToDb(
    snapshot: AffectationSnapshot,
  ): typeof affectationPm.$inferInsert {
    return snapshot;
  }

  static mapToDomain(row: typeof affectationPm.$inferSelect): Affectation {
    return Affectation.fromSnapshot({
      ...row,
      affectationsDossiersDeNominations:
        row.affectationsDossiersDeNominations.map((a) =>
          affectationsDossiersDeNominationsSchema.parse(a),
        ),
    });
  }
}
