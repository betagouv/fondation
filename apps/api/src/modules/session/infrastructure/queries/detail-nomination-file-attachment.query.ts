import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';

@Injectable()
export class DetailNominationFileAttachmentQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async handle(query: {
    sessionId: string;
    nominationFileId: string;
    fileId: string;
  }): Promise<DetailedNominationFileAttachmentDto> {
    const nominationFile = await this.prisma.dossierDeNomination.findUnique({
      where: { id: query.nominationFileId, sessionId: query.sessionId },
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
