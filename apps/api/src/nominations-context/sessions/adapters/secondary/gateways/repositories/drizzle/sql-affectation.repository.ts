import { desc, eq, sql } from 'drizzle-orm';
import { PrioriteEnum } from 'shared-models';
import {
  dossierDeNominationPm,
  drizzleNominationFileToReporterPm,
} from 'src/modules/framework/drizzle/schemas';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import { Affectation } from 'src/nominations-context/sessions/business-logic/models/affectation';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { toFormation } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { affectationPm } from './schema/affectation-pm';

export class SqlAffectationRepository implements AffectationRepository {
  save(affectation: Affectation): DrizzleTransactionableAsync<void> {
    return async (db) => {
      const affectationSnapshot = affectation.snapshot();
      await db
        .insert(affectationPm)
        .values(affectationSnapshot)
        .onConflictDoUpdate({
          target: affectationPm.id,
          set: {
            formation: affectationSnapshot.formation,
            version: affectationSnapshot.version,
            statut: affectationSnapshot.statut,
            datePublication: affectationSnapshot.datePublication,
            auteurPublication: affectationSnapshot.auteurPublication,
          },
        });

      if (
        affectationSnapshot.affectationsDossiersDeNominations.length > 0 &&
        affectationSnapshot.affectationsDossiersDeNominations.some(
          ({ rapporteurIds }) => rapporteurIds.length > 0,
        )
      ) {
        await db.insert(drizzleNominationFileToReporterPm).values(
          affectationSnapshot.affectationsDossiersDeNominations.flatMap(
            ({ dossierDeNominationId, rapporteurIds }) =>
              rapporteurIds.map((userId) => ({
                userId,
                versionId: affectationSnapshot.id,
                nominationFileId: dossierDeNominationId,
              })),
          ),
        );
      }

      for (const {
        dossierDeNominationId,
        priorite,
      } of affectationSnapshot.affectationsDossiersDeNominations) {
        await db
          .update(dossierDeNominationPm)
          .set({ priorite: priorite ?? null })
          .where(eq(dossierDeNominationPm.id, dossierDeNominationId));
      }
    };
  }

  bySessionId(
    sessionId: string,
  ): DrizzleTransactionableAsync<Affectation | null> {
    return async (db) => {
      const result = await db.query.affectationPm.findFirst({
        where: eq(affectationPm.sessionId, sessionId),
        orderBy: [
          sql`CASE WHEN ${affectationPm.statut} = 'BROUILLON' THEN 0 ELSE 1 END`,
          desc(affectationPm.version),
        ],
        with: {
          affectations: {
            with: {
              nominationFile: {
                columns: {
                  priorite: true,
                },
              },
            },
          },
        },
      });

      if (!result) {
        return null;
      }

      const affectationsDossiersDeNominations = Array.from(
        result.affectations
          .reduce(
            (map, affectation) => {
              const x = map.get(affectation.nominationFileId) ?? {
                dossierDeNominationId: affectation.nominationFileId,
                priorite: affectation.nominationFile?.priorite ?? undefined,
                rapporteurIds: [] as string[],
              };
              x.rapporteurIds.push(affectation.userId);
              map.set(affectation.nominationFileId, x);
              return map;
            },
            new Map<
              string,
              {
                dossierDeNominationId: string;
                priorite?: PrioriteEnum;
                rapporteurIds: string[];
              }
            >(),
          )
          .values(),
      );

      return Affectation.fromSnapshot({
        ...result,
        affectationsDossiersDeNominations,
        formation: toFormation(result.formation),
        datePublication: result.datePublication ?? undefined,
        auteurPublication: result.auteurPublication ?? undefined,
      });
    };
  }
}
