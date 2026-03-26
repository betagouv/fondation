import {
  Injectable,
  NotImplementedException,
  StreamableFile,
} from '@nestjs/common';

import { DateOnlyJson, Magistrat } from 'shared-models';

import { DateOnly } from 'src/utils/date-only';
import { MembersService } from '../members';
import { Agenda } from './domain/agenda';
import { CreatedAgendaDto } from './infrastructure/docs.dto';
import {
  AgendaNominationFilesFinder,
  FoundAgendaNominationFiles,
} from './infrastructure/finders/agenda-nomination-files.finder';
import { FindAgendaDocumentQuery } from './infrastructure/queries/find-agenda-document.query';
import {
  FindChairmenQuery,
  FoundChairmenDto,
} from './infrastructure/queries/find-chairmen.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';

@Injectable()
export class DocsService {
  constructor(
    private readonly findChairmenQuery: FindChairmenQuery,
    private readonly agendaNominationFilesFinder: AgendaNominationFilesFinder,
    private readonly agendaRepository: AgendaRepository,
    private readonly members: MembersService,
    private readonly findAgendaDocumentQuery: FindAgendaDocumentQuery,
  ) {}

  searchChairmen(query: {
    formation: Magistrat.Formation | undefined;
  }): Promise<FoundChairmenDto> {
    return this.findChairmenQuery.handle(query);
  }

  findAgendaNominationFiles(query: {
    sessionId: string;
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
      sessionMeetingDate: DateOnly.fromJson(command.date),
    });

    await this.agendaRepository.persist(agenda);

    return { id: agenda.id };
  }

  findAgendaDocument(query: {
    id: string;
    forceNew?: boolean;
  }): Promise<string> {
    return this.findAgendaDocumentQuery.handle(query);
  }

  /* eslint-disable */
  generateAgendaPdf(_query: { agendaId: string }): Promise<StreamableFile> {
    throw new NotImplementedException();
  }
  /* eslint-enable */
}
