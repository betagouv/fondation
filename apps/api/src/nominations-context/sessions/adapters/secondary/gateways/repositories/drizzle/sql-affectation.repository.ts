import { and, desc, eq, max, sql, inArray } from 'drizzle-orm';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import {
  Affectation,
  affectationsDossiersDeNominationsSchema,
  StatutAffectation,
} from 'src/nominations-context/sessions/business-logic/models/affectation';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { toFormation } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import z from 'zod';
import { affectationPm } from './schema/affectation-pm';
import {
  dossierDeNominationPm,
  drizzleDossierRapporteur,
} from 'src/modules/framework/drizzle/schemas';
import { PrioriteEnum } from 'shared-models';
import { isDefined } from 'src/utils/is-defined';

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

  static mapToDomain(row: typeof affectationPm.$inferSelect): Affectation {
    return Affectation.fromSnapshot({
      ...row,
      formation: toFormation(row.formation),
      affectationsDossiersDeNominations: z
        .array(affectationsDossiersDeNominationsSchema)
        .parse(row.affectationsDossiersDeNominations),
      datePublication: row.datePublication ?? undefined,
      auteurPublication: row.auteurPublication ?? undefined,
    });
  }
}
