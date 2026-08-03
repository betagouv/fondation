import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';

@Injectable()
export class ListNominationSessionAttachmentsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { sessionId: string }): Promise<ListedNominationSessionAttachmentDto> {
    const session = await this.db.tx.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: {
        attachments: {
          select: { file: { select: { id: true, name: true } } },
          orderBy: { file: { createdAt: 'desc' } },
        },
      },
    });

    if (!session) throw new NotFoundException();
    return {
      items: session.attachments.map(({ file }) => ({
        id: file.id,
        name: file.name,
      })),
    };
  }
}

export class ListedNominationSessionAttachmentDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        name: z.string(),
        id: z.string(),
      }),
    ),
  }),
) {}
