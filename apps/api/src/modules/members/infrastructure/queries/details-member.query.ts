import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PrismaMagistratStatusEnum } from '../../../../generated/prisma/enums';
import { detailsMemberRawQuery, listExcludedMagistratsRawQuery } from '../../../../generated/prisma/sql';
import { Db } from '../../../framework/database';
import { magistratFullName } from '../../../magistrat/domain/magistrat-name';
import { PositionSchema } from '../../../magistrat/infrastructure/queries/detail-magistrat.query';
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

  @Transactional()
  async handle(query: { userId: string }): Promise<DetailedMemberDto> {
    const [user] = await this.db.tx.$queryRawTyped(detailsMemberRawQuery(query.userId));

    if (!user || !isMember(user)) throw new NotFoundException();

    const excludedMagistrats = await this.db.tx.$queryRawTyped(listExcludedMagistratsRawQuery(query.userId));

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
      excludedMagistrats: excludedMagistrats.map((magistrat) => ({
        id: magistrat.id,
        name: magistratFullName(magistrat),
        status: magistrat.status,
        grade: magistrat.grade,
        currentPosition: magistrat.jurisdictionId
          ? {
              function: magistrat.functionId
                ? { id: magistrat.functionId, label: magistrat.functionLabel }
                : null,
              jurisdiction: { id: magistrat.jurisdictionId, label: magistrat.jurisdictionLabel },
            }
          : null,
      })),
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
    excludedMagistrats: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        status: z.enum(PrismaMagistratStatusEnum),
        grade: z.string().nullable(),
        currentPosition: PositionSchema.pick({ function: true, jurisdiction: true }).nullable(),
      }),
    ),

    stats: MemberStatsSchema,
  }),
) {}
