import { Injectable } from '@nestjs/common';
import z from 'zod';
import { createZodDto } from 'nestjs-zod';

import { Magistrat, Role, TypeDeSaisine } from 'shared-models';

import { listMemberGardeDesSceauxSessions } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';

@Injectable()
export class InternalListMemberSessionsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    typeDeSaisine: TypeDeSaisine;
    user: { id: string; role: Role };
  }): Promise<ListedMemberSessionsDto> {
    const userFormationRestriction = roleToFormation(query.user.role) ?? null;
    const sessions = await this.prisma.$queryRawTyped(
      listMemberGardeDesSceauxSessions(query.user.id, userFormationRestriction),
    );

    const items = sessions.map((session) => {
      const label = InternalListMemberSessionsQuery.labelizeSession(session);

      return {
        label,
        id: session.id,
        isAffected: (session.reporterIds ?? []).length > 0,
        createdAt: session.createdAt.toISOString(),
        fileCount: Number(session.fileCount ?? 0),
        formation: prismaFormationEnumToFormationEnum(session.formation),
        typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(
          session.typeDeSaisine,
        ),
      };
    });

    return { items };
  }

  // TODO: extract
  private static labelizeSession(session: {
    date: Date;
    name: string;
  }): string {
    const { date: d } = session;
    const formattedDate = [
      d.getUTCDate(),
      d.getUTCMonth() + 1,
      d.getUTCFullYear(),
    ]
      .map((x) => x.toString().padStart(2, '0'))
      .join('/');

    return `T ${formattedDate} (${session.name})`;
  }
}

export class ListedMemberSessionsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        createdAt: z.iso.datetime(),
        isAffected: z.boolean(),
        fileCount: z.number(),
        formation: z.enum(Magistrat.Formation),
        typeDeSaisine: z.enum(TypeDeSaisine),
      }),
    ),
  }),
) {}
