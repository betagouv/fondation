import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import z from 'zod';

@Injectable()
export class DetailsSessionDocQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async handle(query: { sessionId: string; agendaId: string }) {
    const file = await this.prisma.agenda.findUnique({
      where: {
        id: query.agendaId,
        sessionId: query.sessionId,
      },
      select: { id: true, pdf: { select: { id: true } } },
    });

    if (!file || !file.pdf) throw new NotFoundException();

    const { [file.pdf.id]: url } = await this.files.getPublicUrls([
      file.pdf.id,
    ]);

    if (!url) throw new NotFoundException();

    return { id: file.id, url: url.toString() };
  }
}

export class DetailedSessionDoc extends createZodDto(
  z.object({
    id: z.string(),
    url: z.url(),
  }),
) {}
