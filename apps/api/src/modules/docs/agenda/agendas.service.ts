import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Db } from '../../framework/database';
import { MembersService } from '../../members';
import { OfficialReportsInvalidatedIntegrationEvent } from '../shared/domain/invalidation/official-report-invalidated.integration-event';
import { DocsNominationFilesFinder } from '../shared/infrastructure/finders/docs-nomination-files.finder';
import { ReportedNominationFilesFinder } from '../shared/infrastructure/finders/reported-nomination-files.finder';
import { Files } from 'src/modules/framework/files';
import { DateOnly, DateOnlyJson } from 'src/utils/date-only';

import { Agenda } from './domain/agenda';
import { CreatedAgendaDto } from './infrastructure/agendas.dto';
import {
  DetailedAgendaDocumentBlocksDto,
  DetailsAgendaDocumentBlocksQuery,
} from './infrastructure/queries/details-agenda-document-blocks.query';
import {
  DetailedAgendaFilesDto,
  DetailsAgendaFilesQuery,
} from './infrastructure/queries/details-agenda-files.query';
import {
  DetailedAgendaMetadata,
  DetailsAgendaMetadataQuery,
} from './infrastructure/queries/details-agenda-metadata.query';
import {
  DetailedSessionAgenda,
  DetailsSessionAgendaQuery,
} from './infrastructure/queries/details-session-agenda.query';
import { FindAgendaDocumentPdfQuery } from './infrastructure/queries/find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './infrastructure/queries/find-agenda-document.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';

@Injectable()
export class AgendasService {
  constructor(
    private readonly files: Files,
    private readonly agendaRepository: AgendaRepository,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,
    private readonly reportedNominationFilesFinder: ReportedNominationFilesFinder,
    private readonly detailsAgendaMetadataQuery: DetailsAgendaMetadataQuery,
    private readonly detailsAgendaFilesQuery: DetailsAgendaFilesQuery,
    private readonly detailsAgendaDocumentBlocksQuery: DetailsAgendaDocumentBlocksQuery,
    private readonly detailsSessionAgendaQuery: DetailsSessionAgendaQuery,
    private readonly findAgendaDocumentPdfQuery: FindAgendaDocumentPdfQuery,
    private readonly findAgendaDocumentQuery: FindAgendaDocumentQuery,
    private readonly db: Db,

    private readonly events: EventEmitter2,

    @Inject(forwardRef(() => MembersService))
    private readonly members: MembersService,
  ) {}

  @Transactional()
  async createAgenda(command: {
    authorId: string;
    sessionId: string;
    chairmanId: string;
    date: DateOnlyJson;
    sessionMeetingDate: DateOnlyJson;
    nominationFileIds: readonly string[];
  }): Promise<CreatedAgendaDto> {
    const chairman = await this.members.internalGetMember({
      id: command.chairmanId,
    });

    const { items: nominationFiles } = await this.docsNominationFilesFinder.find({
      sessionId: command.sessionId,
      ids: command.nominationFileIds,
    });

    const reportedFiles = await this.reportedNominationFilesFinder.find({
      fileIds: new Set(nominationFiles.map(({ id }) => id)),
    });

    const agenda = Agenda.create({
      chairman,
      reportedFiles,
      authorId: command.authorId,
      sessionId: command.sessionId,
      date: DateOnly.fromJson(command.date),
      sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
      nominationFiles: nominationFiles.map((f) => ({
        id: f.id,
        number: f.number,
        outcome: f.outcome,
        name: f.magistrat.name,
        grade: f.magistrat.position.grade,
        currentPosition: f.magistrat.position.label,
        targetedGrade: f.targetPosition.grade,
        targetedPosition: f.targetPosition.label,
        reporters: f.reporters.map((r) => r.fullTitledName),
      })),
    });

    await this.agendaRepository.persist(agenda);

    return { id: agenda.id };
  }

  async updateAgenda(command: {
    agendaId: string;
    authorId: string;
    chairmanId: string;
    date: DateOnlyJson;
    sessionMeetingDate: DateOnlyJson;
    nominationFileIds: readonly string[];
  }): Promise<void> {
    const invalidations = await this.db.withTransaction(async () => {
      const agenda = await this.agendaRepository.find({ agendaId: command.agendaId });

      const chairman = await this.members.internalGetMember({
        id: command.chairmanId,
      });

      const { items: nominationFiles } = await this.docsNominationFilesFinder.find({
        sessionId: agenda.sessionId,
        ids: command.nominationFileIds,
      });

      const reportedFiles = await this.reportedNominationFilesFinder.find({
        fileIds: new Set(nominationFiles.map(({ id }) => id)),
        ignoreOfficialReportId: agenda.officialReportId ?? undefined,
      });

      agenda.update({
        chairman,
        reportedFiles,
        authorId: command.authorId,
        date: DateOnly.fromJson(command.date),
        sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
        nominationFiles: nominationFiles.map((f) => ({
          id: f.id,
          number: f.number,
          outcome: f.outcome,
          name: f.magistrat.name,
          grade: f.magistrat.position.grade,
          currentPosition: f.magistrat.position.label,
          targetedGrade: f.targetPosition.grade,
          targetedPosition: f.targetPosition.label,
          reporters: f.reporters.map((r) => r.fullTitledName),
        })),
      });

      return this.agendaRepository.persist(agenda);
    });

    for (const invalidation of invalidations) {
      await this.events.emitAsync(
        OfficialReportsInvalidatedIntegrationEvent.name,
        new OfficialReportsInvalidatedIntegrationEvent(invalidation),
      );
    }
  }

  @Transactional()
  async deleteAgenda(command: { agendaId: string }): Promise<void> {
    const agenda = await this.agendaRepository.find({ agendaId: command.agendaId });
    agenda.delete();
    await this.agendaRepository.persist(agenda);
  }

  getOrCreateAgendaDocument(query: { id: string; forceNew?: boolean }): Promise<string> {
    return this.findAgendaDocumentQuery.handle(query);
  }

  getOrCreateAgendaDocumentPdf(query: { id: string; forceNew?: boolean }): Promise<StreamableFile> {
    return this.findAgendaDocumentPdfQuery.handle(query);
  }

  detailsSessionAgenda(query: { sessionId: string; agendaId: string }): Promise<DetailedSessionAgenda> {
    return this.detailsSessionAgendaQuery.handle(query);
  }

  detailsAgendaMetadata(query: { agendaId: string }): Promise<DetailedAgendaMetadata> {
    return this.detailsAgendaMetadataQuery.handle(query);
  }

  async resetAgendaDocument(command: { id: string }): Promise<void> {
    const agenda = await this.db.tx.agenda.findUnique({
      where: { id: command.id },
      select: { pdf: { select: { id: true, path: true } } },
    });
    if (!agenda) throw new NotFoundException();

    await this.db.tx.agenda.update({
      where: { id: command.id },
      data: { html: null, isManuallyEdited: false, pdfFileId: null },
    });

    if (agenda.pdf) this.files.delete([agenda.pdf]);
  }

  /**
   * @deprecated Remplacé par l'édition par bloc ({@link editAgendaFileBlock}).
   * Conservé temporairement, ne pas utiliser pour de nouveaux usages.
   */
  async updateAgendaHtml(command: { id: string; html: Buffer }): Promise<void> {
    await this.db.tx.agenda.update({
      where: { id: command.id },
      data: { html: command.html.toString('utf-8'), isManuallyEdited: true },
    });
  }

  @Transactional()
  async editAgendaFileBlock(command: {
    agendaId: string;
    fileId: bigint;
    html: string;
    outdated: boolean;
  }): Promise<void> {
    const agenda = await this.agendaRepository.find({ agendaId: command.agendaId });
    agenda.editFileBlock({ fileId: command.fileId, html: command.html, outdated: command.outdated });
    await this.agendaRepository.persist(agenda);
  }

  @Transactional()
  async resetAgendaFileBlock(command: { agendaId: string; fileId: bigint }): Promise<void> {
    const agenda = await this.agendaRepository.find({ agendaId: command.agendaId });
    agenda.resetFileBlock({ fileId: command.fileId });
    await this.agendaRepository.persist(agenda);
  }

  detailsAgendaFiles(query: { agendaId: string }): Promise<DetailedAgendaFilesDto> {
    return this.detailsAgendaFilesQuery.handle(query);
  }

  detailsAgendaDocumentBlocks(query: { agendaId: string }): Promise<DetailedAgendaDocumentBlocksDto> {
    return this.detailsAgendaDocumentBlocksQuery.handle(query);
  }
}
