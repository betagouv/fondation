import { Injectable, Logger } from '@nestjs/common';
import { format } from 'date-fns';

import { DateOnly } from '../../../../../utils/date-only';
import { FormationEnum } from '../../../../shared/formation.enum';
import { SessionTransparence } from '../../domain/session-transparence';
import { SessionTransparenceRepository } from '../repositories/session-transparence.repository';

import { LolfiTransparenceFilesFinder } from './lolfi-nomination-files.finder';

@Injectable()
export class LolfiNominationSessionFinder {
  private readonly logger = new Logger(LolfiNominationSessionFinder.name);

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
      if (existingSession && !existingSession.isIngestable) {
        this.logger.warn(
          `lolfi session ${props.id} skipped on formation ${formation}: ${existingSession.reason}`,
        );
        continue;
      }

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
