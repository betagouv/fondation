import { and, desc, eq, max, sql } from 'drizzle-orm';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import {
  Affectation,
  affectationsDossiersDeNominationsSchema,
  AffectationSnapshot,
  StatutAffectation,
} from 'src/nominations-context/sessions/business-logic/models/affectation';
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
            version: affectationSnapshot.version,
            statut: affectationSnapshot.statut,
            datePublication: affectationSnapshot.datePublication,
            auteurPublication: affectationSnapshot.auteurPublication,
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
        .orderBy(
          sql`CASE WHEN ${affectationPm.statut} = 'BROUILLON' THEN 0 ELSE 1 END`,
          desc(affectationPm.version),
        )
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return SqlAffectationRepository.mapToDomain(result[0]!);
    };
  }

  derniereVersionPubliee(
    sessionId: string,
  ): DrizzleTransactionableAsync<Affectation | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(affectationPm)
        .where(
          and(
            eq(affectationPm.sessionId, sessionId),
            eq(affectationPm.statut, StatutAffectation.PUBLIEE),
          ),
        )
        .orderBy(desc(affectationPm.version))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return SqlAffectationRepository.mapToDomain(result[0]!);
    };
  }

  versionBrouillon(
    sessionId: string,
  ): DrizzleTransactionableAsync<Affectation | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(affectationPm)
        .where(
          and(
            eq(affectationPm.sessionId, sessionId),
            eq(affectationPm.statut, StatutAffectation.BROUILLON),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return SqlAffectationRepository.mapToDomain(result[0]!);
    };
  }

  prochainNumeroVersion(
    sessionId: string,
  ): DrizzleTransactionableAsync<number> {
    return async (db) => {
      const result = await db
        .select({ maxVersion: max(affectationPm.version) })
        .from(affectationPm)
        .where(eq(affectationPm.sessionId, sessionId));

      const dernierNumero = result[0]?.maxVersion ?? 0;
      return dernierNumero + 1;
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
      datePublication: row.datePublication ?? undefined,
      auteurPublication: row.auteurPublication ?? undefined,
      affectationsDossiersDeNominations:
        row.affectationsDossiersDeNominations.map((a) =>
          affectationsDossiersDeNominationsSchema.parse(a),
        ),
    });
  }
}
