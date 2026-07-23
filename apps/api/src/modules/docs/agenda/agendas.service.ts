import { forwardRef, Inject, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../../framework/database';
import { MembersService } from '../../members';
import { OfficialReportsInvalidatedIntegrationEvent } from '../shared/domain/invalidation/official-report-invalidated.integration-event';
import { DocsNominationFilesFinder } from '../shared/infrastructure/finders/docs-nomination-files.finder';
import { ReportedNominationFilesFinder } from '../shared/infrastructure/finders/reported-nomination-files.finder';
import { Files } from 'src/modules/framework/files';
import { DateOnly, DateOnlyJson } from 'src/utils/date-only';

import { Agenda } from './domain/agenda';
import { CreatedAgendaDto } from './infrastructure/agendas.dto';
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
    private readonly detailsSessionAgendaQuery: DetailsSessionAgendaQuery,
    private readonly findAgendaDocumentPdfQuery: FindAgendaDocumentPdfQuery,
    private readonly findAgendaDocumentQuery: FindAgendaDocumentQuery,
    private readonly prisma: PrismaService,

    private readonly events: EventEmitter2,

    @Inject(forwardRef(() => MembersService))
    private readonly members: MembersService,
  ) {}

  async createAgenda(command: {
    authorId: string;
    sessionId: string;
    chairmanId: string;
    date: DateOnlyJson;
    sessionMeetingDate: DateOnlyJson;
    nominationFileIds: readonly string[];
  }): Promise<CreatedAgendaDto> {
    return this.prisma.$transaction(async (tx) => {
      const chairman = await this.members.internalGetMember({
        tx,
        id: command.chairmanId,
      });

      const { items: nominationFiles } = await this.docsNominationFilesFinder.find({
        tx,
        sessionId: command.sessionId,
        ids: command.nominationFileIds,
      });

      const reportedFiles = await this.reportedNominationFilesFinder.find({
        tx,
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

      await this.agendaRepository.persist(agenda, tx);

      return { id: agenda.id };
    });
  }

  async updateAgenda(command: {
    agendaId: string;
    authorId: string;
    chairmanId: string;
    date: DateOnlyJson;
    sessionMeetingDate: DateOnlyJson;
    nominationFileIds: readonly string[];
  }): Promise<void> {
    const invalidations = await this.prisma.$transaction(async (tx) => {
      const agenda = await this.agendaRepository.find({
        tx,
        agendaId: command.agendaId,
      });

      const chairman = await this.members.internalGetMember({
        tx,
        id: command.chairmanId,
      });

      const { items: nominationFiles } = await this.docsNominationFilesFinder.find({
        tx,
        sessionId: agenda.sessionId,
        ids: command.nominationFileIds,
      });

      const reportedFiles = await this.reportedNominationFilesFinder.find({
        tx,
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

      return await this.agendaRepository.persist(agenda, tx);
    });

    for (const invalidation of invalidations) {
      await this.events.emitAsync(
        OfficialReportsInvalidatedIntegrationEvent.name,
        new OfficialReportsInvalidatedIntegrationEvent(invalidation),
      );
    }
  }

  async deleteAgenda(command: { agendaId: string }): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const agenda = await this.agendaRepository.find({ ...command, tx });
      agenda.delete();
      await this.agendaRepository.persist(agenda, tx);
    });
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
    const agenda = await this.prisma.agenda.findUnique({
      where: { id: command.id },
      select: { pdf: { select: { id: true, path: true } } },
    });
    if (!agenda) throw new NotFoundException();

    await this.prisma.agenda.update({
      where: { id: command.id },
      data: { html: null, isManuallyEdited: false, pdfFileId: null },
    });

    if (agenda.pdf) this.files.delete([agenda.pdf]);
  }

  async updateAgendaHtml(command: { id: string; html: Buffer }): Promise<void> {
    await this.prisma.agenda.update({
      where: { id: command.id },
      data: { html: command.html.toString('utf-8'), isManuallyEdited: true },
    });
  }

  detailsAgendaFiles(query: { agendaId: string }): Promise<DetailedAgendaFilesDto> {
    return this.detailsAgendaFilesQuery.handle(query);
  }
}
