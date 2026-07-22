import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { docFileName } from '../../domain/doc-file-name';
import { PrismaService } from 'src/modules/framework/database';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';

@Injectable()
export class FindSessionDocsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { sessionId: string }): Promise<FoundSessionDocsDto> {
    const [session, agendaFiles, officialReportFiles] = await this.prisma.$transaction([
      this.prisma.session.findUnique({
        where: { id: query.sessionId },
        select: { typeDeSaisine: true },
      }),
      this.prisma.agenda.findMany({
        where: { sessionId: query.sessionId, html: { not: null } },
        select: {
          id: true,
          date: true,
          officialReportId: true,
          sessionMeetingDate: true,
          chairmanFirstName: true,
          chairmanLastName: true,
        },
      }),
      this.prisma.officialReport.findMany({
        where: { html: { not: null }, agendas: { some: { sessionId: query.sessionId } } },
        select: {
          id: true,
          chairmanLastName: true,
          chairmanFirstName: true,
          sessionMeetingDate: true,
          outdated: true,
        },
      }),
    ]);

    if (!session) return { items: [] };

    const { typeDeSaisine } = session;
    return {
      items: [
        ...agendaFiles.map((file) => ({
          id: file.id,
          type: 'agenda' as const,
          date: file.sessionMeetingDate,
          isLinkedToOfficialReport: !!file.officialReportId,
          name: docFileName({
            formation: null,
            type: 'AGENDA',
            sessionName: null,
            date: file.sessionMeetingDate,
            typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(typeDeSaisine),
            chairman: { firstName: file.chairmanFirstName, lastName: file.chairmanLastName },
          }),
        })),
        ...officialReportFiles.map((file) => ({
          id: file.id,
          outdated: file.outdated,
          date: file.sessionMeetingDate,
          type: 'officialReport' as const,
          name: docFileName({
            formation: null,
            sessionName: null,
            date: file.sessionMeetingDate,
            type: 'OFFICIAL_REPORT',
            typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(typeDeSaisine),
            chairman: { firstName: file.chairmanFirstName, lastName: file.chairmanLastName },
          }),
        })),
      ]
        .sort(
          (a, b) =>
            b.date.getTime() - a.date.getTime() || (a.type != b.type ? (a.type === 'agenda' ? -1 : 1) : 0),
        )
        .map(({ date: _date, ...item }) => item),
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
          outdated: z.boolean(),
        }),
      ]),
    ),
  }),
) {}
