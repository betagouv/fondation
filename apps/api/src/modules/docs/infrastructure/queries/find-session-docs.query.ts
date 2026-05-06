import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class FindSessionDocsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { sessionId: string }): Promise<FoundSessionDocsDto> {
    const [agendaFiles, officialReportFiles] = await this.prisma.$transaction([
      this.prisma.agenda.findMany({
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
        where: { sessionId: query.sessionId, pdf: { isNot: null } },
        select: {
          id: true,
          officialReportId: true,
          pdf: { select: { name: true } },
        },
      }),
      this.prisma.officialReport.findMany({
        orderBy: [{ sessionMeetingDate: 'asc' }, { createdAt: 'asc' }],
        where: { agendas: { every: { sessionId: query.sessionId } } },
        select: { id: true, pdf: { select: { name: true } } },
      }),
    ]);

    return {
      items: ([] as (FoundSessionDocsDto['items'][number] | undefined)[])
        .concat(
          agendaFiles.map(({ id, officialReportId, pdf }) =>
            pdf
              ? {
                  id,
                  name: pdf.name,
                  type: 'agenda' as const,
                  isLinkedToOfficialReport: !!officialReportId,
                }
              : undefined,
          ),
          officialReportFiles.map(({ id, pdf }) =>
            pdf ? { id, name: pdf.name, type: 'officialReport' as const } : undefined,
          ),
        )
        .filter(isDefined),
    };
  }
}

export class FoundSessionDocsDto extends createZodDto(
  z.object({
    items: z.array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.enum(['agenda']),
          id: z.string(),
          name: z.string(),
          isLinkedToOfficialReport: z.boolean(),
        }),
        z.object({
          type: z.enum(['officialReport']),
          id: z.string(),
          name: z.string(),
        }),
      ]),
    ),
  }),
) {}
