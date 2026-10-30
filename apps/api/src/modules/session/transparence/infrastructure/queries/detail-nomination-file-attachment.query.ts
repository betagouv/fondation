import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { Db } from '../../../../framework/database';
import { Files } from '../../../../framework/files';
import type { RoleEnum } from '../../../../shared/role.enum';
import { NominationSessionFinder } from '../finders/transparence-session.finder';

@Injectable()
export class DetailNominationFileAttachmentQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
    private readonly sessions: NominationSessionFinder,
  ) {}

  async handle(query: {
    fileId: string;
    nominationFileId: string;
    role: RoleEnum;
    sessionId: string;
  }): Promise<DetailedNominationFileAttachmentDto> {
    await this.sessions.getVisible(query);
    const nominationFile = await this.db.tx.dossierDeNomination.findUnique({
      where: { id: query.nominationFileId, sessionId: query.sessionId },
      select: {
        attachments: {
          where: { fileId: query.fileId },
          select: {
            file: {
              select: { id: true, name: true },
            },
          },
        },
      } satisfies Prisma.DossierDeNominationSelect,
    });

    const attachment = nominationFile?.attachments[0]?.file;
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

export class DetailedNominationFileAttachmentDto extends createZodDto(
  z.object({ id: z.string(), name: z.string(), url: z.url() }),
) {}
