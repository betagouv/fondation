import { Injectable } from '@nestjs/common';
import { Magistrat, TypeDeSaisine } from 'shared-models';
import { DateOnly } from 'src/utils/date-only';
import { NominationFile } from '../domain/nomination-file';
import { NominationSession } from '../domain/nomination-session';
import { NominationSessionRepository } from './repositories/nomination-session.repository';

@Injectable()
export class SessionsTestService {
  constructor(
    private readonly nominationSessionRepository: NominationSessionRepository,
  ) {}

  async create(command: {
    name: string;
    typeDeSaisine: TypeDeSaisine;
    formation: Magistrat.Formation;
    date: DateOnly;
    observationClosingDate: DateOnly | null;
    dueDate: DateOnly | null;
    positionStartDate: DateOnly | null;
    lolfiSessionId: number | null;
  }): Promise<{ id: string }> {
    const session = NominationSession.create(command);
    await this.nominationSessionRepository.persist(session);
    return { id: session.id };
  }

  async associateNominationFiles(command: {
    sessionId: string;
    files: readonly NominationFile[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );

    session.associateNominationFiles(command);
    await this.nominationSessionRepository.persist(session);
  }
}
