import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { FINAL_DOC_NOMINATION_FILE_OUTCOMES } from '../../domain/doc-nomination-file-outcome';
import { AGENDA_CONTENT_VERSIONS, agendaContentOf } from '../agenda-content';
import { AgendaFinder } from '../finders/agenda.finder';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { NominationFileOutcome } from 'src/modules/shared/nomination-file-outcome.enum';
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
        agendaWarning: null,
        isReady: false,
        officialReportBlocker: null,
      };
    }

    const lastVersion = await this.transparences.versions.last({ sessionId: query.sessionId });
    const publishedVersion = await this.transparences.versions.lastPublished({
      sessionId: query.sessionId,
    });

    // acted: a final outcome carried by a presented notice, whatever the official report says
    const hasAnyUnactedFile = await this.db.tx.dossierDeNomination.findFirst({
      where: {
        NOT: {
          outcome: { in: NominationFileOutcome.finalOutcomes() },
          presentationPlanInclusions: {
            some: {
              outcome: { in: [...FINAL_DOC_NOMINATION_FILE_OUTCOMES] },
              plan: { isPresented: true },
            },
          },
        },
        sessionId: query.sessionId,
      },
      select: { id: true } satisfies Prisma.DossierDeNominationSelect,
    });

    // every version keeps its own rows: a reporter removed since then still sits in the older ones
    const hasAnyReporter =
      !lastVersion.isNone() &&
      (await this.db.tx.nominationFileToReporter.findFirst({
        where: { versionId: lastVersion.id },
        select: { userId: true } satisfies Prisma.NominationFileToReporterSelect,
      }));

    const agendaBlocker = agendaBlockerOf({
      hasAnyReporter: Boolean(hasAnyReporter),
      hasAnyUnactedFile: Boolean(hasAnyUnactedFile),
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
            nominationFiles: {
              select: {
                nominationFile: {
                  select: { id: true, outcome: true, reporterIds: { select: { versionId: true } } },
                },
              },
            },
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

    const incompleteAgendas = unreportedAgendas.flatMap((agenda) => {
      const files = agenda.published.nominationFiles.flatMap(({ nominationFile }) =>
        isDefined(nominationFile) ? [nominationFile] : [],
      );

      const unaffected = files.filter(
        ({ reporterIds }) => !reporterIds.some(({ versionId }) => versionId === query.affectationVersionId),
      );

      const incomplete = {
        agendaId: agenda.id,
        chairmanInitials: initials({
          firstName: agenda.published.chairmanFirstName,
          lastName: agenda.published.chairmanLastName,
        }),
        filesCount: files.length,
        filesWithoutOutcome: files.filter(({ outcome }) => outcome === null).length,
        filesWithoutReporter: unaffected.filter(({ reporterIds }) => reporterIds.length === 0).length,
        filesWithUnpublishedReporter: unaffected.filter(({ reporterIds }) => reporterIds.length > 0).length,
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
