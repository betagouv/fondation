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
    const attachment = await this.prisma.sessionAttachment.findUnique({
      where: {
        sessionId_fileId: { sessionId: query.sessionId, fileId: query.fileId },
      },
      select: {
        file: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });

    if (!attachment) throw new NotFoundException();

    const path = attachment.file.path.concat(attachment.file.name).join('/');
    const urlsRecord = await this.files.getPublicUrls([path]);
    const url = urlsRecord[path];

    if (!url) throw new NotFoundException();

    return {
      id: attachment.file.id,
      name: attachment.file.name,
      url: url.toString(),
    };
  }
}

export class DetailedNominationSessionAttachmentDto extends createZodDto(
  z.object({ id: z.string(), name: z.string(), url: z.url() }),
) {}
