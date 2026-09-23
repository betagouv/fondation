import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { AGENDA_CONTENT_VERSIONS, agendaContentOf } from '../../../shared/infrastructure/agenda-content';
import { InvalidateOfficialReportCommand } from '../../domain/official-report-types';
import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';
import { OfficialReportRepository } from '../repositories/official-report.repository';
import { nominationFileOutcomeToDocNominationFileOutcome } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { DocInvalidation } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';
import { DocsNominationFilesFinder } from 'src/modules/docs/shared/infrastructure/finders/docs-nomination-files.finder';
import { readsTheSame } from 'src/modules/docs/shared/infrastructure/services/renderers/helpers';
import { Db } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class InternalInvalidateOfficialReportUseCase {
  constructor(
    private readonly db: Db,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,
    private readonly officialReportRepository: OfficialReportRepository,
    private readonly officialReportVersionFinder: OfficialReportVersionFinder,
  ) {}

  @Transactional()
  async handle(invalidation: DocInvalidation): Promise<void> {
    switch (invalidation.type) {
      case 'SessionAffectationVersionPublished':
        return this.invalidate(await this.mapSessionAffectationVersionPublished({ invalidation }));

      case 'SessionDateUpdated':
        return this.invalidate(await this.mapSessionDateUpdated({ invalidation }));

      case 'AgendaDateUpdated':
        return this.invalidate(await this.mapAgendaDateUpdated({ invalidation }));

      case 'AgendaNominationFilesUpdated':
        return this.invalidate(await this.mapAgendaNominationFilesUpdated({ invalidation }));

      case 'AgendaFileBlockEdited':
        return this.invalidate(await this.mapAgendaFileBlockEdited({ invalidation }));

      case 'NominationFileOutcomeUpdated':
        return this.invalidate(await this.mapNominationFileOutcomeUpdated({ invalidation }));

      // the report already answered when the draft was opened, and its own draft carries the answer
      case 'AgendaValidated':
        return;

      default:
        return assertNever(invalidation);
    }
  }

  private async invalidate(commands: readonly InvalidateOfficialReportCommand[]): Promise<void> {
    for (const command of commands) {
      const officialReport = await this.officialReportRepository.find({ id: command.id }).catch(() => null);

      if (!officialReport) continue;

      officialReport.invalidate(command);
      await this.officialReportRepository.persist(officialReport);
    }
  }

  private async mapNominationFileOutcomeUpdated(query: {
    invalidation: Extract<DocInvalidation, { type: 'NominationFileOutcomeUpdated' }>;
  }): Promise<InvalidateOfficialReportCommand[]> {
    const { nominationFileId, comment, outcome } = query.invalidation.payload;

    if (!isDefined(outcome)) return [];

    // a report holding a draft carries the file twice, and it is invalidated once
    const files = await this.db.tx.officialReportNominationFile.findMany({
      where: { nominationFileId: query.invalidation.payload.nominationFileId },
      select: { version: { select: { officialReportId: true } } },
      distinct: ['versionId'],
    });

    return [...new Set(files.map((file) => file.version.officialReportId))].map((officialReportId) => ({
      type: 'NominationFilesOutcomeUpdated',
      id: officialReportId,
      payload: {
        files: [
          {
            nominationFileId,
            outcome: { comment, value: nominationFileOutcomeToDocNominationFileOutcome(outcome) },
          },
        ],
      },
    }));
  }

  /**
   * the two documents write the very same sentence for a file: which one the report carries once
   * they part ways is the reader's call, and the block waits for it.
   */
  private async mapAgendaFileBlockEdited(query: {
    invalidation: Extract<DocInvalidation, { type: 'AgendaFileBlockEdited' }>;
  }): Promise<InvalidateOfficialReportCommand[]> {
    const { agendaId, nominationFileId } = query.invalidation.payload;

    const agenda = await this.db.tx.agenda.findUnique({
      where: { id: agendaId, officialReportId: { not: null } },
      select: {
        officialReportId: true,
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: {
            status: true,
            nominationFiles: { select: { htmlEdited: true }, where: { nominationFileId } },
          },
        },
      },
    });

    if (!agenda?.officialReportId) return [];

    const agendaHtml = agendaContentOf(agenda.versions)?.nominationFiles[0]?.htmlEdited ?? null;
    const reportVersionId = await this.officialReportVersionFinder.latest({
      officialReportId: agenda.officialReportId,
    });
    const reportFile = await this.db.tx.officialReportNominationFile.findFirst({
      where: { versionId: reportVersionId, nominationFileId },
      select: { htmlEdited: true },
    });

    const reportHtml = reportFile?.htmlEdited ?? null;
    if (agendaHtml === reportHtml || (agendaHtml && reportHtml && readsTheSame(agendaHtml, reportHtml))) {
      return [];
    }

    return [
      {
        type: 'AgendaFileBlockEdited',
        id: agenda.officialReportId,
        payload: { nominationFileId },
      },
    ];
  }

  private async mapAgendaNominationFilesUpdated(query: {
    invalidation: Extract<DocInvalidation, { type: 'AgendaNominationFilesUpdated' }>;
  }): Promise<InvalidateOfficialReportCommand[]> {
    const agendas = await this.db.tx.agenda.findMany({
      where: { id: query.invalidation.payload.agendaId, officialReportId: { not: null } },
      select: {
        id: true,
        sessionId: true,
        officialReportId: true,
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: { status: true, nominationFiles: { select: { nominationFileId: true } } },
        },
      },
    });

    const agendasWithOfficialReport = agendas.filter(
      (agenda): agenda is typeof agenda & { officialReportId: string } => isDefined(agenda.officialReportId),
    );

    if (agendasWithOfficialReport.length === 0) return [];

    const output: InvalidateOfficialReportCommand[] = [];

    for (const agenda of agendasWithOfficialReport) {
      const nominationFileIds = (agendaContentOf(agenda.versions)?.nominationFiles ?? []).flatMap(
        ({ nominationFileId }) => (isDefined(nominationFileId) ? [nominationFileId] : []),
      );

      const { items } = await this.docsNominationFilesFinder.find({
        ids: nominationFileIds,
        sessionId: agenda.sessionId,
      });

      output.push({
        type: 'AgendaNominationFilesUpdated',
        id: agenda.officialReportId,
        payload: {
          files: items
            .filter((file): file is typeof file & { outcome: NonNullable<(typeof file)['outcome']> } =>
              isDefined(file.outcome),
            )
            .map((file) => ({
              outcome: file.outcome,
              nominationFileId: file.id,
              reporters: file.reporters.map(({ fullTitledName }) => fullTitledName),
            })),
        },
      });
    }

    return output;
  }

  private async mapAgendaDateUpdated(query: {
    invalidation: Extract<DocInvalidation, { type: 'AgendaDateUpdated' }>;
  }): Promise<InvalidateOfficialReportCommand[]> {
    const agenda = await this.db.tx.agenda.findUnique({
      where: { id: query.invalidation.payload.agendaId },
      select: { id: true, sessionId: true, officialReportId: true },
    });

    if (!agenda?.officialReportId) return [];

    return [
      {
        type: 'AgendaDateUpdated',
        id: agenda.officialReportId,
        payload: {
          agendaId: agenda.id,
          currentDate: query.invalidation.payload.currentDate,
          previousDate: query.invalidation.payload.previousDate,
        },
      },
    ];
  }

  private async mapSessionDateUpdated(query: {
    invalidation: Extract<DocInvalidation, { type: 'SessionDateUpdated' }>;
  }): Promise<InvalidateOfficialReportCommand[]> {
    const agendas = await this.db.tx.agenda.findMany({
      where: { sessionId: query.invalidation.payload.sessionId, officialReportId: { not: null } },
      select: { id: true, sessionId: true, officialReportId: true },
    });

    return agendas
      .filter((agenda): agenda is typeof agenda & { officialReportId: string } =>
        isDefined(agenda.officialReportId),
      )
      .map((agenda) => ({
        type: 'SessionDateUpdated',
        id: agenda.officialReportId,
        payload: {
          sessionId: agenda.sessionId,
          currentDate: query.invalidation.payload.currentDate,
          previousDate: query.invalidation.payload.previousDate,
        },
      }));
  }

  private async mapSessionAffectationVersionPublished(query: {
    invalidation: Extract<DocInvalidation, { type: 'SessionAffectationVersionPublished' }>;
  }): Promise<InvalidateOfficialReportCommand[]> {
    const { invalidation } = query;

    const agendas = await this.db.tx.agenda.findMany({
      where: { sessionId: invalidation.payload.sessionId, officialReportId: { not: null } },
      select: {
        id: true,
        officialReportId: true,
        sessionId: true,
        versions: {
          ...AGENDA_CONTENT_VERSIONS,
          select: { status: true, nominationFiles: { select: { nominationFileId: true } } },
        },
      },
    });

    const agendasWithOfficialReport = agendas.filter(
      (agenda): agenda is typeof agenda & { officialReportId: string } => isDefined(agenda.officialReportId),
    );

    if (agendasWithOfficialReport.length === 0) return [];

    const output: InvalidateOfficialReportCommand[] = [];

    for (const agenda of agendasWithOfficialReport) {
      const nominationFileIds = (agendaContentOf(agenda.versions)?.nominationFiles ?? []).flatMap(
        ({ nominationFileId }) => (isDefined(nominationFileId) ? [nominationFileId] : []),
      );

      const { items } = await this.docsNominationFilesFinder.find({
        ids: nominationFileIds,
        sessionId: agenda.sessionId,
      });

      output.push({
        type: 'NominationFilesReportersUpdated',
        id: agenda.officialReportId,
        payload: {
          files: items.map((file) => ({
            nominationFileId: file.id,
            reporters: file.reporters.map(({ fullTitledName }) => fullTitledName),
          })),
        },
      });
    }

    return output;
  }
}
