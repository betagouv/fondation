import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import z from 'zod';

@Injectable()
export class DetailNominationSessionAttachmentQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async handle(query: {
    sessionId: string;
    fileId: string;
  }): Promise<DetailedNominationSessionAttachmentDto> {
    const session = await this.prisma.session.findUnique({
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

    const { [attachment.id]: url } = await this.files.getPublicUrls([
      attachment.id,
    ]);
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
