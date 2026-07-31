import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Db } from 'src/modules/framework/database';

@Injectable()
export class ObservationFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  findExistingObservation(query: {
    sessionId: string;
    nominationFileId: string;
    magistratId: string;
  }): Promise<{
    id: string;
    observations: readonly { magistratId: string }[];
  } | null> {
    return this.db.tx.dossierDeNomination.findUnique({
      where: { sessionId: query.sessionId, id: query.nominationFileId },
      select: {
        id: true,
        observations: {
          select: { magistratId: true },
          where: { magistratId: query.magistratId },
        },
      },
    });
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
      select: { files: { select: { observationId: true, fileId: true } } },
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
