import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AgendaVersionFinder } from '../finders/agenda-version.finder';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';

@Injectable()
export class DetailsAgendaFilesQuery {
  constructor(
    private readonly db: Db,
    private readonly agendaVersionFinder: AgendaVersionFinder,
  ) {}

  async handle(query: { agendaId: string }): Promise<DetailedAgendaFilesDto> {
    const versionId = await this.agendaVersionFinder.latest({ agendaId: query.agendaId });

    const items = await this.db.tx.agendaNominationFile.findMany({
      where: { versionId, nominationFileId: { not: null } },
      select: { nominationFileId: true } satisfies Prisma.AgendaNominationFileSelect,
    });

    return { items: items.flatMap(({ nominationFileId }) => (nominationFileId ? [nominationFileId] : [])) };
  }
}

export class DetailedAgendaFilesDto extends createZodDto(
  z.object({
    items: z.array(z.string()),
  }),
) {}
