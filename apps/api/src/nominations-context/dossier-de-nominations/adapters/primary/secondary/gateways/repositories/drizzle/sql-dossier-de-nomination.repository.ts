import { eq } from 'drizzle-orm';
import { DossierDeNominationRepository } from 'src/nominations-context/dossier-de-nominations/business-logic/gateways/repositories/dossier-de-nomination.repository';

import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import {
  DossierDeNomination,
  dossierDeNominationContentSchema,
} from 'src/nominations-context/dossier-de-nominations/business-logic/models/dossier-de-nomination';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { dossierDeNominationPm } from './schema/dossier-de-nomination-pm';

export class SqlDossierDeNominationRepository
  implements DossierDeNominationRepository
{
  save(
    dossierDeNomination: DossierDeNomination,
  ): DrizzleTransactionableAsync<void> {
    return async (db) => {
      const snapshot = dossierDeNomination.snapshot();

      const existingDossier = await db
        .select({ id: dossierDeNominationPm.id })
        .from(dossierDeNominationPm)
        .where(eq(dossierDeNominationPm.id, snapshot.id))
        .limit(1);

      if (existingDossier.length === 0) {
        const dossierDb =
          SqlDossierDeNominationRepository.mapToDb(dossierDeNomination);
        await db.insert(dossierDeNominationPm).values(dossierDb);
      } else {
        await db
          .update(dossierDeNominationPm)
          .set({
            content: snapshot.content,
          })
          .where(eq(dossierDeNominationPm.id, snapshot.id));
      }
    };
  }

  dossierDeNomination(
    id: string,
  ): DrizzleTransactionableAsync<DossierDeNomination | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(dossierDeNominationPm)
        .where(eq(dossierDeNominationPm.id, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return SqlDossierDeNominationRepository.mapToDomain(result[0]!);
    };
  }

  findBySessionId(
    sessionId: string,
  ): DrizzleTransactionableAsync<DossierDeNomination[]> {
    return async (db) => {
      const result = await db
        .select()
        .from(dossierDeNominationPm)
        .where(eq(dossierDeNominationPm.sessionId, sessionId));

      return result.map(SqlDossierDeNominationRepository.mapToDomain);
    };
  }

  findByImportedId(
    id: string,
  ): DrizzleTransactionableAsync<DossierDeNomination | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(dossierDeNominationPm)
        .where(eq(dossierDeNominationPm.dossierDeNominationImportéId, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return SqlDossierDeNominationRepository.mapToDomain(result[0]!);
    };
  }

  static mapToDb(
    dossier: DossierDeNomination,
  ): typeof dossierDeNominationPm.$inferInsert {
    return SqlDossierDeNominationRepository.mapSnapshotToDb(dossier.snapshot());
  }

  static mapSnapshotToDb(
    snapshot: DossierDeNominationSnapshot,
  ): typeof dossierDeNominationPm.$inferInsert {
    return {
      id: snapshot.id,
      sessionId: snapshot.sessionId,
      dossierDeNominationImportéId: snapshot.nominationFileImportedId,
      content: snapshot.content,
    };
  }

  static mapToDomain(
    row: typeof dossierDeNominationPm.$inferSelect,
  ): DossierDeNomination {
    return DossierDeNomination.fromSnapshot({
      id: row.id,
      sessionId: row.sessionId,
      nominationFileImportedId: row.dossierDeNominationImportéId,
      content: dossierDeNominationContentSchema.parse(row.content),
    });
  }
}
