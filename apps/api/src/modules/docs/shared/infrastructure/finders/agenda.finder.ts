import { Transactional } from '@nestjs-cls/transactional';
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { type AgendaProgress, agendaProgressOf } from '../../domain/agenda-progress';
import { AGENDA_CONTENT_VERSIONS, agendaContentOf } from '../agenda-content';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
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

export function writerOf(user: { firstName: string; id: string; lastName: string } | null) {
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
    affectationVersionId: string;
    sessionId: string;
  }): Promise<boolean> {
    const progress = await this.progressOfFreeAgendas(query);
    return [...progress.values()].some(({ isReportable }) => isReportable);
  }

  @Transactional()
  async findOfficialReportReadiness(query: {
    sessionId: string;
  }): Promise<Map<string, OfficialReportReadiness>> {
    const publishedVersion = await this.transparences.internalFindLastPublishedAffectationVersion({
      sessionId: query.sessionId,
    });
    if (publishedVersion.isNone()) {
      const agendas = await this.db.tx.agenda.findMany({
        select: { id: true } satisfies Prisma.AgendaSelect,
        where: { officialReportId: null, sessionId: query.sessionId },
      });
      return new Map(
        agendas.map(({ id }): [string, OfficialReportReadiness] => [id, { status: 'NEVER_PUBLISHED' }]),
      );
    }

    // the very rule the report creation checks, so the answer given here never contradicts it
    const progress = await this.progressOfFreeAgendas({
      affectationVersionId: publishedVersion.id,
      sessionId: query.sessionId,
    });

    return new Map(
      [...progress].map(([id, agenda]): [string, OfficialReportReadiness] => [
        id,
        agenda.isReportable
          ? { status: 'READY' }
          : {
              filesWithoutOutcome: agenda.filesWithoutOutcome,
              filesWithoutReporter: agenda.filesWithoutReporter,
              filesWithUnpublishedReporter: agenda.filesWithUnpublishedReporter,
              status: 'INCOMPLETE',
            },
      ]),
    );
  }

  @Transactional()
  async findReportableInOfficialReport(query: {
    ids?: Set<string>;
    ignoreOfficialReportId?: string;
    sessionId: string;
  }): Promise<FoundAgendasDto> {
    const publishedVersion = await this.transparences.internalFindLastPublishedAffectationVersion({
      sessionId: query.sessionId,
    });
    if (publishedVersion.isNone()) return { items: [] };

    const progress = await this.progressOfFreeAgendas({
      ...query,
      affectationVersionId: publishedVersion.id,
    });
    const reportableIds = [...progress].flatMap(([id, { isReportable }]) => (isReportable ? [id] : []));
    if (reportableIds.length === 0) return { items: [] };

    return this.find({ id: { in: reportableIds }, sessionId: query.sessionId }, query.ids);
  }

  /**
   * the progress of each agenda no official report holds yet (but the one ignored), read on the version
   * the other documents speak of
   */
  private async progressOfFreeAgendas(query: {
    affectationVersionId: string;
    ids?: Set<string>;
    ignoreOfficialReportId?: string;
    sessionId: string;
  }): Promise<Map<string, AgendaProgress>> {
    const agendas = await this.db.tx.agenda.findMany({
      select: {
        id: true,
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: { nominationFiles: { select: { nominationFileId: true } }, status: true },
        },
      } satisfies Prisma.AgendaSelect,
      where: {
        id: { in: query.ids ? [...query.ids] : undefined },
        OR: query.ignoreOfficialReportId
          ? [{ officialReportId: null }, { officialReportId: query.ignoreOfficialReportId }]
          : [{ officialReportId: null }],
        sessionId: query.sessionId,
      },
    });

    const fileIdsByAgendaId = new Map(
      agendas.map(({ id, versions }) => [
        id,
        (agendaContentOf(versions)?.nominationFiles ?? []).map(({ nominationFileId }) => nominationFileId),
      ]),
    );
    const progress = await this.transparences.internalFindNominationFilesProgress({
      affectationVersionId: query.affectationVersionId,
      nominationFileIds: [...new Set([...fileIdsByAgendaId.values()].flat().filter(isDefined))],
    });

    return new Map(
      [...fileIdsByAgendaId].map(([id, fileIds]) => [
        id,
        agendaProgressOf(fileIds.map((fileId) => (fileId ? (progress.get(fileId) ?? null) : null))),
      ]),
    );
  }

  findAwaitingPresentationPlan(query: {
    ids?: Set<string>;
    ignorePlanId?: string;
  }): Promise<FoundAgendasDto> {
    return this.find(
      {
        id: { in: query.ids ? Array.from(query.ids) : undefined },
        justicePresentationPlans: {
          none: { plan: { pdfId: { not: null } }, planId: { not: query.ignorePlanId } },
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
        formation: true,
        id: true,
        justicePresentationPlans: {
          select: {
            plan: {
              select: {
                chairmanFirstName: true,
                chairmanLastName: true,
                date: true,
                endTime: true,
                hasRenunciation: true,
                id: true,
                justiceDepartmentContactId: true,
                members: { select: { isAbsent: true, memberId: true } },
                pdfId: true,
                secretaryId: true,
                time: true,
              },
            },
          },
        },
        officialReportId: true,
        sessionId: true,
        sessionName: true,
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: {
            author: { select: { firstName: true, id: true, lastName: true } },
            chairmanFirstName: true,
            chairmanId: true,
            chairmanLastName: true,
            createdAt: true,
            date: true,
            sessionMeetingDate: true,
            status: true,
            validatedAt: true,
            validator: { select: { firstName: true, id: true, lastName: true } },
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
        return [{ ...agenda, draftPlans, published, validatedPlan }];
      })
      .sort((a, b) => a.published.date.getTime() - b.published.date.getTime());

    if (ids && items.length !== ids.size) {
      const foundIds = new Set(items.map(({ id }) => id));
      const missing = ids.difference(foundIds);

      this.logger.warn(`Agendas not found: ${Array.from(missing).join(', ')}`);
    }

    const sessionIds = new Set(items.map(({ sessionId }) => sessionId));
    const sessions = await this.transparences.internalFindSessions({ sessionIds: [...sessionIds] });
    if (sessions.size !== sessionIds.size) throw new NotFoundException();
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
          date: sessions.get(item.sessionId)!.date.toJson(),
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
