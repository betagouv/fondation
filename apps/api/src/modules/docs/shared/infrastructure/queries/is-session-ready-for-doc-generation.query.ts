import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { agendaProgressOf } from '../../domain/agenda-progress';
import { AGENDA_CONTENT_VERSIONS, agendaContentOf } from '../agenda-content';
import { ActedNominationFilesFinder } from '../finders/acted-nomination-files.finder';
import { AgendaFinder } from '../finders/agenda.finder';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { DateOnly, DateOnlyJson, dateOnlyJsonSchema } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { initials } from 'src/utils/user.util';

const AGENDA_BLOCKERS = ['ARCHIVED', 'NO_AFFECTATION', 'ALL_FILES_REPORTED'] as const;

const AGENDA_WARNINGS = ['NEVER_PUBLISHED', 'UNPUBLISHED_CHANGES'] as const;

const OFFICIAL_REPORT_BLOCKERS = [
  'NO_AGENDA',
  'ALL_AGENDAS_REPORTED',
  'NEVER_PUBLISHED',
  'INCOMPLETE_AGENDA',
] as const;

type OfficialReportBlocker = {
  agendas: {
    agendaId: string;
    chairmanInitials: string;
    filesCount: number;
    filesWithoutOutcome: number;
    filesWithoutReporter: number;
    filesWithUnpublishedReporter: number;
    meetingDate: DateOnlyJson;
  }[];
  reason: (typeof OFFICIAL_REPORT_BLOCKERS)[number];
};

@Injectable()
export class IsSessionReadyForDocGenerationQuery {
  constructor(
    private readonly db: Db,
    private readonly agendas: AgendaFinder,
    private readonly actedNominationFiles: ActedNominationFilesFinder,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  @Transactional()
  async handle(query: { sessionId: string }): Promise<DocGenerationSessionReadinessDto> {
    const session = await this.transparences.internalGetSession({ sessionId: query.sessionId });
    if (session.isArchived) {
      return {
        agendaBlocker: 'ARCHIVED',
        canCreateAgenda: false,
        canCreateOfficialReport: false,
        agendaWarning: null,
        isReady: false,
        officialReportBlocker: null,
      };
    }

    const lastVersion = await this.transparences.internalFindLastAffectationVersion({
      sessionId: query.sessionId,
    });
    const publishedVersion = await this.transparences.internalFindLastPublishedAffectationVersion({
      sessionId: query.sessionId,
    });

    // acted: a final outcome carried by a presented notice, whatever the official report says
    const sessionFileIds = new Set(
      (
        await this.transparences.internalFindSessionNominationFileOutcomes({ sessionId: query.sessionId })
      ).keys(),
    );
    const actedFileIds =
      sessionFileIds.size > 0 ? await this.actedNominationFiles.find({ fileIds: sessionFileIds }) : new Set();
    const hasAnyUnactedFile = [...sessionFileIds].some((id) => !actedFileIds.has(id));

    // every version keeps its own rows: a reporter removed since then still sits in the older ones
    const hasAnyReporter =
      !lastVersion.isNone() &&
      (await this.transparences.internalCountAffectedReporters({
        sessionId: query.sessionId,
        versionId: lastVersion.id,
      })) > 0;

    const agendaBlocker = agendaBlockerOf({
      hasAnyReporter,
      hasAnyUnactedFile,
    });

    const canCreateOfficialReport =
      !publishedVersion.isNone() &&
      (await this.agendas.hasAnyReportableInOfficialReport({
        affectationVersionId: publishedVersion.id,
        sessionId: query.sessionId,
      }));

    return {
      agendaBlocker,
      canCreateAgenda: agendaBlocker === null,
      canCreateOfficialReport,
      agendaWarning: agendaWarningOf({
        hasUnpublishedChanges: lastVersion.map((version) => version.status === 'BROUILLON') ?? false,
        wasEverPublished: !publishedVersion.isNone(),
      }),
      isReady: agendaBlocker === null || canCreateOfficialReport,
      officialReportBlocker: canCreateOfficialReport
        ? null
        : publishedVersion.isNone()
          ? blocker('NEVER_PUBLISHED')
          : await this.officialReportBlocker({
              affectationVersionId: publishedVersion.id,
              sessionId: query.sessionId,
            }),
    };
  }

  // TODO: see AgendaFinder.findOfficialReportReadiness
  private async officialReportBlocker(query: {
    affectationVersionId: string;
    sessionId: string;
  }): Promise<OfficialReportBlocker> {
    const found = await this.db.tx.agenda.findMany({
      where: { sessionId: query.sessionId },
      select: {
        id: true,
        officialReportId: true,
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: {
            chairmanFirstName: true,
            chairmanLastName: true,
            nominationFiles: { select: { nominationFileId: true } },
            sessionMeetingDate: true,
            status: true,
          },
        },
      } satisfies Prisma.AgendaSelect,
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

    const progress = await this.transparences.internalFindNominationFilesProgress({
      affectationVersionId: query.affectationVersionId,
      nominationFileIds: [
        ...new Set(
          unreportedAgendas.flatMap(({ published }) =>
            published.nominationFiles.map(({ nominationFileId }) => nominationFileId).filter(isDefined),
          ),
        ),
      ],
    });

    const incompleteAgendas = unreportedAgendas.flatMap((agenda) => {
      const { filesCount, filesWithoutOutcome, filesWithoutReporter, filesWithUnpublishedReporter } =
        agendaProgressOf(
          agenda.published.nominationFiles.map(({ nominationFileId }) =>
            nominationFileId ? (progress.get(nominationFileId) ?? null) : null,
          ),
        );

      const incomplete = {
        agendaId: agenda.id,
        chairmanInitials: initials({
          firstName: agenda.published.chairmanFirstName,
          lastName: agenda.published.chairmanLastName,
        }),
        filesCount,
        filesWithoutOutcome,
        filesWithoutReporter,
        filesWithUnpublishedReporter,
        meetingDate: DateOnly.fromUtcDate(agenda.published.sessionMeetingDate).toJson(),
      };

      return missingCount(incomplete) > 0 ? [incomplete] : [];
    });

    return { agendas: incompleteAgendas, reason: 'INCOMPLETE_AGENDA' };
  }
}

function missingCount(agenda: OfficialReportBlocker['agendas'][number]): number {
  return agenda.filesWithoutOutcome + agenda.filesWithoutReporter + agenda.filesWithUnpublishedReporter;
}

function blocker(reason: OfficialReportBlocker['reason']): OfficialReportBlocker {
  return { agendas: [], reason };
}

function agendaBlockerOf(session: {
  hasAnyReporter: boolean;
  hasAnyUnactedFile: boolean;
}): (typeof AGENDA_BLOCKERS)[number] | null {
  if (!session.hasAnyReporter) return 'NO_AFFECTATION';
  if (!session.hasAnyUnactedFile) return 'ALL_FILES_REPORTED';

  return null;
}

function agendaWarningOf(affectations: {
  hasUnpublishedChanges: boolean;
  wasEverPublished: boolean;
}): (typeof AGENDA_WARNINGS)[number] | null {
  if (!affectations.hasUnpublishedChanges) return null;

  return affectations.wasEverPublished ? 'UNPUBLISHED_CHANGES' : 'NEVER_PUBLISHED';
}

export class DocGenerationSessionReadinessDto extends createZodDto(
  z.object({
    isReady: z.boolean(),
    canCreateAgenda: z.boolean(),
    canCreateOfficialReport: z.boolean(),
    agendaBlocker: z.enum(AGENDA_BLOCKERS).nullable(),
    /** the agenda does not wait for a publication, yet it prints the published reporters only */
    agendaWarning: z.enum(AGENDA_WARNINGS).nullable(),
    officialReportBlocker: z
      .object({
        reason: z.enum(OFFICIAL_REPORT_BLOCKERS),
        agendas: z.array(
          z.object({
            agendaId: z.string(),
            chairmanInitials: z.string(),
            filesCount: z.number().int(),
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
