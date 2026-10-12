import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';

@Injectable()
export class ObservationFinder {
  constructor(
    private readonly db: Db,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  @Transactional()
  async findExistingObservation(query: {
    sessionId: string;
    nominationFileId: string;
    magistratId: string;
  }): Promise<{
    id: string;
    observations: readonly { magistratId: string }[];
  } | null> {
    const files = await this.sessions.internalFindNominationFilesByIds({
      nominationFileIds: [query.nominationFileId],
    });
    if (files.get(query.nominationFileId)?.sessionId !== query.sessionId) return null;

    const observations = await this.db.tx.observation.findMany({
      select: { magistratId: true } satisfies Prisma.ObservationSelect,
      where: { magistratId: query.magistratId, nominationFileId: query.nominationFileId },
    });
    return { id: query.nominationFileId, observations };
  }

  @Transactional()
  async findExistingFiles(query: {
    files: readonly {
      observationId: string;
      magistratId: string;
      fileId: string;
    }[];
  }): Promise<{ items: { observationId: string; fileId: string }[] }> {
    const observations = await this.db.tx.observation.findMany({
      select: { files: { select: { observationId: true, fileId: true } } } satisfies Prisma.ObservationSelect,
      where: {
        OR: query.files.map(({ magistratId, observationId: id, fileId }) => ({
          id,
          magistratId,
          files: { some: { fileId } },
        })),
      },
    });

    return {
      items: observations.flatMap(({ files }) =>
        files.map(({ observationId, fileId }) => ({ fileId, observationId })),
      ),
    };
  }
}
