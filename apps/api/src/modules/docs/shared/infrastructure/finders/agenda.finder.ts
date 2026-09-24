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
import { partition } from 'src/utils/iterables';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';
import { fullname } from 'src/utils/user.util';

export const writerSchema = z.object({ id: z.string(), name: z.string() }).nullable();

export const officialReportReadinessSchema = z.discriminatedUnion('status', [
  z.object({ status: z.enum(['READY']) }),
  z.object({ status: z.enum(['NEVER_PUBLISHED']) }),
  z.object({
    status: z.enum(['INCOMPLETE']),
    /** all at zero when the report rule fails on something these counts do not see */
    filesWithoutOutcome: z.number().int(),
    filesWithoutReporter: z.number().int(),
    filesWithUnpublishedReporter: z.number().int(),
  }),
]);

export type OfficialReportReadiness = z.infer<typeof officialReportReadinessSchema>;

export function writerOf(user: { id: string; firstName: string; lastName: string } | null) {
  return user ? { id: user.id, name: fullname(user) } : null;
}

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

    const result = await this.db.tx.agenda.findFirst({
      where,
      select: { id: true } satisfies Prisma.AgendaSelect,
    });
    return Boolean(result);
  }

  @Transactional()
  async findOfficialReportReadiness(query: {
    sessionId: string;
  }): Promise<Map<string, OfficialReportReadiness>> {
    const agendas = await this.db.tx.agenda.findMany({
      where: { sessionId: query.sessionId, officialReportId: null },
      select: {
        id: true,
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: {
            status: true,
            nominationFiles: {
              select: {
                nominationFile: {
                  select: { outcome: true, reporterIds: { select: { versionId: true } } },
                },
              },
            },
          },
        },
      } satisfies Prisma.AgendaSelect,
    });

    const publishedVersion = await this.transparences.versions.lastPublished({ sessionId: query.sessionId });
    if (publishedVersion.isNone()) {
      return new Map(
        agendas.map(({ id }): [string, OfficialReportReadiness] => [id, { status: 'NEVER_PUBLISHED' }]),
      );
    }

    // the very rule the report creation checks, so the answer given here never contradicts it
    const where = await this.buildFindReportableInOfficialReport({
      affectationVersionId: publishedVersion.id,
      sessionId: query.sessionId,
    });
    const reportable = where
      ? await this.db.tx.agenda.findMany({ where, select: { id: true } satisfies Prisma.AgendaSelect })
      : [];
    const reportableIds = new Set(reportable.map(({ id }) => id));

    return new Map(
      agendas.map(({ id, versions }): [string, OfficialReportReadiness] => {
        if (reportableIds.has(id)) return [id, { status: 'READY' }];

        const files = (agendaContentOf(versions)?.nominationFiles ?? []).flatMap(({ nominationFile }) =>
          nominationFile ? [nominationFile] : [],
        );
        const unaffected = files.filter(
          ({ reporterIds }) => !reporterIds.some(({ versionId }) => versionId === publishedVersion.id),
        );

        return [
          id,
          {
            filesWithoutOutcome: files.filter(({ outcome }) => NominationFileOutcome.isAwaited(outcome))
              .length,
            filesWithoutReporter: unaffected.filter(({ reporterIds }) => reporterIds.length === 0).length,
            filesWithUnpublishedReporter: unaffected.filter(({ reporterIds }) => reporterIds.length > 0)
              .length,
            status: 'INCOMPLETE',
          },
        ];
      }),
    );
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

  findAwaitingPresentationPlan(query: {
    ids?: Set<string>;
    ignorePlanId?: string;
  }): Promise<FoundAgendasDto> {
    return this.find(
      {
        id: { in: query.ids ? Array.from(query.ids) : undefined },
        justicePresentationPlans: {
          none: { planId: { not: query.ignorePlanId }, plan: { pdfId: { not: null } } },
        },
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
            createdAt: true,
            author: { select: { id: true, firstName: true, lastName: true } },
            validatedAt: true,
            validator: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        justicePresentationPlans: {
          select: {
            plan: {
              select: {
                id: true,
                pdfId: true,
                date: true,
                chairmanFirstName: true,
                chairmanLastName: true,
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
      } satisfies Prisma.AgendaSelect,
    });

    const items = found
      .flatMap(({ versions, justicePresentationPlans, ...agenda }) => {
        const published = agendaContentOf(versions);
        if (!published) return [];

        const [draftPlans, [validatedPlan]] = partition(
          justicePresentationPlans.map(({ plan }) => plan),
          ({ pdfId }) => pdfId === null,
        );
        return [{ ...agenda, published, draftPlans, validatedPlan }];
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
    const comments = await this.transparences.internalFindComments({ sessionIds: [...sessionIds] });

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
          comment: comments.get(item.sessionId) ?? null,
        },
        formation: prismaFormationEnumToFormationEnum(item.formation),
        sessionMeetingDate: DateOnly.fromUtcDate(item.published.sessionMeetingDate).toJson(),
        createdAt: item.published.createdAt.toISOString(),
        createdBy: writerOf(item.published.author),
        validatedAt: item.published.validatedAt?.toISOString() ?? null,
        validatedBy: writerOf(item.published.validator),
        officialReportId: item.officialReportId,
        draftPresentationPlans: item.draftPlans.map((plan) => ({
          id: plan.id,
          date: DateOnly.fromUtcDate(plan.date).toJson(),
          startTime: dateToTimeOnly(plan.time),
          chairman: { firstName: plan.chairmanFirstName, lastName: plan.chairmanLastName },
        })),
        presentationPlan: item.validatedPlan
          ? {
              id: item.validatedPlan.id,
              startTime: dateToTimeOnly(item.validatedPlan.time),
              endTime: item.validatedPlan.endTime ? dateToTimeOnly(item.validatedPlan.endTime) : null,
              secretaryId: item.validatedPlan.secretaryId,
              justiceContactId: item.validatedPlan.justiceDepartmentContactId?.toString() ?? null,
              absentMembers: item.validatedPlan.members.flatMap((m) => (m.isAbsent ? [m.memberId] : [])),
              hasRenunciation: item.validatedPlan.hasRenunciation,
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
        createdAt: z.iso.datetime(),
        createdBy: writerSchema,
        validatedAt: z.iso.datetime().nullable(),
        validatedBy: writerSchema,
        officialReportId: z.string().nullable(),
        session: z.object({
          id: z.string(),
          name: z.string(),
          typeDeSaisine: z.enum(TypeDeSaisineEnum),
          date: dateOnlyJsonSchema,
          /** the default comment of its session in a notice */
          comment: z.string().nullable(),
        }),
        draftPresentationPlans: z.array(
          z.object({
            id: z.string(),
            date: dateOnlyJsonSchema,
            startTime: timeOnlySchema,
            chairman: z.object({ firstName: z.string(), lastName: z.string() }),
          }),
        ),
        /** the validated notice, the only one that holds the agenda for good */
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
