import { Injectable } from '@nestjs/common';
import z from 'zod';

import {
  DateOnlyJson,
  dateOnlyJsonSchema,
  Magistrat,
  Role,
  TypeDeSaisine,
} from 'shared-models';

import { listMemberGardeDesSceauxSessions } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { assertIsDefined } from 'src/utils/is-defined';

@Injectable()
export class ListSessionOfTypeGardeDesSceauxQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    userId: string;
  }): Promise<ListSessionOfTypeGardeDesSceauxResponse> {
    // TODO: could be provided as parameter
    const { role } = assertIsDefined(
      await this.prisma.user.findFirst({
        select: { role: true },
        where: { id: query.userId },
      }),
    );

    const userFormationRestriction =
      role === Role.MEMBRE_DU_PARQUET
        ? Magistrat.Formation.PARQUET
        : role === Role.MEMBRE_DU_SIEGE
          ? Magistrat.Formation.SIEGE
          : null;

    const sessions = await this.prisma.$queryRawTyped(
      listMemberGardeDesSceauxSessions(query.userId, userFormationRestriction),
    );

    const result = await z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          createdAt: z.date(),
          formation: z.enum(Magistrat.Formation),
          typeDeSaisine: z.enum(TypeDeSaisine),
          reporterIds: z.array(z.string()).nullable(),
          content: z.object({
            dateTransparence: dateOnlyJsonSchema,
          }),
        }),
      )
      .safeParseAsync(sessions);

    if (!result.success) {
      return { items: [] };
    }

    const items = result.data.reduce(
      (list, session) => {
        const label =
          ListSessionOfTypeGardeDesSceauxQuery.labelizeSession(session);
        if (!label) return list;

        list.push({
          label,
          id: session.id,
          formation: session.formation,
          typeDeSaisine: session.typeDeSaisine,
          isAffected: (session.reporterIds ?? []).length > 0,
          createdAt: session.createdAt.toISOString(),
        });
        return list;
      },
      [] as ListSessionOfTypeGardeDesSceauxResponse['items'],
    );

    return { items };
  }

  // TODO: extract
  private static labelizeSession(session: {
    content: { dateTransparence: DateOnlyJson };
    name: string;
  }): string | null {
    const { day, month, year } = session.content.dateTransparence;
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
