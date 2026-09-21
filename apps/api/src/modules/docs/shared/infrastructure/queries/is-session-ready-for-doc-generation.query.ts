import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { FinalDocNominationFileOutcomeEnum } from '../../domain/doc-nomination-file-outcome';
import { AGENDA_CONTENT_VERSIONS, agendaContentOf } from '../agenda-content';
import { AgendaFinder } from '../finders/agenda.finder';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { NominationFileOutcome } from 'src/modules/shared/nomination-file-outcome.enum';
import { DateOnly, DateOnlyJson, dateOnlyJsonSchema } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';

const AGENDA_BLOCKERS = [
  'ARCHIVED',
  'NO_AFFECTATION',
  'UNPUBLISHED_AFFECTATION',
  'ALL_FILES_REPORTED',
] as const;

const OFFICIAL_REPORT_BLOCKERS = [
  'NO_AGENDA',
  'ALL_AGENDAS_REPORTED',
  'NEVER_PUBLISHED',
  'INCOMPLETE_AGENDA',
] as const;

type OfficialReportBlocker = {
  reason: (typeof OFFICIAL_REPORT_BLOCKERS)[number];
  agendas: {
    meetingDate: DateOnlyJson;
    filesWithoutOutcome: number;
    filesWithoutReporter: number;
    filesWithUnpublishedReporter: number;
  }[];
};

@Injectable()
export class IsSessionReadyForDocGenerationQuery {
  constructor(
    private readonly db: Db,
    private readonly agendas: AgendaFinder,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  @Transactional()
  async handle(query: { sessionId: string }): Promise<DocGenerationSessionReadinessDto> {
    const session = await this.transparences.details({ formation: undefined, sessionId: query.sessionId });
    if (session.isArchived) {
      return {
        agendaBlocker: 'ARCHIVED',
        canCreateAgenda: false,
        canCreateOfficialReport: false,
        isReady: false,
        officialReportBlocker: null,
      };
    }

    const publishedVersion = await this.transparences.versions.lastPublished({
      sessionId: query.sessionId,
    });

    if (publishedVersion.isNone()) {
      return {
        agendaBlocker: 'NO_AFFECTATION',
        canCreateAgenda: false,
        canCreateOfficialReport: false,
        isReady: false,
        officialReportBlocker: blocker('NEVER_PUBLISHED'),
      };
    }

    const hasAnyReportableAgenda = await this.agendas.hasAnyReportableInOfficialReport({
      sessionId: query.sessionId,
      affectationVersionId: publishedVersion.id,
    });

    const hasAnyUnreportedFile = await this.db.tx.dossierDeNomination.findFirst({
      select: { id: true },
      where: {
        sessionId: query.sessionId,
        NOT: {
          outcome: { in: NominationFileOutcome.finalOutcomes() },
          officialReportInclusions: {
            some: {
              officialReport: { validatedAt: { not: null } },
              outcome: { in: Object.values(FinalDocNominationFileOutcomeEnum) },
            },
          },
        },
      },
    });

    const hasAnyPublishedReporter = await this.db.tx.nominationFileToReporter.findFirst({
      select: { userId: true },
      where: { versionId: publishedVersion.id },
    });

    const hasAnyDraftReporter =
      !hasAnyPublishedReporter &&
      (await this.db.tx.nominationFileToReporter.findFirst({
        select: { userId: true },
        where: { nominationFile: { sessionId: query.sessionId } },
      }));

    const canCreateAgenda = Boolean(hasAnyUnreportedFile) && Boolean(hasAnyPublishedReporter);
    const canCreateOfficialReport = hasAnyReportableAgenda;

    return {
      agendaBlocker: agendaBlockerOf({
        hasAnyPublishedReporter: Boolean(hasAnyPublishedReporter),
        hasAnyReporter: Boolean(hasAnyPublishedReporter || hasAnyDraftReporter),
        hasAnyUnreportedFile: Boolean(hasAnyUnreportedFile),
      }),
      canCreateAgenda,
      canCreateOfficialReport,
      isReady: canCreateAgenda || canCreateOfficialReport,
      officialReportBlocker: canCreateOfficialReport
        ? null
        : await this.officialReportBlocker({
            affectationVersionId: publishedVersion.id,
            sessionId: query.sessionId,
          }),
    };
  }

  private async officialReportBlocker(query: {
    affectationVersionId: string;
    sessionId: string;
  }): Promise<OfficialReportBlocker> {
    const found = await this.db.tx.agenda.findMany({
      where: { sessionId: query.sessionId },
      select: {
        officialReportId: true,
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: {
            status: true,
            sessionMeetingDate: true,
            nominationFiles: {
              select: {
                nominationFile: {
                  select: { id: true, outcome: true, reporterIds: { select: { versionId: true } } },
                },
              },
            },
          },
        },
      },
    });

    const agendas = found
      .flatMap(({ versions, ...agenda }) => {
        const published = agendaContentOf(versions);
        return published ? [{ ...agenda, published }] : [];
      })
      .sort((a, b) => a.published.sessionMeetingDate.getTime() - b.published.sessionMeetingDate.getTime());

    if (agendas.length === 0) return blocker('NO_AGENDA');

    const unreportedAgendas = agendas.filter(({ officialReportId }) => !isDefined(officialReportId));
    if (unreportedAgendas.length === 0) return blocker('ALL_AGENDAS_REPORTED');

    const incompleteAgendas = unreportedAgendas.flatMap((agenda) => {
      const files = agenda.published.nominationFiles.flatMap(({ nominationFile }) =>
        isDefined(nominationFile) ? [nominationFile] : [],
      );

      const unaffected = files.filter(
        ({ reporterIds }) => !reporterIds.some(({ versionId }) => versionId === query.affectationVersionId),
      );

      const incomplete = {
        meetingDate: DateOnly.fromUtcDate(agenda.published.sessionMeetingDate).toJson(),
        filesWithoutOutcome: files.filter(({ outcome }) => NominationFileOutcome.isAwaited(outcome)).length,
        filesWithoutReporter: unaffected.filter(({ reporterIds }) => reporterIds.length === 0).length,
        filesWithUnpublishedReporter: unaffected.filter(({ reporterIds }) => reporterIds.length > 0).length,
      };

      return missingCount(incomplete) > 0 ? [incomplete] : [];
    });

    return { reason: 'INCOMPLETE_AGENDA', agendas: incompleteAgendas };
  }
}

function missingCount(agenda: OfficialReportBlocker['agendas'][number]): number {
  return agenda.filesWithoutOutcome + agenda.filesWithoutReporter + agenda.filesWithUnpublishedReporter;
}

function blocker(reason: OfficialReportBlocker['reason']): OfficialReportBlocker {
  return { reason, agendas: [] };
}

function agendaBlockerOf(session: {
  hasAnyPublishedReporter: boolean;
  hasAnyReporter: boolean;
  hasAnyUnreportedFile: boolean;
}): (typeof AGENDA_BLOCKERS)[number] | null {
  if (!session.hasAnyReporter) return 'NO_AFFECTATION';
  if (!session.hasAnyPublishedReporter) return 'UNPUBLISHED_AFFECTATION';
  if (!session.hasAnyUnreportedFile) return 'ALL_FILES_REPORTED';

  return null;
}

export class DocGenerationSessionReadinessDto extends createZodDto(
  z.object({
    isReady: z.boolean(),
    canCreateAgenda: z.boolean(),
    canCreateOfficialReport: z.boolean(),
    agendaBlocker: z.enum(AGENDA_BLOCKERS).nullable(),
    officialReportBlocker: z
      .object({
        reason: z.enum(OFFICIAL_REPORT_BLOCKERS),
        agendas: z.array(
          z.object({
            meetingDate: dateOnlyJsonSchema,
            filesWithoutOutcome: z.number().int(),
            filesWithoutReporter: z.number().int(),
            filesWithUnpublishedReporter: z.number().int(),
          }),
        ),
      })
      .nullable(),
  }),
) {}
