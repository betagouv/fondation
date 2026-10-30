import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { AdminUserRole } from '../../../../administration/domain/admin-user-role';
import {
  labeledAdminUserRole,
  LabeledAdminUserRoleSchema,
} from '../../../../administration/infrastructure/dto/administration.dto';
import { Db } from '../../../../framework/database';
import { formationToMemberRole } from '../../../../shared/formation-to-member-role';
import { prismaFormationEnumToFormationEnum } from '../../../../shared/mappers/formation.mapper';
import { prismaGenderEnumToGenderEnum } from '../../../../shared/mappers/gender-enum.mapper';
import {
  prismaRoleEnumToRoleEnum,
  roleEnumToPrismaRoleEnum,
} from '../../../../shared/mappers/role-enum.mapper';
import { Summary } from '../../domain/summary';

/** a few dozen people at most, the members of one formation and the secretariat: the list comes whole */
@Injectable()
export class ListSummaryReadersQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    nominationFileId: string;
    sessionId: string;
    userId: string;
  }): Promise<ListedSummaryReadersDto> {
    const session = await this.db.tx.session.findUnique({
      select: {
        dossierDeNominations: {
          select: { summary: { select: { readers: { select: { userId: true } } } } },
          where: { id: query.nominationFileId },
        },
        formation: true,
      } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, id: query.sessionId },
    });
    const summary = session?.dossierDeNominations[0]?.summary;
    if (!session || !summary) throw new NotFoundException();

    const formation = prismaFormationEnumToFormationEnum(session.formation);
    const readerIds = summary.readers.map(({ userId }) => userId);

    const users = await this.db.tx.user.findMany({
      select: {
        duty: true,
        firstName: true,
        gender: true,
        id: true,
        lastName: true,
        role: true,
        title: true,
      } satisfies Prisma.UserSelect,
      where: {
        id: { not: query.userId },
        // a reader who no longer fits stays listed, for the author to remove them
        OR: [
          {
            deactivatedAt: null,
            isTechnical: false,
            role: {
              in: [...formationToMemberRole(formation), 'ADJOINT_SECRETAIRE_GENERAL' as const].map(
                roleEnumToPrismaRoleEnum,
              ),
            },
          },
          { id: { in: readerIds } },
        ],
      },
    });

    return {
      items: Summary.inReadingOrder(users, formation).map(
        ({ duty, firstName, gender, id, lastName, role, title }) => ({
          displayedRole: labeledAdminUserRole(
            AdminUserRole.from({ duty, role: prismaRoleEnumToRoleEnum(role), title }).toString(),
            prismaGenderEnumToGenderEnum(gender),
          ),
          firstName,
          id,
          lastName,
        }),
      ),
    };
  }
}

export class ListedSummaryReadersDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        displayedRole: LabeledAdminUserRoleSchema,
        firstName: z.string(),
        id: z.uuid(),
        lastName: z.string(),
      }),
    ),
  }),
) {}
