import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Db } from '../../../framework/database';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import { ObservationBlock } from '../../domain/observation-block';

@Injectable()
export class ObservationBlockRepository {
  constructor(
    private readonly db: Db,

    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  // the tracking stays editable once the session is archived, but not once it is deleted
  async find({
    magistratId,
    sessionId,
  }: {
    magistratId: string;
    sessionId: string;
  }): Promise<ObservationBlock> {
    const state = await this.sessions.internalFindSessionState({ sessionId });
    if (state === 'DELETED') throw new NotFoundException();

    const observations = await this.db.tx.observation.count({ where: { magistratId, sessionId } });
    if (observations === 0) throw new NotFoundException();

    return ObservationBlock.from({ magistratId, sessionId });
  }

  @Transactional(Propagation.Mandatory)
  async persist(block: ObservationBlock): Promise<void> {
    for (const { comment, magistratId, sessionId, status } of block.messages) {
      await this.db.tx.observationBlockTracking.upsert({
        create: { comment, magistratId, sessionId, status },
        update: { comment, status },
        where: { primaryKey: { magistratId, sessionId } },
      });
    }
  }
}
