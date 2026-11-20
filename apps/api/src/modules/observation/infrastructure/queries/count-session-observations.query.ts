import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Db } from '../../../framework/database';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import type { RoleEnum } from '../../../shared/role.enum';
import type { CountedSessionObservationsDto } from '../dtos/session-observation.dto';

@Injectable()
export class CountSessionObservationsQuery {
  constructor(
    private readonly db: Db,

    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  handle(query: { role: RoleEnum; sessionId: string }): Promise<CountedSessionObservationsDto> {
    return this.db.withTransaction(async () => {
      await this.sessions.internalGetVisibleSession(query);
      const total = await this.db.tx.observation.count({ where: { sessionId: query.sessionId } });
      return { total };
    });
  }
}
