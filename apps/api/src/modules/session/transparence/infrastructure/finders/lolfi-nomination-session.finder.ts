import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';

import { SessionTransparence } from '../../domain/session-transparence';
import { SessionTransparenceRepository } from '../repositories/session-transparence.repository';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { DateOnly } from 'src/utils/date-only';

import { LolfiTransparenceFilesFinder } from './lolfi-nomination-files.finder';

@Injectable()
export class LolfiNominationSessionFinder {
  constructor(
    private readonly sessions: SessionTransparenceRepository,
    private readonly lolfiTransparenceFiles: LolfiTransparenceFilesFinder,
  ) {}

  async find(props: {
    id: number;
    name: string | null;
    creationDate: DateOnly;
  }): Promise<SessionTransparence[]> {
    const sessions = await this.sessions.findByLolfiSessionId(props.id);
    const nominationFiles = await this.lolfiTransparenceFiles.find(props.id);

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
          name:
            props.name ?? `Transparence du ${format(props.creationDate.toLocalStartOfDay(), 'dd/MM/yyyy')}`,

          dueDate: null,
          positionStartDate: null,
          observationClosingDate: null,
        });

      if (nominationFiles[formation].items.length === 0) continue;
      session.associateLolfiFiles({
        files: nominationFiles[formation].items,
      });

      output.push(session);
    }

    return output;
  }
}
