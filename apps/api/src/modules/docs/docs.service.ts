import { Injectable } from '@nestjs/common';

import { Magistrat } from 'shared-models';
import { Agenda } from './domain/agenda';
import { CreatedAgendaDto } from './infrastructure/docs.dto';
import {
  FindChairmenQuery,
  FoundChairmenDto,
} from './infrastructure/queries/find-chairmen.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';

@Injectable()
export class DocsService {
  constructor(
    private readonly findChairmenQuery: FindChairmenQuery,
    private readonly agendaRepository: AgendaRepository,
  ) {}

  searchChairmen(query: {
    formation: Magistrat.Formation | undefined;
  }): Promise<FoundChairmenDto> {
    return this.findChairmenQuery.handle(query);
  }

  async createAgenda(command: {
    authorId: string;
    sessionId: string;
    nominationFileIds: readonly string[];
  }): Promise<CreatedAgendaDto> {
    const agenda = Agenda.create({
      sessionId: command.sessionId,
      authorId: command.authorId,
      nominationFileIds: command.nominationFileIds,
    });

    await this.agendaRepository.persist(agenda);

    return { id: agenda.id };
  }
}
