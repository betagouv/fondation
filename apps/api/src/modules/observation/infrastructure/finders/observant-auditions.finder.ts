import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { type AuditionSchedule, toAuditionSchedule } from 'src/utils/audition-schedule';

export type ObservantAuditionWithObservations = {
  audition: AuditionSchedule;
  magistratId: string;
  observations: { nominationFileId: string; observationId: string }[];
};

@Injectable()
export class ObservantAuditionsFinder {
  constructor(private readonly db: Db) {}

  async findByMagistratId(predicate: {
    magistratIds?: readonly string[];
    sessionId: string;
  }): Promise<Map<string, AuditionSchedule>> {
    const auditions = await this.db.tx.observantAudition.findMany({
      select: { date: true, magistratId: true, time: true } satisfies Prisma.ObservantAuditionSelect,
      where: {
        magistratId: predicate.magistratIds ? { in: [...predicate.magistratIds] } : undefined,
        sessionId: predicate.sessionId,
      },
    });

    return new Map(
      auditions.map((audition) => [audition.magistratId, toAuditionSchedule(audition.date, audition.time)]),
    );
  }

  async findWithObservations(query: { sessionId: string }): Promise<ObservantAuditionWithObservations[]> {
    const auditions = await this.db.tx.observantAudition.findMany({
      select: {
        date: true,
        magistrat: {
          select: {
            observations: {
              select: { id: true, nominationFileId: true },
              where: { nominationFile: { sessionId: query.sessionId } },
            },
          },
        },
        magistratId: true,
        time: true,
      } satisfies Prisma.ObservantAuditionSelect,
      where: { sessionId: query.sessionId },
    });

    return auditions.map((audition) => ({
      audition: toAuditionSchedule(audition.date, audition.time),
      magistratId: audition.magistratId,
      observations: audition.magistrat.observations.map(({ id, nominationFileId }) => ({
        nominationFileId,
        observationId: id,
      })),
    }));
  }
}
