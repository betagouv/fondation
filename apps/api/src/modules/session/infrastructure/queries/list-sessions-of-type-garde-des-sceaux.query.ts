import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import z from 'zod';

import { Magistrat, Role, TypeDeSaisine } from 'shared-models';

import { Db } from 'src/modules/framework/drizzle';
import {
  affectationPm,
  sessionPm,
  users,
} from 'src/modules/framework/drizzle/schemas';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';

@Injectable()
export class ListSessionOfTypeGardeDesSceauxQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    userId: string;
  }): Promise<ListSessionOfTypeGardeDesSceauxResponse> {
    // TODO: could be provided as parameter
    const { role } = assertIsDefined(
      await this.db.query.users.findFirst({
        where: eq(users.id, query.userId),
      }),
    );

    const userFormationRestriction =
      role === Role.MEMBRE_DU_PARQUET
        ? Magistrat.Formation.PARQUET
        : role === Role.MEMBRE_DU_SIEGE
          ? Magistrat.Formation.SIEGE
          : null;

    const affectedReporter = this.db
      .select({
        sessionId: affectationPm.sessionId,
        id: sql<string>`(jsonb_array_elements_text(unnest(${affectationPm.affectationsDossiersDeNominations})->'rapporteursIds'))::uuid`.as(
          'rapporteurId',
        ),
      })
      .from(affectationPm)
      .as('affectedReporter');

    const allSessions = await this.db
      .select()
      .from(sessionPm)
      .leftJoin(affectedReporter, eq(affectedReporter.sessionId, sessionPm.id))
      .where(
        and(
          eq(sessionPm.typeDeSaisine, TypeDeSaisine.TRANSPARENCE_GDS),
          or(
            isNull(affectedReporter.sessionId),
            eq(affectedReporter.id, query.userId),
          ),
          userFormationRestriction
            ? eq(sessionPm.formation, userFormationRestriction)
            : undefined,
        ),
      )
      .orderBy(desc(sessionPm.createdAt));

    const items = allSessions.reduce(
      (list, { session, affectedReporter }) => {
        const label =
          ListSessionOfTypeGardeDesSceauxQuery.labelizeSession(session);
        if (!label) return list;

        list.push({
          label,
          id: session.id,
          formation: session.formation,
          typeDeSaisine: session.typeDeSaisine,
          isAffected: isDefined(affectedReporter),
          createdAt: session.createdAt.toISOString(),
        });
        return list;
      },
      [] as ListSessionOfTypeGardeDesSceauxResponse['items'],
    );

    return { items };
  }

  // TODO: extract
  private static labelizeSession(
    session: typeof sessionPm.$inferSelect,
  ): string | null {
    const result = z
      .object({
        dateTransparence: z.object({
          day: z.number(),
          month: z.number(),
          year: z.number(),
        }),
      })
      .safeParse(session.content);

    if (!result.success) return null;

    const { day, month, year } = result.data.dateTransparence;
    const formattedDate = `${day.toString().padStart(2, '0')}/${month
      .toString()
      .padStart(2, '0')}/${year}`;

    return `T ${formattedDate} (${session.name})`;
  }
}
export const ListSessionOfTypeGardeDesSceauxResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      createdAt: z.string().datetime(),
      isAffected: z.boolean(),
      formation: z.string(), // z.nativeEnum(Magistrat.Formation),
      typeDeSaisine: z.string(), // z.nativeEnum(TypeDeSaisine),
    }),
  ),
});

export type ListSessionOfTypeGardeDesSceauxResponse = z.infer<
  typeof ListSessionOfTypeGardeDesSceauxResponseSchema
>;
