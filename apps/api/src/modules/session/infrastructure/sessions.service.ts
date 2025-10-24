import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import z from 'zod';

import { TypeDeSaisine } from 'shared-models';

import { Db } from 'src/modules/framework/drizzle';
import {
  affectationPm,
  sessionPm,
} from 'src/modules/framework/drizzle/schemas';

@Injectable()
export class SessionService {
  constructor(private readonly db: Db) {}

  async listSessionsOfTypeGardeDesSceaux(
    userId: string,
  ): Promise<ListSessionOfTypeGardeDesSceauxResponse> {
    const affectedReporter = this.db
      .select({
        sessionId: affectationPm.sessionId,
        id: sql<string>`(jsonb_array_elements_text(unnest(${affectationPm.affectationsDossiersDeNominations})->'rapporteursIds'))::uuid`,
      })
      .from(affectationPm)
      .as('affectedReporter');

    const result = await this.db
      .select()
      .from(affectedReporter)
      .innerJoin(sessionPm, eq(sessionPm.id, affectedReporter.sessionId))
      .where(
        and(
          eq(affectedReporter.id, userId),
          eq(sessionPm.typeDeSaisine, TypeDeSaisine.TRANSPARENCE_GDS),
        ),
      );

    const items = result.reduce(
      (list, { session }) => {
        const label = SessionService.labelizeSession(session);
        if (!label) return list;

        list.push({
          label,
          id: session.id,
          formation: session.formation,
          typeDeSaisine: session.typeDeSaisine,
        });
        return list;
      },
      [] as ListSessionOfTypeGardeDesSceauxResponse['items'],
    );

    return { items };
  }

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
      formation: z.string(), // z.nativeEnum(Magistrat.Formation),
      typeDeSaisine: z.string(), // z.nativeEnum(TypeDeSaisine),
    }),
  ),
});

export type ListSessionOfTypeGardeDesSceauxResponse = z.infer<
  typeof ListSessionOfTypeGardeDesSceauxResponseSchema
>;
