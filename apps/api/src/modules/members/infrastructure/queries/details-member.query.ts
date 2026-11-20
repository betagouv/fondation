import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { detailsMemberRawQuery } from '../../../../generated/prisma/sql';
import { Db } from '../../../framework/database';
import { GradeEnum } from '../../../shared/grade.enum';
import {
  ExcludedJurisdictionsSchema,
  isMember,
  memberFormationOf,
  MemberFormationSchema,
} from '../member.utils';

@Injectable()
export class DetailsMemberQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { userId: string }): Promise<DetailedMemberDto> {
    const [user] = await this.db.tx.$queryRawTyped(detailsMemberRawQuery(query.userId));

    if (!user || !isMember(user)) throw new NotFoundException();

    return {
      id: user.id,
      email: user.email,
      formation: memberFormationOf(user.role),
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      displayTitle: user.displayTitle ?? null,
      recusalTitle: user.recusalTitle ?? null,
      excludedJurisdictions: ExcludedJurisdictionsSchema.parse(user.excludedJurisdictions),
      stats: MemberStatsSchema.parse(user.stats ?? []),
    };
  }
}

const MemberStatsSchema = z.array(
  z.object({
    count: z.number().int().gte(0),
    year: z.number().int().gte(1900),
    targetedGrade: z.enum(GradeEnum),
  }),
);

export class DetailedMemberDto extends createZodDto(
  z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    formation: MemberFormationSchema,
    gender: z.string(),
    displayTitle: z.string().nullable(),
    recusalTitle: z.string().nullable(),

    excludedJurisdictions: ExcludedJurisdictionsSchema,

    stats: MemberStatsSchema,
  }),
) {}
