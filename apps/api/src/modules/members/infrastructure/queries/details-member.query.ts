import { Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import { isMember, MEMBER_ROLES } from '../member.utils';
import { PrismaService } from 'src/modules/framework/database';
import { createZodDto } from 'nestjs-zod';

@Injectable()
export class DetailsMemberQuery {
  constructor(private readonly db: PrismaService) {}

  async handle(query: { userId: string }): Promise<DetailedMemberDto> {
    const rawUser = await this.db.user.findFirst({
      where: { id: query.userId, role: { in: MEMBER_ROLES } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        role: true,
        email: true,

        excludedJurisdictionIds: {
          select: {
            jurisdiction: { select: { codejur: true, libelle: true } },
          },
        },
      },
    });

    if (!rawUser || !isMember(rawUser)) {
      throw new NotFoundException();
    }

    return {
      id: rawUser.id,
      firstName: rawUser.firstName,
      lastName: rawUser.lastName,
      role: rawUser.role,
      email: rawUser.email,

      excludedJurisdictions: rawUser.excludedJurisdictionIds.map(
        ({ jurisdiction }) => ({
          id: jurisdiction.codejur,
          label: jurisdiction.libelle,
        }),
      ),
    };
  }
}

export const DetailedMemberDtoSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(MEMBER_ROLES),

    excludedJurisdictions: z.array(
      z.object({ id: z.string(), label: z.string().nullable() }),
    ),
  })
  .meta({ id: 'DetailedMemberDto' });

export class DetailedMemberDto extends createZodDto(DetailedMemberDtoSchema) {}
