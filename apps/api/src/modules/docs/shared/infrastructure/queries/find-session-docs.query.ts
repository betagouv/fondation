import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { docFileName } from '../../domain/doc-file-name';
import { Db } from 'src/modules/framework/database';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { DateOnly } from 'src/utils/date-only';

@Injectable()
export class FindSessionDocsQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: { sessionId: string }): Promise<FoundSessionDocsDto> {
    const session = await this.db.tx.session.findUnique({
      where: { id: query.sessionId },
      select: { typeDeSaisine: true },
    });
    const agendas = await this.db.tx.agenda.findMany({
      where: { sessionId: query.sessionId },
      select: {
        id: true,
        createdAt: true,
        officialReportId: true,
        // an agenda holds at most its validated version and the draft opened on top of it
        versions: {
          take: 2,
          orderBy: { version: 'desc' },
          select: {
            status: true,
            outdated: true,
            validatedAt: true,
            sessionMeetingDate: true,
            chairmanFirstName: true,
            chairmanLastName: true,
          },
        },
      },
    });

    const agendaFiles = agendas.flatMap(({ versions, ...agenda }) => {
      const published = versions.find(({ status }) => status === 'VALIDATED');
      const shown = published ?? versions[0];
      if (!shown) return [];

      return [
        {
          ...agenda,
          ...shown,
          // the upstream changes land in the draft, and the reader has to be told even though the
          // validated version they are shown knows nothing of them
          outdated: versions.some((version) => version.outdated),
          hasDraft: versions.some(({ status }) => status === 'DRAFT'),
          status: published ? ('VALIDATED' as const) : ('DRAFT' as const),
        },
      ];
    });
    const officialReportFiles = await this.db.tx.officialReport.findMany({
      where: { agendas: { some: { sessionId: query.sessionId } } },
      select: {
        id: true,
        chairmanLastName: true,
        chairmanFirstName: true,
        sessionMeetingDate: true,
        outdated: true,
        createdAt: true,
        validatedAt: true,
      },
    });

    if (!session) return { items: [] };

    const { typeDeSaisine } = session;
    const documents = [
      ...agendaFiles.map((file) => ({
        id: file.id,
        type: 'agenda' as const,
        date: file.sessionMeetingDate,
        officialReportId: file.officialReportId,
        outdated: file.outdated,
        status: file.status,
        hasDraft: file.hasDraft,
        createdAt: file.createdAt.toISOString(),
        validatedAt: file.validatedAt?.toISOString() ?? null,
        name: docFileName({
          formation: null,
          type: 'AGENDA',
          sessionName: null,
          date: DateOnly.fromUtcDate(file.sessionMeetingDate),
          typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(typeDeSaisine),
          chairman: { firstName: file.chairmanFirstName, lastName: file.chairmanLastName },
        }),
      })),
      ...officialReportFiles.map((file) => ({
        id: file.id,
        outdated: file.outdated,
        date: file.sessionMeetingDate,
        type: 'officialReport' as const,
        createdAt: file.createdAt.toISOString(),
        validatedAt: file.validatedAt?.toISOString() ?? null,
        name: docFileName({
          formation: null,
          sessionName: null,
          date: DateOnly.fromUtcDate(file.sessionMeetingDate),
          type: 'OFFICIAL_REPORT',
          typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(typeDeSaisine),
          chairman: { firstName: file.chairmanFirstName, lastName: file.chairmanLastName },
        }),
      })),
    ];

    // an agenda and the official report made from it stay side by side, newest group first
    const groups = Map.groupBy(documents, (document) =>
      document.type === 'agenda' ? (document.officialReportId ?? document.id) : document.id,
    );

    const ordered = [...groups.values()]
      .map((group) => [...group].sort((a, b) => (a.type === b.type ? 0 : a.type === 'agenda' ? -1 : 1)))
      .sort(([a], [b]) => {
        if (!a || !b) return 0;

        return b.date.getTime() - a.date.getTime() || Date.parse(b.createdAt) - Date.parse(a.createdAt);
      })
      .flat();

    return { items: ordered.map(({ date: _date, ...item }) => item) };
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
          officialReportId: z.string().nullable(),
          outdated: z.boolean(),
          /** DRAFT while the agenda has never been validated */
          status: z.enum(['DRAFT', 'VALIDATED']),
          hasDraft: z.boolean(),
          /** tells apart the agendas sharing a name, since the file name holds no time */
          createdAt: z.iso.datetime(),
          validatedAt: z.iso.datetime().nullable(),
        }),
        z.object({
          type: z.enum(['officialReport']),
          id: z.string(),
          name: z.string(),
          outdated: z.boolean(),
          createdAt: z.iso.datetime(),
          validatedAt: z.iso.datetime().nullable(),
        }),
      ]),
    ),
  }),
) {}
