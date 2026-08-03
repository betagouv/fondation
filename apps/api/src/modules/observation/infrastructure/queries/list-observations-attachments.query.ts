import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';

@Injectable()
export class ListObservationsAttachmentsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    sessionId: string;
    magistratId: string | undefined;
    excludeObservationId: string | undefined;
  }): Promise<ListedObservationsAttachmentsDto> {
    const session = await this.db.tx.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: {
        dossierDeNominations: {
          select: {
            observations: {
              take: 6,
              orderBy: { createdAt: 'desc' },
              where: {
                magistratId: query.magistratId,
                id: { not: query.excludeObservationId },
              },
              select: {
                id: true,
                files: {
                  where: {
                    originalObservationId: null,
                    NOT: {
                      linkedToObservations: {
                        some: { observationId: query.excludeObservationId },
                      },
                    },
                  },
                  orderBy: { file: { createdAt: 'desc' } },
                  select: {
                    file: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || session.dossierDeNominations.length === 0) {
      throw new NotFoundException();
    }

    const items = session.dossierDeNominations.flatMap((ddn) =>
      ddn.observations.flatMap((obs) =>
        obs.files.map(({ file }) => ({
          fileId: file.id,
          name: file.name,
          observationId: obs.id,
        })),
      ),
    );

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
