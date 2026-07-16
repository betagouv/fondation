import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PrismaUserDutyEnum, PrismaUserTitleEnum } from 'src/generated/prisma/enums';
import { UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { PrismaService } from 'src/modules/framework/database';
import { formationToMemberRole } from 'src/modules/shared/formation-to-member-role';
import { formationToUserTitle } from 'src/modules/shared/formation-to-user-title';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { roleEnumToPrismaRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';

@Injectable()
export class FindChairmenQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { formation: FormationEnum | undefined }): Promise<FoundChairmenDto> {
    const users = await this.prisma.user.findMany({
      where: {
        duty: 'PRESIDENT',
        role: {
          in: formationToMemberRole(query.formation).map(roleEnumToPrismaRoleEnum),
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
      items: users.filter(isUserChairman(query.formation)).map((u) => ({
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

type TitledPrismaUser = { duty: PrismaUserDutyEnum | null; title: PrismaUserTitleEnum | null };

type Chairman<User> = User & { title: Exclude<UserTitleEnum, 'FIRST_SECRETARY'>; duty: 'PRESIDENT' };

function isUserChairman(formation: FormationEnum | undefined) {
  const titles = formationToUserTitle(formation);
  return <U extends TitledPrismaUser>(user: U): user is Chairman<U> =>
    user.duty === 'PRESIDENT' && titles.includes(user.title);
}

export class SearchChairmenQueryDto extends createZodDto(
  z.object({ formation: z.enum(FormationEnum).optional() }),
) {}

export class FoundChairmenDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        duty: z.enum([PrismaUserDutyEnum.PRESIDENT]),
        title: z.enum(PrismaUserTitleEnum).exclude(['FIRST_SECRETARY']).nullable(),
        displayTitle: z.string().nullable(),
      }),
    ),
  }),
) {}
