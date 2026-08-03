import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { InvalidateOfficialReportCommand } from '../../domain/official-report-types';
import { OfficialReportRepository } from '../repositories/official-report.repository';
import { nominationFileOutcomeToDocNominationFileOutcome } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { OfficialReportInvalidation } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';
import { DocsNominationFilesFinder } from 'src/modules/docs/shared/infrastructure/finders/docs-nomination-files.finder';
import { Db } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class InternalInvalidateOfficialReportUseCase {
  constructor(
    private readonly db: Db,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,
    private readonly officialReportRepository: OfficialReportRepository,
  ) {}

  @Transactional()
  async handle(invalidation: OfficialReportInvalidation): Promise<void> {
    switch (invalidation.type) {
      case 'SessionAffectationVersionPublished':
        return this.invalidate(await this.mapSessionAffectationVersionPublished({ invalidation }));

      case 'SessionDateUpdated':
        return this.invalidate(await this.mapSessionDateUpdated({ invalidation }));

      case 'AgendaDateUpdated':
        return this.invalidate(await this.mapAgendaDateUpdated({ invalidation }));

      case 'AgendaNominationFilesUpdated':
        return this.invalidate(await this.mapAgendaNominationFilesUpdated({ invalidation }));

      case 'NominationFileOutcomeUpdated':
        return this.invalidate(await this.mapNominationFileOutcomeUpdated({ invalidation }));

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
    invalidation: Extract<OfficialReportInvalidation, { type: 'NominationFileOutcomeUpdated' }>;
  }): Promise<InvalidateOfficialReportCommand[]> {
    const { nominationFileId, comment, outcome } = query.invalidation.payload;

    // We don't handle files without outcome in official reports
    if (!isDefined(outcome)) return [];

    const files = await this.db.tx.officialReportNominationFile.findMany({
      where: { nominationFileId: query.invalidation.payload.nominationFileId },
      select: { officialReportId: true },
    });

    return files.map((file) => ({
      type: 'NominationFilesOutcomeUpdated',
      id: file.officialReportId,
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

  private async mapAgendaNominationFilesUpdated(query: {
    invalidation: Extract<OfficialReportInvalidation, { type: 'AgendaNominationFilesUpdated' }>;
  }): Promise<InvalidateOfficialReportCommand[]> {
    const agendas = await this.db.tx.agenda.findMany({
      where: { id: query.invalidation.payload.agendaId, officialReportId: { not: null } },
      select: {
        id: true,
        sessionId: true,
        officialReportId: true,
        nominationFiles: { select: { nominationFileId: true } },
      },
    });

    const agendasWithOfficialReport = agendas.filter(
      (agenda): agenda is typeof agenda & { officialReportId: string } => isDefined(agenda.officialReportId),
    );

    if (agendasWithOfficialReport.length === 0) return [];

    const output: InvalidateOfficialReportCommand[] = [];

    for (const agenda of agendasWithOfficialReport) {
      const nominationFileIds = agenda.nominationFiles.flatMap(({ nominationFileId }) =>
        isDefined(nominationFileId) ? [nominationFileId] : [],
      );

      const { items } = await this.docsNominationFilesFinder.findNonReported({
        ids: nominationFileIds,
        sessionId: agenda.sessionId,
        ignoreOfficialReportId: agenda.officialReportId,
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
    invalidation: Extract<OfficialReportInvalidation, { type: 'AgendaDateUpdated' }>;
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
        payload: { agendaId: agenda.id, date: query.invalidation.payload.date },
      },
    ];
  }

  private async mapSessionDateUpdated(query: {
    invalidation: Extract<OfficialReportInvalidation, { type: 'SessionDateUpdated' }>;
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
        payload: { sessionId: agenda.sessionId, date: query.invalidation.payload.date },
      }));
  }

  private async mapSessionAffectationVersionPublished(query: {
    invalidation: Extract<OfficialReportInvalidation, { type: 'SessionAffectationVersionPublished' }>;
  }): Promise<InvalidateOfficialReportCommand[]> {
    const { invalidation } = query;

    const agendas = await this.db.tx.agenda.findMany({
      where: { sessionId: invalidation.payload.sessionId, officialReportId: { not: null } },
      select: {
        id: true,
        officialReportId: true,
        sessionId: true,
        nominationFiles: {
          select: { nominationFileId: true },
        },
      },
    });

    const agendasWithOfficialReport = agendas.filter(
      (agenda): agenda is typeof agenda & { officialReportId: string } => isDefined(agenda.officialReportId),
    );

    if (agendasWithOfficialReport.length === 0) return [];

    const output: InvalidateOfficialReportCommand[] = [];

    for (const agenda of agendasWithOfficialReport) {
      const nominationFileIds = agenda.nominationFiles.flatMap(({ nominationFileId }) =>
        isDefined(nominationFileId) ? [nominationFileId] : [],
      );

      const { items } = await this.docsNominationFilesFinder.findNonReported({
        ids: nominationFileIds,
        sessionId: agenda.sessionId,
        ignoreOfficialReportId: agenda.officialReportId,
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
