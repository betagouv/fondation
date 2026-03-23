import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { Magistrat } from 'shared-models';
import {
  PrismaUserDutyEnum,
  PrismaUserTitleEnum,
} from 'src/generated/prisma/enums';
import { PrismaService } from 'src/modules/framework/database';
import { formationToMemberRole } from 'src/modules/shared/formation-to-member-role';
import { roleEnumToPrismaRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';

@Injectable()
export class FindChairmenQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    formation: Magistrat.Formation | undefined;
  }): Promise<FoundChairmenDto> {
    const users = await this.prisma.user.findMany({
      where: {
        duty: 'PRESIDENT',
        role: {
          in: formationToMemberRole(query.formation).map(
            roleEnumToPrismaRoleEnum,
          ),
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
        duty: true,
        displayTitle: true,
      },
    });

    return {
      items: users
        .filter(
          (u): u is typeof u & { duty: 'PRESIDENT' } => u.duty === 'PRESIDENT',
        )
        .map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          duty: u.duty,
          title: u.title,
          displayTitle: u.displayTitle ?? null,
        })),
    };
  }
}

export class SearchChairmenQueryDto extends createZodDto(
  z.object({ formation: z.enum(Magistrat.Formation).optional() }),
) {}

export class FoundChairmenDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        duty: z.enum([PrismaUserDutyEnum.PRESIDENT]),
        title: z.enum(PrismaUserTitleEnum).nullable(),
        displayTitle: z.string().nullable(),
      }),
    ),
  }),
) {}
