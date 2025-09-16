import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  DateOnlyJson,
  Magistrat,
  SessionMetadata,
  TypeDeSaisine,
} from 'shared-models';
import { transparencesPm } from 'src/data-administration-context/transparences/adapters/secondary/gateways/repositories/drizzle/schema';
import { TransparenceRepository } from 'src/nominations-context/pp-gds/transparences/business-logic/gateways/repositories/transparence.repository';

import { sessionPm } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/schema/session-pm';
import { Session } from 'src/nominations-context/sessions/business-logic/models/session';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
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
    sessionIds: string[],
  ): DrizzleTransactionableAsync<SessionMetadata[]> {
    return async (db) => {
      const transparencesResult = await db
        .select()
        .from(transparencesPm)
        .where(inArray(transparencesPm.id, sessionIds))
        .execute();

      return transparencesResult.map((transparenceRow) =>
        SessionMetadata.fromSnapshot({
          sessionImportId: transparenceRow.id,
          name: z.string().parse(transparenceRow.name),
          formation: transparenceRow.formation,
          dateTransparence: DateOnly.fromDate(
            transparenceRow.dateTransparence,
          ).toJson(),
          dateEcheance: transparenceRow.dateEchéance
            ? DateOnly.fromDate(transparenceRow.dateEchéance).toJson()
            : null,
          typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
        }),
      );
    };
  }

  static mapToDomain(row: typeof sessionPm.$inferSelect) {
    return Session.fromSnapshot(row);
  }
}
