import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { listMemberGardeDesSceauxSessions } from '../../../../../generated/prisma/sql';
import { DateOnly } from '../../../../../utils/date-only';
import { Db } from '../../../../framework/database';
import { roleToFormation } from '../../../../members/infrastructure/member.utils';
import { FormationEnum } from '../../../../shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from '../../../../shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from '../../../../shared/mappers/type-de-saisine-enum.mapper';
import type { RoleEnum } from '../../../../shared/role.enum';
import { TypeDeSaisineEnum } from '../../../../shared/type-de-saisine.enum';
import { sessionLabel } from '../../domain/session-label';

@Injectable()
export class ListMemberSessionsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    typeDeSaisine: TypeDeSaisineEnum;
    user: { id: string; role: RoleEnum };
  }): Promise<ListedMemberSessionsDto> {
    const userFormationRestriction = roleToFormation(query.user.role) ?? null;
    const sessions = await this.db.tx.$queryRawTyped(
      listMemberGardeDesSceauxSessions(query.user.id, userFormationRestriction),
    );

    const items = sessions.map((session) => ({
      createdAt: session.createdAt.toISOString(),
      fileCount: Number(session.fileCount ?? 0),
      formation: prismaFormationEnumToFormationEnum(session.formation),
      id: session.id,
      isAffected: (session.reporterIds ?? []).length > 0,
      label: sessionLabel({ date: DateOnly.fromUtcDate(session.date), name: session.name }),
      typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(session.typeDeSaisine),
    }));

    return { items };
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
        formation: z.enum(FormationEnum),
        typeDeSaisine: z.enum(TypeDeSaisineEnum),
      }),
    ),
  }),
) {}
