import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { Db } from '../../../../framework/database';
import { Files } from '../../../../framework/files';
import type { RoleEnum } from '../../../../shared/role.enum';
import { NominationSessionFinder } from '../finders/transparence-session.finder';

@Injectable()
export class DetailNominationSessionAttachmentQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
    private readonly sessions: NominationSessionFinder,
  ) {}

  async handle(query: {
    fileId: string;
    role: RoleEnum;
    sessionId: string;
  }): Promise<DetailedNominationSessionAttachmentDto> {
    await this.sessions.getVisible(query);
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
      } satisfies Prisma.SessionSelect,
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
