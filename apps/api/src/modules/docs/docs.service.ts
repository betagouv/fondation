import { Injectable, StreamableFile } from '@nestjs/common';

import { DateOnlyJson, Magistrat } from 'shared-models';

import { DateOnly } from 'src/utils/date-only';
import { MembersService } from '../members';
import { Agenda } from './domain/agenda';
import { CreatedAgendaDto } from './infrastructure/docs.dto';
import {
  AgendaNominationFilesFinder,
  FoundAgendaNominationFiles,
} from './infrastructure/finders/agenda-nomination-files.finder';
import {
  DetailedAgendaMetadata,
  DetailsAgendaMetadataQuery,
} from './infrastructure/queries/details-agenda-metadata.query';
import {
  DetailedSessionDoc,
  DetailsSessionDocQuery,
} from './infrastructure/queries/details-session-doc.query';
import { FindAgendaDocumentPdfQuery } from './infrastructure/queries/find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './infrastructure/queries/find-agenda-document.query';
import {
  FindChairmenQuery,
  FoundChairmenDto,
} from './infrastructure/queries/find-chairmen.query';
import {
  FindSessionDocsQuery,
  FoundSessionDocsDto,
} from './infrastructure/queries/find-session-docs.query';
import {
  DocGenerationSessionReadinessDto,
  IsSessionReadyForDocGenerationQuery,
} from './infrastructure/queries/is-session-ready-for-doc-generation.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';

@Injectable()
export class DocsService {
  constructor(
    private readonly findChairmenQuery: FindChairmenQuery,
    private readonly agendaNominationFilesFinder: AgendaNominationFilesFinder,
    private readonly agendaRepository: AgendaRepository,
    private readonly members: MembersService,
    private readonly findAgendaDocumentQuery: FindAgendaDocumentQuery,
    private readonly findAgendaDocumentPdfQuery: FindAgendaDocumentPdfQuery,
    private readonly findSessionDocsQuery: FindSessionDocsQuery,
    private readonly detailsSessionDocQuery: DetailsSessionDocQuery,
    private readonly isSessionReadyForDocGenerationQuery: IsSessionReadyForDocGenerationQuery,
    private readonly detailsAgendaMetadataQuery: DetailsAgendaMetadataQuery,
  ) {}

  searchChairmen(query: {
    formation: Magistrat.Formation | undefined;
  }): Promise<FoundChairmenDto> {
    return this.findChairmenQuery.handle(query);
  }

  findAgendaNominationFiles(query: {
    sessionId: string;
    ignoreAgendaId?: string;
  }): Promise<FoundAgendaNominationFiles> {
    return this.agendaNominationFilesFinder.find(query);
  }

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

    const { items: nominationFiles } =
      await this.agendaNominationFilesFinder.find({
        sessionId: command.sessionId,
        ids: command.nominationFileIds,
      });

    const agenda = Agenda.create({
      chairman: { ...chairman, title: chairman.displayTitle },
      nominationFiles,
      sessionId: command.sessionId,
      authorId: command.authorId,
      date: DateOnly.fromJson(command.date),
      sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
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
    const agenda = await this.agendaRepository.find({
      agendaId: command.agendaId,
    });

    const chairman = await this.members.internalGetMember({
      id: command.chairmanId,
    });

    const { items: nominationFiles } =
      await this.agendaNominationFilesFinder.find({
        sessionId: agenda.sessionId,
        ids: command.nominationFileIds,
        ignoreAgendaId: command.agendaId,
      });

    agenda.update({
      chairman: { ...chairman, title: chairman.displayTitle },
      nominationFiles,
      authorId: command.authorId,
      date: DateOnly.fromJson(command.date),
      sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
    });

    await this.agendaRepository.persist(agenda);
  }

  async deleteAgenda(command: { agendaId: string }): Promise<void> {
    const agenda = await this.agendaRepository.find(command);
    agenda.delete();
    await this.agendaRepository.persist(agenda);
  }

  getOrCreateAgendaDocument(query: {
    id: string;
    forceNew?: boolean;
  }): Promise<string> {
    return this.findAgendaDocumentQuery.handle(query);
  }

  getOrCreateAgendaDocumentPdf(query: {
    id: string;
    forceNew?: boolean;
  }): Promise<StreamableFile> {
    return this.findAgendaDocumentPdfQuery.handle(query);
  }

  findSessionDocs(query: { sessionId: string }): Promise<FoundSessionDocsDto> {
    return this.findSessionDocsQuery.handle(query);
  }

  detailsSessionDoc(query: {
    sessionId: string;
    agendaId: string;
  }): Promise<DetailedSessionDoc> {
    return this.detailsSessionDocQuery.handle(query);
  }

  isSessionReadyForDocGeneration(query: {
    sessionId: string;
  }): Promise<DocGenerationSessionReadinessDto> {
    return this.isSessionReadyForDocGenerationQuery.handle(query);
  }

  detailsAgendaMetadata(query: {
    agendaId: string;
  }): Promise<DetailedAgendaMetadata> {
    return this.detailsAgendaMetadataQuery.handle(query);
  }
}
