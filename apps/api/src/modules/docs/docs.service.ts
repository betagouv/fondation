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
  FindChairmenQuery,
  FoundChairmenDto,
} from './infrastructure/queries/find-chairmen.query';
import { GenerateAgendaPdfQuery } from './infrastructure/queries/generate-agenda-pdf.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';

@Injectable()
export class DocsService {
  constructor(
    private readonly findChairmenQuery: FindChairmenQuery,
    private readonly agendaNominationFilesFinder: AgendaNominationFilesFinder,
    private readonly agendaRepository: AgendaRepository,
    private readonly generateAgendaPdfQuery: GenerateAgendaPdfQuery,
    private readonly members: MembersService,
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
      chairman,
      nominationFiles,
      sessionId: command.sessionId,
      authorId: command.authorId,
      date: DateOnly.fromJson(command.date),
      sessionMeetingDate: DateOnly.fromJson(command.date),
    });

    await this.agendaRepository.persist(agenda);

    return { id: agenda.id };
  }

  generateAgendaHtml(query: { agendaId: string }): Promise<string> {
    return this.generateAgendaPdfQuery.handle(query);
  }

  generateAgendaPdf(query: { agendaId: string }): Promise<StreamableFile> {
    return this.generateAgendaPdfQuery.handle(query);
  }
}
