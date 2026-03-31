import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { PrismaService } from 'src/modules/framework/database';
import { isDefined } from 'src/utils/is-defined';
import z from 'zod';

@Injectable()
export class FindSessionDocsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { sessionId: string }): Promise<FoundSessionDocsDto> {
    const agendaFiles = await this.prisma.agenda.findMany({
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      where: { sessionId: query.sessionId, pdf: { isNot: null } },
      select: { id: true, pdf: { select: { name: true } } },
    });

    return {
      items: agendaFiles
        .map(({ id, pdf }) => (pdf ? { id, name: pdf.name } : undefined))
        .filter(isDefined),
    };
  }
}

export class FoundSessionDocsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    ),
  }),
) {}
