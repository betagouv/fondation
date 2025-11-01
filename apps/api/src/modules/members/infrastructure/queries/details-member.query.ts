import { Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import { Db } from 'src/modules/framework/drizzle';
import { isMember, MEMBER_ROLES } from '../member.utils';

@Injectable()
export class DetailsMemberQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { userId: string }): Promise<DetailedMemberDto> {
    const rawUser = await this.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, query.userId),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        role: true,
        email: true,
      },
      with: {
        excludedJurisdictionIds: {
          with: { jurisdiction: { columns: { codejur: true, libelle: true } } },
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

export const DetailedMemberDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(MEMBER_ROLES),

  excludedJurisdictions: z.array(
    z.object({ id: z.string(), label: z.string().nullable() }),
  ),
});
export type DetailedMemberDto = z.infer<typeof DetailedMemberDtoSchema>;
