import { and, eq, sql } from 'drizzle-orm';
import { DateOnlyJson, Magistrat, TypeDeSaisine } from 'shared-models';
import { TransparenceRepository } from 'src/nominations-context/pp-gds/transparences/business-logic/gateways/repositories/transparence.repository';
import { sessionPm } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/schema/session-pm';
import { Session } from 'src/nominations-context/sessions/business-logic/models/session';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';

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

  static mapToDomain(row: typeof sessionPm.$inferSelect) {
    return Session.fromSnapshot(row);
  }
}
