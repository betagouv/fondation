import { eq } from 'drizzle-orm';
import { PréAnalyseRepository } from 'src/nominations-context/business-logic/gateways/repositories/pré-analyse.repository';
import {
  PréAnalyse,
  PréAnalyseSnapshot,
  règlesSchema,
} from 'src/nominations-context/business-logic/models/pré-analyse';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { préAnalysePm } from './schema/pre-analyse-pm';

export class SqlPréAnalyseRepository implements PréAnalyseRepository {
  save(préAnalyse: PréAnalyse): DrizzleTransactionableAsync<void> {
    return async (db) => {
      const snapshot = préAnalyse.snapshot();

      const existingPréAnalyse = await db
        .select({ id: préAnalysePm.id })
        .from(préAnalysePm)
        .where(eq(préAnalysePm.id, snapshot.id))
        .limit(1);

      if (existingPréAnalyse.length === 0) {
        const préAnalyseDb = SqlPréAnalyseRepository.mapToDb(préAnalyse);
        await db.insert(préAnalysePm).values(préAnalyseDb);
      } else {
        await db
          .update(préAnalysePm)
          .set({
            règles: snapshot.règles,
          })
          .where(eq(préAnalysePm.id, snapshot.id));
      }
    };
  }

  findById(id: string): DrizzleTransactionableAsync<PréAnalyse | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(préAnalysePm)
        .where(eq(préAnalysePm.id, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return SqlPréAnalyseRepository.mapToDomain(result[0]!);
    };
  }

  findByDossierId(
    dossierId: string,
  ): DrizzleTransactionableAsync<PréAnalyse | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(préAnalysePm)
        .where(eq(préAnalysePm.dossierDeNominationId, dossierId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return SqlPréAnalyseRepository.mapToDomain(result[0]!);
    };
  }

  static mapToDb(préAnalyse: PréAnalyse): typeof préAnalysePm.$inferInsert {
    return SqlPréAnalyseRepository.mapSnapshotToDb(préAnalyse.snapshot());
  }

  static mapSnapshotToDb(
    snapshot: PréAnalyseSnapshot,
  ): typeof préAnalysePm.$inferInsert {
    return snapshot;
  }

  static mapToDomain(row: typeof préAnalysePm.$inferSelect): PréAnalyse {
    return PréAnalyse.fromSnapshot({
      ...row,
      règles: règlesSchema.parse(row.règles),
    });
  }
}
