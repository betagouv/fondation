import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class DetailsAgendaFilesQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { agendaId: string }): Promise<DetailedAgendaFilesDto> {
    const items = await this.prisma.agendaNominationFile.findMany({
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
