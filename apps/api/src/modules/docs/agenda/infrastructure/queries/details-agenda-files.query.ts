import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';

@Injectable()
export class DetailsAgendaFilesQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { agendaId: string }): Promise<DetailedAgendaFilesDto> {
    const items = await this.db.tx.agendaNominationFile.findMany({
      where: { agendaId: query.agendaId, nominationFileId: { not: null } },
      select: { nominationFileId: true },
    });

    return { items: items.flatMap(({ nominationFileId }) => (nominationFileId ? [nominationFileId] : [])) };
  }
}

export class DetailedAgendaFilesDto extends createZodDto(
  z.object({
    items: z.array(z.string()),
  }),
) {}
