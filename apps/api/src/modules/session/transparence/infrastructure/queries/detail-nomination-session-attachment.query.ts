import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';

@Injectable()
export class DetailNominationSessionAttachmentQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
  ) {}

  async handle(query: {
    sessionId: string;
    fileId: string;
  }): Promise<DetailedNominationSessionAttachmentDto> {
    const session = await this.db.tx.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: {
        attachments: {
          where: { fileId: query.fileId },
          select: {
            file: {
              select: { id: true, name: true, path: true },
            },
          },
        },
      },
    });

    const attachment = session?.attachments[0]?.file;
    if (!attachment) throw new NotFoundException();

    const { [attachment.id]: url } = await this.files.getPublicUrls([attachment.id]);
    if (!url) throw new NotFoundException();

    return {
      id: attachment.id,
      name: attachment.name,
      url: url.toString(),
    };
  }
}

export class DetailedNominationSessionAttachmentDto extends createZodDto(
  z.object({ id: z.string(), name: z.string(), url: z.url() }),
) {}
