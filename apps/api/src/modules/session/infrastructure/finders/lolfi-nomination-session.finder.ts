import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';

import { SessionTransparence } from 'src/modules/session/domain/session-transparence';
import { LolfiNominationFilesFinder } from 'src/modules/session/infrastructure/finders/lolfi-nomination-files.finder';
import { SessionTransparenceRepository } from 'src/modules/session/infrastructure/repositories/session-transparence.repository';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { DateOnly } from 'src/utils/date-only';

@Injectable()
export class LolfiNominationSessionFinder {
  constructor(
    private readonly sessions: SessionTransparenceRepository,
    private readonly lolfiNominationFiles: LolfiNominationFilesFinder,
  ) {}

  async find(props: {
    id: number;
    name: string | null;
    creationDate: DateOnly;
  }): Promise<SessionTransparence[]> {
    const sessions = await this.sessions.findByLolfiSessionId(props.id);
    const nominationFiles = await this.lolfiNominationFiles.find(props.id);

    const output: SessionTransparence[] = [];
    for (const formation of Object.values(FormationEnum)) {
      const existingSession = sessions[formation];
      if (existingSession?.isArchived) continue;

      const session =
        existingSession?.session ??
        SessionTransparence.create({
          formation,
          lolfiSessionId: props.id,
          date: props.creationDate,
          typeDeSaisine: 'TRANSPARENCE_GDS',
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
