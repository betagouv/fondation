import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  DateOnlyJson,
  Magistrat,
  SessionMetadata,
  TypeDeSaisine,
} from 'shared-models';
import { transparencesPm } from 'src/data-administration-context/transparences/adapters/secondary/gateways/repositories/drizzle/schema';
import { TransparenceRepository } from 'src/nominations-context/pp-gds/transparences/business-logic/gateways/repositories/transparence.repository';
import { toTypeDeSaisine } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/schema';

import { sessionPm } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/schema/session-pm';
import { Session } from 'src/nominations-context/sessions/business-logic/models/session';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { toFormation } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { z } from 'zod';

export class SqlTransparenceRepository implements TransparenceRepository {
  byNomFormationEtDate(
    nom: string,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ): DrizzleTransactionableAsync<Session<TypeDeSaisine.TRANSPARENCE_GDS> | null> {
    return async (db) => {
      const year = dateTransparence.year.toString();
      const month = dateTransparence.month.toString();
      const day = dateTransparence.day.toString();

      const result = await db
        .select()
        .from(sessionPm)
        .where(
          and(
            eq(sessionPm.name, nom),
            eq(sessionPm.formation, formation),
            sql`content @> '{"dateTransparence": {"year": ${sql.raw(year)}, "month": ${sql.raw(month)}, "day": ${sql.raw(day)}}}'::jsonb`,
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const sessionRow = result[0]!;
      return SqlTransparenceRepository.mapToDomain(sessionRow);
    };
  }

  findMetaDataBySessionIds(
    sessions: Session[],
  ): DrizzleTransactionableAsync<SessionMetadata[]> {
    return async (db) => {
      const sessionIds = sessions.map((session) => session.sessionImportId);
      const transparencesResult = await db
        .select()
        .from(transparencesPm)
        .where(inArray(transparencesPm.id, sessionIds))
        .execute();

      return transparencesResult
        .map((transparenceRow) => {
          const matchingSession = sessions.find(
            (session) => session.sessionImportId === transparenceRow.id,
          );
          if (!matchingSession) return null;
          return SessionMetadata.fromSnapshot({
            sessionId: matchingSession.id,
            sessionImportId: transparenceRow.id,
            name: z.string().parse(transparenceRow.name),
            formation: toFormation(transparenceRow.formation),
            dateTransparence: DateOnly.fromDate(
              transparenceRow.dateTransparence,
            ).toJson(),
            dateEcheance: transparenceRow.dateEchéance
              ? DateOnly.fromDate(transparenceRow.dateEchéance).toJson()
              : null,
            typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
          });
        })
        .filter((metadata): metadata is SessionMetadata => metadata !== null);
    };
  }

  static mapToDomain(row: typeof sessionPm.$inferSelect) {
    return Session.fromSnapshot({
      ...row,
      formation: toFormation(row.formation),
      typeDeSaisine: toTypeDeSaisine(row.typeDeSaisine),
    });
  }
}
