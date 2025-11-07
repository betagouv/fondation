import { Injectable } from '@nestjs/common';
import { and, eq, isNull, or } from 'drizzle-orm';
import z from 'zod';

import { Magistrat, Role, TypeDeSaisine } from 'shared-models';

import { Db } from 'src/modules/framework/drizzle';
import {
  dossierDeNominationPm,
  drizzleDossierRapporteur,
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
    return this.db.transaction(async (tx) => {
      // TODO: could be provided as parameter
      const { role } = assertIsDefined(
        await tx.query.users.findFirst({
          where: eq(users.id, query.userId),
        }),
      );

      const userFormationRestriction =
        role === Role.MEMBRE_DU_PARQUET
          ? Magistrat.Formation.PARQUET
          : role === Role.MEMBRE_DU_SIEGE
            ? Magistrat.Formation.SIEGE
            : null;

      const allSessions = await tx
        .select()
        .from(sessionPm)
        .leftJoin(
          dossierDeNominationPm,
          eq(dossierDeNominationPm.sessionId, sessionPm.id),
        )
        .leftJoin(
          drizzleDossierRapporteur,
          eq(drizzleDossierRapporteur.dossierId, dossierDeNominationPm.id),
        )
        .where(
          and(
            eq(sessionPm.typeDeSaisine, TypeDeSaisine.TRANSPARENCE_GDS),
            or(
              isNull(drizzleDossierRapporteur.userId),
              eq(drizzleDossierRapporteur.userId, query.userId),
            ),

            userFormationRestriction
              ? eq(sessionPm.formation, userFormationRestriction)
              : undefined,
          ),
        );

      const items = allSessions.reduce(
        (list, { session, dossier_rapporteur }) => {
          const label =
            ListSessionOfTypeGardeDesSceauxQuery.labelizeSession(session);
          if (!label) return list;

          list.push({
            label,
            id: session.id,
            formation: session.formation,
            typeDeSaisine: session.typeDeSaisine,
            isAffected: isDefined(dossier_rapporteur?.userId),
            createdAt: session.createdAt.toISOString(),
          });
          return list;
        },
        [] as ListSessionOfTypeGardeDesSceauxResponse['items'],
      );

      return { items };
    });
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
      createdAt: z.iso.datetime(),
      isAffected: z.boolean(),
      formation: z.string(), // z.nativeEnum(Magistrat.Formation),
      typeDeSaisine: z.string(), // z.nativeEnum(TypeDeSaisine),
    }),
  ),
});

export type ListSessionOfTypeGardeDesSceauxResponse = z.infer<
  typeof ListSessionOfTypeGardeDesSceauxResponseSchema
>;
