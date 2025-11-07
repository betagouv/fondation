import { eq, inArray, max } from 'drizzle-orm';
import { PrioriteEnum } from 'shared-models';
import {
  dossierDeNominationPm,
  drizzleDossierRapporteur,
  drizzlePrioriteEnum,
  toPriorite,
} from 'src/modules/framework/drizzle/schemas';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import {
  Affectation,
  StatutAffectation,
} from 'src/nominations-context/sessions/business-logic/models/affectation';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { toFormation } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { isDefined } from 'src/utils/is-defined';
import { affectationPm } from './schema/affectation-pm';

export class SqlAffectationRepository implements AffectationRepository {
  save(affectation: Affectation): DrizzleTransactionableAsync<void> {
    return async (db) => {
      const affectationSnapshot = affectation.snapshot();

      await db
        .delete(drizzleDossierRapporteur)
        .where(
          inArray(
            drizzleDossierRapporteur.dossierId,
            Array.from(
              new Set(
                affectationSnapshot.affectationsDossiersDeNominations.map(
                  ({ dossierDeNominationId }) => dossierDeNominationId,
                ),
              ),
            ),
          ),
        );

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
            affectationsDossiersDeNominations:
              affectationSnapshot.affectationsDossiersDeNominations,
          },
        });

      await db.insert(drizzleDossierRapporteur).values(
        affectationSnapshot.affectationsDossiersDeNominations.flatMap((d) =>
          d.rapporteurIds.map((userId) => ({
            userId,
            versionId: affectationSnapshot.id,
            dossierId: d.dossierDeNominationId,
          })),
        ),
      );

      const affectationByPriority =
        affectationSnapshot.affectationsDossiersDeNominations
          .filter((a): a is typeof a & { priorite: PrioriteEnum } =>
            isDefined(a.priorite),
          )
          .reduce((byPriority, { priorite, dossierDeNominationId }) => {
            const list = byPriority.get(priorite) ?? [];
            list.push(dossierDeNominationId);
            byPriority.set(priorite, list);

            return byPriority;
          }, new Map<PrioriteEnum, string[]>());

      for (const [priority, dossierIds] of affectationByPriority.entries()) {
        await db
          .update(dossierDeNominationPm)
          .set({ priority })
          .where(inArray(dossierDeNominationPm.id, dossierIds));
      }
    };
  }

  bySessionId(
    sessionId: string,
  ): DrizzleTransactionableAsync<Affectation | null> {
    return async (db) => {
      const affectation = await db.query.affectationPm.findFirst({
        with: {
          dossierVersRapporteur: {
            columns: { userId: true },
            with: {
              dossierDeNomination: { columns: { id: true, priority: true } },
            },
          },
        },
        where: (a, { eq }) => eq(a.sessionId, sessionId),
        orderBy: (a, { sql, desc }) => [
          sql`CASE WHEN ${a.statut} = ${StatutAffectation.BROUILLON} THEN 0 ELSE 1 END`,
          desc(a.version),
        ],
      });

      if (!affectation) return null;
      return SqlAffectationRepository.mapToDomain(affectation);
    };
  }

  derniereVersionPubliee(
    sessionId: string,
  ): DrizzleTransactionableAsync<Affectation | null> {
    return async (db) => {
      const affectation = await db.query.affectationPm.findFirst({
        with: {
          dossierVersRapporteur: {
            columns: { userId: true },
            with: {
              dossierDeNomination: { columns: { id: true, priority: true } },
            },
          },
        },
        orderBy: (a, { desc }) => [desc(a.version)],
        where: (a, { and, eq }) =>
          and(
            eq(a.sessionId, sessionId),
            eq(a.statut, StatutAffectation.PUBLIEE),
          ),
      });

      if (!affectation) {
        return null;
      }

      return SqlAffectationRepository.mapToDomain(affectation);
    };
  }

  versionBrouillon(
    sessionId: string,
  ): DrizzleTransactionableAsync<Affectation | null> {
    return async (db) => {
      const affectation = await db.query.affectationPm.findFirst({
        with: {
          dossierVersRapporteur: {
            columns: { userId: true },
            with: {
              dossierDeNomination: { columns: { id: true, priority: true } },
            },
          },
        },
        where: (a, { and, eq }) =>
          and(
            eq(a.sessionId, sessionId),
            eq(a.statut, StatutAffectation.BROUILLON),
          ),
      });

      if (!affectation) {
        return null;
      }

      return SqlAffectationRepository.mapToDomain(affectation);
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

  static mapToDomain(
    row: typeof affectationPm.$inferSelect & {
      dossierVersRapporteur: {
        userId: string;
        dossierDeNomination: {
          id: string;
          priority: (typeof drizzlePrioriteEnum)['enumValues'][number] | null;
        };
      }[];
    },
  ): Affectation {
    const affectationByDossierId = row.dossierVersRapporteur.reduce(
      (byDossierId, x) => {
        const dossierDeNominationId = x.dossierDeNomination.id;
        const affectations = byDossierId.get(dossierDeNominationId) ?? {
          rapporteurIds: [],
          dossierDeNominationId,
          priorite: x.dossierDeNomination.priority
            ? toPriorite(x.dossierDeNomination.priority)
            : undefined,
        };
        affectations.rapporteurIds.push(x.userId);

        return byDossierId.set(dossierDeNominationId, affectations);
      },
      new Map<
        string,
        {
          dossierDeNominationId: string;
          priorite: PrioriteEnum | undefined;
          rapporteurIds: string[];
        }
      >(),
    );

    return Affectation.fromSnapshot({
      ...row,
      formation: toFormation(row.formation),
      datePublication: row.datePublication ?? undefined,
      auteurPublication: row.auteurPublication ?? undefined,
      affectationsDossiersDeNominations: Array.from(
        affectationByDossierId.values(),
      ),
    });
  }
}
