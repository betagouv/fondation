import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class ListNominationSessionAttachmentsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    sessionId: string;
  }): Promise<ListedNominationSessionAttachmentDto> {
    const attachments = await this.prisma.sessionAttachment.findMany({
      where: { sessionId: query.sessionId },
      orderBy: { file: { createdAt: 'desc' } },
      select: { file: { select: { id: true, name: true } } },
    });

    return {
      items: attachments.map(({ file }) => ({ id: file.id, name: file.name })),
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
