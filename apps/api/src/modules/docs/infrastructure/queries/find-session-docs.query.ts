import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { agendaFileName } from '../../domain/agenda-file-name';
import { officialReportFileName } from '../../domain/official-report-file-name';
import { PrismaService } from 'src/modules/framework/database';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class FindSessionDocsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { sessionId: string }): Promise<FoundSessionDocsDto> {
    const [session, agendaFiles, officialReportFiles] = await this.prisma.$transaction([
      this.prisma.session.findUnique({ where: { id: query.sessionId }, select: { formation: true } }),
      this.prisma.agenda.findMany({
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
        where: { sessionId: query.sessionId, html: { not: null } },
        select: {
          id: true,
          date: true,
          officialReportId: true,
        },
      }),
      this.prisma.officialReport.findMany({
        orderBy: [{ sessionMeetingDate: 'asc' }, { createdAt: 'asc' }],
        where: { html: { not: null }, agendas: { some: { sessionId: query.sessionId } } },
        select: { id: true, sessionMeetingDate: true },
      }),
    ]);

    if (!session) return { items: [] };

    const { formation } = session;
    return {
      items: ([] as (FoundSessionDocsDto['items'][number] | undefined)[])
        .concat(
          agendaFiles.map(({ id, date, officialReportId }) => ({
            id,
            type: 'agenda' as const,
            isLinkedToOfficialReport: !!officialReportId,
            name: agendaFileName({ date, formation }),
          })),
          officialReportFiles.map(({ id, sessionMeetingDate: date }) => ({
            id,
            type: 'officialReport' as const,
            name: officialReportFileName({ date, formation }),
          })),
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
