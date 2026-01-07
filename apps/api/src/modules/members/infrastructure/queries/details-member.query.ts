import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { Magistrat } from 'shared-models';

import { detailsMemberRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { isMember, MEMBER_ROLES } from '../member.utils';

@Injectable()
export class DetailsMemberQuery {
  constructor(private readonly db: PrismaService) {}

  async handle(query: { userId: string }): Promise<DetailedMemberDto> {
    const [user] = await this.db.$queryRawTyped(
      detailsMemberRawQuery(query.userId),
    );

    if (!user || !isMember(user)) throw new NotFoundException();

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      excludedJurisdictions: (user.excludedJurisdictions ?? []).map(
        (j: { id: string; label: string }) => ({
          id: j.id,
          label: j.label,
        }),
      ),
      stats: (user.stats ?? []).map(
        (stat: {
          year: number;
          count: number;
          targetedGrade: Magistrat.Grade;
        }) => ({
          year: stat.year,
          count: stat.count,
          targetedGrade: stat.targetedGrade,
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
  gender: z.string(),

  excludedJurisdictions: z.array(
    z.object({ id: z.string(), label: z.string().nullable() }),
  ),

  stats: z.array(
    z.object({
      count: z.number().int().gte(0),
      year: z.number().int().gte(1900),
      targetedGrade: z.enum(Magistrat.Grade),
    }),
  ),
});

export class DetailedMemberDto extends createZodDto(DetailedMemberDtoSchema) {}
