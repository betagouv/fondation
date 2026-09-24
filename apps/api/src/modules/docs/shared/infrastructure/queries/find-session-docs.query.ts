import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { docFileName } from '../../domain/doc-file-name';
import { DOC_SYSTEM_UPDATE_CAUSES } from '../../domain/doc-system-update-cause';
import { draftChangesBy, draftChangesBySchema, draftLastChange } from '../draft-changes-by';
import {
  AgendaFinder,
  officialReportReadinessSchema,
  writerOf,
  writerSchema,
} from '../finders/agenda.finder';
import { Prisma } from 'src/generated/prisma/client';
import {
  presentationPlanStatusOf,
  presentationPlanStatusSchema,
} from 'src/modules/docs/presentation-plan/infrastructure/presentation-plan-status';
import { Db } from 'src/modules/framework/database';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

const draftUpdateSchema = z
  .object({
    at: z.iso.datetime(),
    /** null when the application made the change, or its author is gone */
    by: writerSchema,
    causes: z.array(z.enum(DOC_SYSTEM_UPDATE_CAUSES)),
    origin: z.enum(['PERSON', 'SYSTEM']),
  })
  .nullable();

@Injectable()
export class FindSessionDocsQuery {
  constructor(
    private readonly db: Db,
    private readonly agendas: AgendaFinder,
  ) {}

  @Transactional()
  async handle(query: { sessionId: string }): Promise<FoundSessionDocsDto> {
    const session = await this.db.tx.session.findUnique({
      where: { id: query.sessionId },
      select: { typeDeSaisine: true } satisfies Prisma.SessionSelect,
    });
    const agendas = await this.db.tx.agenda.findMany({
      where: { sessionId: query.sessionId },
      select: {
        id: true,
        createdAt: true,
        author: { select: { id: true, firstName: true, lastName: true } },
        officialReportId: true,
        justicePresentationPlans: {
          select: {
            plan: {
              select: {
                id: true,
                date: true,
                time: true,
                pdfId: true,
                isPresented: true,
                chairmanFirstName: true,
                chairmanLastName: true,
                _count: { select: { agendas: true } },
              },
            },
          },
        },
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
            createdAt: true,
            createdBy: true,
            systemUpdatedAt: true,
            systemUpdates: { select: { cause: true }, orderBy: { at: 'asc' } },
            updatedAt: true,
            updatedBy: true,
            author: { select: { id: true, firstName: true, lastName: true } },
            editor: { select: { id: true, firstName: true, lastName: true } },
            validator: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      } satisfies Prisma.AgendaSelect,
    });

    const agendaFiles = agendas.flatMap(({ author, versions, ...agenda }) => {
      const published = versions.find(({ status }) => status === 'VALIDATED');
      const draft = versions.find(({ status }) => status === 'DRAFT');
      const shown = published ?? versions[0];
      if (!shown) return [];

      return [
        {
          ...agenda,
          ...shown,
          // the version carries its own createdAt, which must not pass for the agenda's
          createdAt: agenda.createdAt,
          // the upstream changes land in the draft, and the reader has to be told even though the
          // validated version they are shown knows nothing of them
          outdated: versions.some((version) => version.outdated),
          draftChangesBy: draft ? draftChangesBy(draft) : null,
          creator: author,
          draftChange: draft ? draftLastChange(draft) : null,
          validator: published?.validator ?? null,
          status: published ? ('VALIDATED' as const) : ('DRAFT' as const),
        },
      ];
    });
    const officialReportReadiness = await this.agendas.findOfficialReportReadiness(query);

    const officialReports = await this.db.tx.officialReport.findMany({
      where: { agendas: { some: { sessionId: query.sessionId } } },
      select: {
        id: true,
        createdAt: true,
        author: { select: { id: true, firstName: true, lastName: true } },
        // a report holds at most its validated version and the draft opened on top of it
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
            createdAt: true,
            createdBy: true,
            systemUpdatedAt: true,
            systemUpdates: { select: { cause: true }, orderBy: { at: 'asc' } },
            updatedAt: true,
            updatedBy: true,
            author: { select: { id: true, firstName: true, lastName: true } },
            editor: { select: { id: true, firstName: true, lastName: true } },
            validator: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      } satisfies Prisma.OfficialReportSelect,
    });

    const officialReportFiles = officialReports.flatMap(({ author, versions, ...report }) => {
      const published = versions.find(({ status }) => status === 'VALIDATED');
      const draft = versions.find(({ status }) => status === 'DRAFT');
      const shown = published ?? versions[0];
      if (!shown) return [];

      return [
        {
          ...report,
          ...shown,
          createdAt: report.createdAt,
          outdated: versions.some((version) => version.outdated),
          draftChangesBy: draft ? draftChangesBy(draft) : null,
          creator: author,
          draftChange: draft ? draftLastChange(draft) : null,
          validator: published?.validator ?? null,
          status: published ? ('VALIDATED' as const) : ('DRAFT' as const),
        },
      ];
    });

    if (!session) return { items: [] };

    const { typeDeSaisine } = session;
    const documents = [
      ...agendaFiles.map((file) => ({
        id: file.id,
        type: 'agenda' as const,
        date: file.sessionMeetingDate,
        meetingDate: DateOnly.fromUtcDate(file.sessionMeetingDate).toJson(),
        officialReportId: file.officialReportId,
        officialReportReadiness: officialReportReadiness.get(file.id) ?? null,
        presentationPlans: file.justicePresentationPlans.map(({ plan }) => ({
          id: plan.id,
          date: DateOnly.fromUtcDate(plan.date).toJson(),
          time: dateToTimeOnly(plan.time),
          chairman: { firstName: plan.chairmanFirstName, lastName: plan.chairmanLastName },
          status: presentationPlanStatusOf(plan),
          isPresented: plan.isPresented,
          otherAgendasCount: plan._count.agendas - 1,
        })),
        outdated: file.outdated,
        status: file.status,
        draftChangesBy: file.draftChangesBy,
        draftUpdate: file.draftChange
          ? {
              at: file.draftChange.at.toISOString(),
              by: writerOf(file.draftChange.by),
              causes: file.draftChange.causes,
              origin: file.draftChange.origin,
            }
          : null,
        createdAt: file.createdAt.toISOString(),
        createdBy: writerOf(file.creator),
        validatedAt: file.validatedAt?.toISOString() ?? null,
        validatedBy: writerOf(file.validator),
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
        meetingDate: DateOnly.fromUtcDate(file.sessionMeetingDate).toJson(),
        type: 'officialReport' as const,
        status: file.status,
        draftChangesBy: file.draftChangesBy,
        draftUpdate: file.draftChange
          ? {
              at: file.draftChange.at.toISOString(),
              by: writerOf(file.draftChange.by),
              causes: file.draftChange.causes,
              origin: file.draftChange.origin,
            }
          : null,
        createdAt: file.createdAt.toISOString(),
        createdBy: writerOf(file.creator),
        validatedAt: file.validatedAt?.toISOString() ?? null,
        validatedBy: writerOf(file.validator),
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
          meetingDate: dateOnlyJsonSchema,
          officialReportId: z.string().nullable(),
          /** null once the agenda has its report */
          officialReportReadiness: officialReportReadinessSchema.nullable(),
          presentationPlans: z.array(
            z.object({
              id: z.string(),
              date: dateOnlyJsonSchema,
              time: timeOnlySchema,
              chairman: z.object({ firstName: z.string(), lastName: z.string() }),
              status: presentationPlanStatusSchema,
              isPresented: z.boolean(),
              otherAgendasCount: z.number(),
            }),
          ),
          outdated: z.boolean(),
          /** DRAFT while the agenda has never been validated */
          status: z.enum(['DRAFT', 'VALIDATED']),
          draftChangesBy: draftChangesBySchema,
          draftUpdate: draftUpdateSchema,
          /** tells apart the agendas sharing a name, since the file name holds no time */
          createdAt: z.iso.datetime(),
          createdBy: writerSchema,
          validatedAt: z.iso.datetime().nullable(),
          validatedBy: writerSchema,
        }),
        z.object({
          type: z.enum(['officialReport']),
          id: z.string(),
          name: z.string(),
          meetingDate: dateOnlyJsonSchema,
          outdated: z.boolean(),
          /** DRAFT while the report has never been validated */
          status: z.enum(['DRAFT', 'VALIDATED']),
          draftChangesBy: draftChangesBySchema,
          draftUpdate: draftUpdateSchema,
          createdAt: z.iso.datetime(),
          createdBy: writerSchema,
          validatedAt: z.iso.datetime().nullable(),
          validatedBy: writerSchema,
        }),
      ]),
    ),
  }),
) {}
