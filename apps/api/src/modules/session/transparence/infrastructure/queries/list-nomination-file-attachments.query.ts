import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';

@Injectable()
export class ListNominationFileAttachmentsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    sessionId: string;
    nominationFileId: string;
  }): Promise<ListedNominationFileAttachmentDto> {
    const nominationFile = await this.db.tx.dossierDeNomination.findUnique({
      where: { id: query.nominationFileId, sessionId: query.sessionId },
      select: {
        attachments: {
          select: { file: { select: { id: true, name: true, sizeInBytes: true } } },
          orderBy: { file: { createdAt: 'desc' } },
        },
      },
    });

    if (!nominationFile) throw new NotFoundException();
    return {
      items: nominationFile.attachments.map(({ file }) => ({
        id: file.id,
        name: file.name,
        size: file.sizeInBytes,
      })),
    };
  }
}

export class ListedNominationFileAttachmentDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        size: z.number().int().nullable(),
      }),
    ),
  }),
) {}
