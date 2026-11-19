import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import { sessionYear } from '../../domain/observation-block';
import type { ListedFollowedUpObservationSessionYearsDto } from '../dtos/followed-up-observation.dto';

@Injectable()
export class ListFollowedUpObservationSessionYearsQuery {
  constructor(
    private readonly db: Db,

    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  handle(): Promise<ListedFollowedUpObservationSessionYearsDto> {
    return this.db.withTransaction(async () => {
      const observations = await this.db.tx.observation.findMany({
        distinct: ['sessionId'],
        select: { sessionId: true } satisfies Prisma.ObservationSelect,
        where: { followUp: { not: null } },
      });
      // a deleted session is left out by the finder, as in the list
      const sessions = await this.sessions.internalFindSessions({
        sessionIds: observations.map(({ sessionId }) => sessionId),
      });
      const years = new Set([...sessions.values()].map(sessionYear));
      return { items: [...years].toSorted((a, b) => b - a).map((year) => ({ year })) };
    });
  }
}
