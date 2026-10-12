import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';

const OBSERVATIONS_PER_FILE = 6;

@Injectable()
export class ListObservationsAttachmentsQuery {
  constructor(
    private readonly db: Db,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  @Transactional()
  async handle(query: {
    sessionId: string;
    magistratId: string | undefined;
    excludeObservationId: string | undefined;
  }): Promise<ListedObservationsAttachmentsDto> {
    const sessions = await this.sessions.internalFindSessions({ sessionIds: [query.sessionId] });
    if (!sessions.has(query.sessionId)) throw new NotFoundException();

    const observations = await this.db.tx.observation.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        files: {
          orderBy: { file: { createdAt: 'desc' } },
          select: { file: { select: { id: true, name: true } } },
          where: {
            NOT: { linkedToObservations: { some: { observationId: query.excludeObservationId } } },
            originalObservationId: null,
          },
        },
        id: true,
        nominationFileId: true,
      } satisfies Prisma.ObservationSelect,
      where: {
        id: { not: query.excludeObservationId },
        magistratId: query.magistratId,
        sessionId: query.sessionId,
      },
    });

    const keptPerFile = new Map<string, number>();
    const items = observations.flatMap((observation) => {
      const kept = keptPerFile.get(observation.nominationFileId) ?? 0;
      if (kept === OBSERVATIONS_PER_FILE) return [];
      keptPerFile.set(observation.nominationFileId, kept + 1);

      return observation.files.map(({ file }) => ({
        fileId: file.id,
        name: file.name,
        observationId: observation.id,
      }));
    });

    return { items };
  }
}

export class ListedObservationsAttachmentsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        observationId: z.string(),
        fileId: z.string(),
        name: z.string(),
      }),
    ),
  }),
) {}
