import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AgendaVersionFinder } from '../finders/agenda-version.finder';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';

@Injectable()
export class DetailsSessionAgendaQuery {
  constructor(
    private readonly files: Files,
    private readonly db: Db,
    private readonly agendaVersionFinder: AgendaVersionFinder,
  ) {}

  async handle(query: { sessionId: string; agendaId: string }): Promise<DetailedSessionAgenda> {
    const publishedVersionId = await this.agendaVersionFinder.published({ agendaId: query.agendaId });
    if (!publishedVersionId) throw new NotFoundException();

    const version = await this.db.tx.agendaVersion.findUnique({
      where: { id: publishedVersionId, agenda: { sessionId: query.sessionId } },
      select: {
        pdf: { select: { id: true } },
        agenda: { select: { id: true } },
      } satisfies Prisma.AgendaVersionSelect,
    });

    if (!version?.pdf) throw new NotFoundException();

    const { [version.pdf.id]: url } = await this.files.getPublicUrls([version.pdf.id]);
    if (!url) throw new NotFoundException();

    return { id: version.agenda.id, url: url.toString() };
  }
}

export class DetailedSessionAgenda extends createZodDto(
  z.object({
    id: z.string(),
    url: z.url(),
  }),
) {}

export const DetailedSessionDoc = createZodDto(DetailedSessionAgenda.schema.meta({ deprecated: true }));
