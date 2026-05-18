import { Injectable } from '@nestjs/common';

import { Agenda } from '../../domain/agenda';
import {
  AgendaNominationFilesFinder,
  FoundAgendaNominationFiles,
} from '../finders/agenda-nomination-files.finder';

@Injectable()
export class FindAgendaNominationFilesQuery {
  constructor(private readonly agendaNominationFilesFinder: AgendaNominationFilesFinder) {}

  async handle(query: { sessionId: string; ignoreAgendaId?: string }): Promise<FoundAgendaNominationFiles> {
    const { items: files } = await this.agendaNominationFilesFinder.find({ sessionId: query.sessionId });
    const reported = await this.agendaNominationFilesFinder.findAlreadyReportedIds({
      fileIds: new Set(files.map(({ id }) => id)),
      ignoreAgendaId: query.ignoreAgendaId,
    });

    const wasAlreadyReported = Agenda.fileWasAlreadyReported(reported);
    return {
      items: files.filter((file) => !wasAlreadyReported(file)),
    };
  }
}
