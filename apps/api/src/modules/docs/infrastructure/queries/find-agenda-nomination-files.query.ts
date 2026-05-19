import { Injectable } from '@nestjs/common';

import {
  AgendaNominationFilesFinder,
  FoundAgendaNominationFiles,
} from '../finders/agenda-nomination-files.finder';

@Injectable()
export class FindAgendaNominationFilesQuery {
  constructor(private readonly agendaNominationFilesFinder: AgendaNominationFilesFinder) {}

  async handle(query: { sessionId: string; ignoreAgendaId?: string }): Promise<FoundAgendaNominationFiles> {
    const { items: files } = await this.agendaNominationFilesFinder.find({ sessionId: query.sessionId });
    const reported = await this.agendaNominationFilesFinder.findReportedNominationFilesCollection({
      fileIds: new Set(files.map(({ id }) => id)),
      ignoreAgendaId: query.ignoreAgendaId,
    });

    return {
      items: files.filter(
        (file) => !reported.wasFileReported({ ignoreAgendaId: query.ignoreAgendaId, fileId: file.id }),
      ),
    };
  }
}
