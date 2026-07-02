import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';

import { Magistrat, TypeDeSaisine } from 'shared-models';

import { NominationSession } from 'src/modules/session/domain/nomination-session';
import { LolfiNominationFilesFinder } from 'src/modules/session/infrastructure/finders/lolfi-nomination-files.finder';
import { NominationSessionRepository } from 'src/modules/session/infrastructure/repositories/nomination-session.repository';
import { DateOnly } from 'src/utils/date-only';

@Injectable()
export class LolfiNominationSessionFinder {
  constructor(
    private readonly sessions: NominationSessionRepository,
    private readonly lolfiNominationFiles: LolfiNominationFilesFinder,
  ) {}

  async find(props: {
    id: number;
    name: string | null;
    creationDate: DateOnly;
  }): Promise<NominationSession[]> {
    const sessions = await this.sessions.findByLolfiSessionId(props.id);
    const nominationFiles = await this.lolfiNominationFiles.find(props.id);

    const output: NominationSession[] = [];
    for (const formation of Object.values(Magistrat.Formation)) {
      const existingSession = sessions[formation];
      if (existingSession?.isArchived) continue;

      const session =
        existingSession?.session ??
        NominationSession.create({
          formation,
          lolfiSessionId: props.id,
          date: props.creationDate,
          typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
          name: props.name ?? `Transparence du ${format(props.creationDate.toDate(), 'dd/MM/yyyy')}`,

          dueDate: null,
          positionStartDate: null,
          observationClosingDate: null,
        });

      if (nominationFiles[formation].items.length === 0) continue;
      session.associateLolfiNominationFiles({
        files: nominationFiles[formation].items,
      });

      output.push(session);
    }

    return output;
  }
}
