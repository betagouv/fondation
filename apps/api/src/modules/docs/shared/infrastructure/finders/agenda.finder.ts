import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AGENDA_CONTENT_VERSIONS, agendaContentOf } from '../agenda-content';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { NominationFileOutcome } from 'src/modules/shared/nomination-file-outcome.enum';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';
import { DateOnly, DateOnlyJson, dateOnlyJsonSchema } from 'src/utils/date-only';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class AgendaFinder {
  private readonly logger = new Logger(AgendaFinder.name);

  constructor(
    private readonly db: Db,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  @Transactional()
  async hasAnyReportableInOfficialReport(query: {
    sessionId: string;
    affectationVersionId: string;
  }): Promise<boolean> {
    const where = await this.buildFindReportableInOfficialReport(query);
    if (!where) return false;

    const result = await this.db.tx.agenda.findFirst({ where, select: { id: true } });
    return Boolean(result);
  }

  @Transactional()
  async findReportableInOfficialReport(query: {
    ids?: Set<string>;
    sessionId: string;
    ignoreOfficialReportId?: string;
  }): Promise<FoundAgendasDto> {
    const where = await this.buildFindReportableInOfficialReport(query);
    if (!where) return { items: [] };

    return this.find(where, query.ids);
  }

  private async buildFindReportableInOfficialReport(query: {
    ids?: Set<string>;
    sessionId: string;
    affectationVersionId?: string;
    ignoreOfficialReportId?: string;
  }): Promise<Prisma.AgendaWhereInput | null> {
    let versionId = query.affectationVersionId;
    if (!versionId) {
      const publishedVersion = await this.transparences.versions.lastPublished({
        sessionId: query.sessionId,
      });

      if (publishedVersion.isNone()) return null;
      versionId = publishedVersion.id;
    }

    const decidedFiles = {
      nominationFiles: {
        every: {
          nominationFile: {
            outcome: { in: NominationFileOutcome.decidedOutcomes() },
            reporterIds: { some: { versionId } },
          },
        },
      },
    } satisfies Prisma.AgendaVersionWhereInput;

    return {
      sessionId: query.sessionId,
      id: { in: query.ids ? Array.from(query.ids) : undefined },
      AND: [
        { OR: [{ officialReport: null }, { officialReportId: query.ignoreOfficialReportId }] },
        // the version asked to carry decided files is the very one the report will be made of, or
        // a draft would qualify an agenda whose validated version the report then reads
        {
          OR: [
            { versions: { some: { status: 'VALIDATED', ...decidedFiles } } },
            { versions: { every: { status: 'DRAFT' }, some: decidedFiles } },
          ],
        },
      ],
    };
  }

  findNonIncludedInPresentationPlan(query: {
    ids?: Set<string>;
    ignorePlanId?: string;
  }): Promise<FoundAgendasDto> {
    return this.find(
      {
        id: { in: query.ids ? Array.from(query.ids) : undefined },
        OR: [{ justicePresentationPlanId: null }, { justicePresentationPlanId: query.ignorePlanId }],
      },
      query.ids,
    );
  }

  @Transactional()
  private async find(where: Prisma.AgendaWhereInput, ids?: Set<string>): Promise<FoundAgendasDto> {
    const size = ids?.size ?? 0;
    if (size > 32_000) {
      this.logger.error(`${size} params provided, max 32,000`);
      throw new InternalServerErrorException();
    }

    const found = await this.db.tx.agenda.findMany({
      where,
      select: {
        id: true,
        formation: true,
        sessionId: true,
        sessionName: true,
        officialReportId: true,
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: {
            date: true,
            status: true,
            chairmanId: true,
            chairmanFirstName: true,
            chairmanLastName: true,
            sessionMeetingDate: true,
          },
        },
        justicePresentationPlan: {
          select: {
            plan: {
              select: {
                id: true,
                time: true,
                endTime: true,
                secretaryId: true,
                hasRenunciation: true,
                justiceDepartmentContactId: true,
                members: { select: { memberId: true, isAbsent: true } },
              },
            },
          },
        },
      },
    });

    const items = found
      .flatMap(({ versions, ...agenda }) => {
        const published = agendaContentOf(versions);
        return published ? [{ ...agenda, published }] : [];
      })
      .sort((a, b) => a.published.date.getTime() - b.published.date.getTime());

    if (ids && items.length !== ids.size) {
      const foundIds = new Set(items.map(({ id }) => id));
      const missing = ids.difference(foundIds);

      this.logger.warn(`Agendas not found: ${Array.from(missing).join(', ')}`);
    }

    const sessions = new Map<string, { typeDeSaisine: TypeDeSaisineEnum; date: DateOnlyJson }>();
    const sessionIds = new Set(items.map(({ sessionId }) => sessionId));
    for (const sessionId of sessionIds) {
      const session = await this.transparences.details({ formation: undefined, sessionId });
      sessions.set(sessionId, { date: session.date, typeDeSaisine: session.typeDeSaisine });
    }

    return {
      items: items.map((item) => ({
        id: item.id,
        /** @deprecated */
        chairmanId: item.published.chairmanId,

        chairman: {
          id: item.published.chairmanId,
          lastName: item.published.chairmanLastName,
          firstName: item.published.chairmanFirstName,
        },

        date: DateOnly.fromUtcDate(item.published.date).toJson(),
        session: {
          id: item.sessionId,
          name: item.sessionName,
          typeDeSaisine: sessions.get(item.sessionId)!.typeDeSaisine,
          date: sessions.get(item.sessionId)!.date,
        },
        formation: prismaFormationEnumToFormationEnum(item.formation),
        sessionMeetingDate: DateOnly.fromUtcDate(item.published.sessionMeetingDate).toJson(),
        officialReportId: item.officialReportId,
        presentationPlan: item.justicePresentationPlan
          ? {
              id: item.justicePresentationPlan.plan.id,
              startTime: dateToTimeOnly(item.justicePresentationPlan.plan.time),
              endTime: item.justicePresentationPlan.plan.endTime
                ? dateToTimeOnly(item.justicePresentationPlan.plan.endTime)
                : null,
              secretaryId: item.justicePresentationPlan.plan.secretaryId,
              justiceContactId:
                item.justicePresentationPlan.plan.justiceDepartmentContactId?.toString() ?? null,
              absentMembers: item.justicePresentationPlan.plan.members.flatMap((m) =>
                m.isAbsent ? [m.memberId] : [],
              ),
              hasRenunciation: item.justicePresentationPlan.plan.hasRenunciation,
            }
          : null,
      })),
    };
  }
}

export class FoundAgendasDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        date: dateOnlyJsonSchema,
        sessionMeetingDate: dateOnlyJsonSchema,
        formation: z.enum(FormationEnum),
        chairman: z.object({ id: z.string().nullable(), firstName: z.string(), lastName: z.string() }),
        officialReportId: z.string().nullable(),
        session: z.object({
          id: z.string(),
          name: z.string(),
          typeDeSaisine: z.enum(TypeDeSaisineEnum),
          date: dateOnlyJsonSchema,
        }),
        presentationPlan: z
          .object({
            id: z.string(),
            startTime: timeOnlySchema,
            endTime: timeOnlySchema.nullable(),
            hasRenunciation: z.boolean(),
            secretaryId: z.string().nullable(),
            justiceContactId: z.string().nullable(),
            absentMembers: z.array(z.string()),
          })
          .nullable(),
      }),
    ),
  }),
) {}
