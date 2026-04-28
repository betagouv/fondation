import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class ObservationFinder {
  constructor(private readonly prisma: PrismaService) {}

  findExistingObservation(query: {
    tx?: Prisma.TransactionClient;
    sessionId: string;
    nominationFileId: string;
    magistratId: string;
  }): Promise<{
    id: string;
    observations: readonly { magistratId: string }[];
  } | null> {
    if (!query.tx) {
      return this.prisma.$transaction(async (tx) =>
        this.findExistingObservation({ ...query, tx }),
      );
    }

    return query.tx.dossierDeNomination.findUnique({
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

  async findExistingFiles(query: {
    tx?: Prisma.TransactionClient;
    files: readonly {
      observationId: string;
      magistratId: string;
      fileId: string;
    }[];
  }): Promise<{ items: { observationId: string; fileId: string }[] }> {
    if (!query.tx) {
      return this.prisma.$transaction(async (tx) =>
        this.findExistingFiles({ ...query, tx }),
      );
    }

    const observations = await query.tx.observation.findMany({
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
