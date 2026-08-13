import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';
import { NominationFileAttachmentTypeEnum } from 'src/modules/shared/nomination-file-attachment-type.enum';

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
          select: {
            type: true,
            createdAt: true,
            file: { select: { id: true, name: true, sizeInBytes: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!nominationFile) throw new NotFoundException();
    return {
      items: nominationFile.attachments.map(({ createdAt, file, type }) => ({
        id: file.id,
        name: file.name,
        size: file.sizeInBytes,
        type,
        addedAt: createdAt.toISOString(),
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
        type: z.enum(NominationFileAttachmentTypeEnum),
        addedAt: z.iso.datetime(),
      }),
    ),
  }),
) {}
