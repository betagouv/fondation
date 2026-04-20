import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { Gender } from 'shared-models';
import {
  PrismaUserDutyEnum,
  PrismaUserTitleEnum,
} from 'src/generated/prisma/enums';
import { PrismaService } from 'src/modules/framework/database';
import { formationToMemberRole } from 'src/modules/shared/formation-to-member-role';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { roleEnumToPrismaRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { z } from 'zod';

@Injectable()
export class FindMembersForNewOfficialReportQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    sessionId: string;
  }): Promise<FoundMembersForNewOfficialReportDto> {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: query.sessionId },
        select: { formation: true },
      });
      if (!session) throw new NotFoundException();

      const members = await tx.user.findMany({
        where: {
          role: {
            in: formationToMemberRole(
              prismaFormationEnumToFormationEnum(session.formation),
            ).map(roleEnumToPrismaRoleEnum),
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          title: true,
          displayTitle: true,
          duty: true,
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });

      return {
        items: members.map((m) => ({
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          gender: prismaGenderEnumToGenderEnum(m.gender),
          title: m.title ?? null,
          displayTitle: m.displayTitle ?? null,
          duty: m.duty ?? null,
        })),
      };
    });
  }
}

export class FoundMembersForNewOfficialReportDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        gender: z.enum(Gender),
        title: z.enum(PrismaUserTitleEnum).nullable(),
        displayTitle: z.string().nullable(),
        duty: z.enum(PrismaUserDutyEnum).nullable(),
      }),
    ),
  }),
) {}
