import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';

import { FindAgendaDocumentPdfQuery } from './find-agenda-document-pdf.query';

@Injectable()
export class DetailsSessionAgendaQuery {
  constructor(
    private readonly files: Files,
    private readonly prisma: PrismaService,
    private readonly findAgendaDocumentPdfQuery: FindAgendaDocumentPdfQuery,
  ) {}

  async handle(query: { sessionId: string; agendaId: string }): Promise<DetailedSessionAgenda> {
    return this.innerHandle({ ...query, afterGeneration: false });
  }

  private async innerHandle(query: {
    sessionId: string;
    agendaId: string;
    afterGeneration: boolean;
  }): Promise<DetailedSessionAgenda> {
    const agenda = await this.prisma.agenda.findUnique({
      where: {
        id: query.agendaId,
        sessionId: query.sessionId,
        html: { not: null },
      },
      select: { id: true, pdf: { select: { id: true } } },
    });

    if (!agenda) throw new NotFoundException();
    if (!agenda.pdf && query.afterGeneration) throw new NotFoundException();

    if (!agenda.pdf) {
      await this.findAgendaDocumentPdfQuery.handle({ id: query.agendaId, forceNew: false });
      return this.innerHandle({ ...query, afterGeneration: true });
    }

    const { [agenda.pdf.id]: url } = await this.files.getPublicUrls([agenda.pdf.id]);
    if (!url) throw new NotFoundException();

    return { id: agenda.id, url: url.toString() };
  }
}

export class DetailedSessionAgenda extends createZodDto(
  z.object({
    id: z.string(),
    url: z.url(),
  }),
) {}

export const DetailedSessionDoc = createZodDto(DetailedSessionAgenda.schema.meta({ deprecated: true }));
