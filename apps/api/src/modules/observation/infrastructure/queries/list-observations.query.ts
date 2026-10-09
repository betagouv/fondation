import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { ObservationFollowUp } from '../../domain/observation-follow-up';
import { Prisma } from 'src/generated/prisma/client';
import { findMagistratsCurrentPositionRawQuery } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';
import { magistratFullName } from 'src/modules/magistrat/domain/magistrat-name';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { auditionScheduleSchema } from 'src/utils/audition-schedule';
import { fullname } from 'src/utils/user.util';

const ObservationFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number().int().nullable(),
  addedAt: z.iso.datetime(),
  addedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
});

const ObservationSchema = z.object({
  id: z.string(),
  audition: auditionScheduleSchema.nullable(),
  dateReception: z.string(),
  description: z.string(),
  followUp: z.enum(ObservationFollowUp.enum).nullable(),
  observantObservationsCount: z.number().int(),
  magistrat: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      name: z.string(),
      currentPosition: z.string().nullable(),
    })
    .nullable(),
  createdBy: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable(),
  files: z.array(ObservationFileSchema),
  createdAt: z.string(),
});

export class ObservationDto extends createZodDto(ObservationSchema) {}

export class ListObservationsResponseDto extends createZodDto(
  z.object({
    observations: z.array(ObservationSchema),
  }),
) {}

@Injectable()
export class ListObservationsQuery {
  constructor(
    private readonly db: Db,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  async handle(query: {
    nominationFileId: string;
    role: RoleEnum;
    sessionId: string;
  }): Promise<ListObservationsResponseDto> {
    const observations = await this.db.tx.observation.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        createdByUser: {
          select: {
            firstName: true,
            id: true,
            lastName: true,
          },
        },
        dateReception: true,
        description: true,
        files: {
          select: {
            file: {
              select: {
                createdAt: true,
                createdBy: { select: { firstName: true, id: true, lastName: true } },
                id: true,
                name: true,
                sizeInBytes: true,
              },
            },
          },
        },
        followUp: true,
        id: true,
        magistrat: {
          select: {
            firstName: true,
            id: true,
            lastName: true,
            marriedName: true,
          },
        },
      } satisfies Prisma.ObservationSelect,
      where: { nominationFileId: query.nominationFileId, sessionId: query.sessionId },
    });

    const magistratIds = [
      ...new Set(observations.map((obs) => obs.magistrat?.id).filter((id) => id !== undefined)),
    ];
    const positions = magistratIds.length
      ? await this.db.tx.$queryRawTyped(findMagistratsCurrentPositionRawQuery(magistratIds))
      : [];
    const positionByMagistratId = new Map(positions.map((p) => [p.magistratId, p.currentPosition]));
    const auditions = await this.transparences.internalFindSeenObservantAuditions({
      magistratIds,
      role: query.role,
      sessionId: query.sessionId,
    });
    const observationCounts = await this.db.tx.observation.groupBy({
      _count: { _all: true },
      by: ['magistratId'],
      where: { magistratId: { in: magistratIds }, sessionId: query.sessionId },
    });
    const observationCountByMagistratId = new Map(
      observationCounts.map(({ _count, magistratId }) => [magistratId, _count._all]),
    );

    return {
      observations: observations.map((obs) => {
        return {
          audition: (obs.magistrat && auditions.get(obs.magistrat.id)) ?? null,
          createdAt: obs.createdAt.toISOString(),
          createdBy: obs.createdByUser,
          dateReception: obs.dateReception.toISOString(),
          description: obs.description,
          files: obs.files.map(({ file }) => ({
            addedAt: file.createdAt.toISOString(),
            addedBy: file.createdBy ? { id: file.createdBy.id, name: fullname(file.createdBy) } : null,
            id: file.id,
            name: file.name,
            size: file.sizeInBytes,
          })),
          followUp: obs.followUp,
          id: obs.id,
          magistrat: obs.magistrat
            ? {
                currentPosition: positionByMagistratId.get(obs.magistrat.id) || null,
                firstName: obs.magistrat.firstName,
                id: obs.magistrat.id,
                lastName: obs.magistrat.lastName,
                name: magistratFullName(obs.magistrat),
              }
            : null,
          observantObservationsCount:
            (obs.magistrat && observationCountByMagistratId.get(obs.magistrat.id)) ?? 1,
        };
      }),
    };
  }
}
