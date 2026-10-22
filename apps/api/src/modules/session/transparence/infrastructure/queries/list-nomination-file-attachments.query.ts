import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { writerOf, writerSchema } from '../../../../../utils/user.util';
import { Db } from '../../../../framework/database';
import { NominationFileAttachmentTypeEnum } from '../../../../shared/nomination-file-attachment-type.enum';

@Injectable()
export class ListNominationFileAttachmentsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    nominationFileId: string;
    sessionId: string;
  }): Promise<ListedNominationFileAttachmentDto> {
    const nominationFile = await this.db.tx.dossierDeNomination.findUnique({
      select: {
        attachments: {
          orderBy: { createdAt: 'desc' },
          select: {
            createdAt: true,
            file: {
              select: {
                createdBy: { select: { firstName: true, id: true, lastName: true } },
                id: true,
                name: true,
                sizeInBytes: true,
              },
            },
            type: true,
          },
        },
      } satisfies Prisma.DossierDeNominationSelect,
      where: { id: query.nominationFileId, sessionId: query.sessionId },
    });

    if (!nominationFile) throw new NotFoundException();
    return {
      items: nominationFile.attachments.map(({ createdAt, file, type }) => ({
        id: file.id,
        name: file.name,
        size: file.sizeInBytes,
        type,
        addedAt: createdAt.toISOString(),
        addedBy: writerOf(file.createdBy),
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
        addedBy: writerSchema,
      }),
    ),
  }),
) {}
