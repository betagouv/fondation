import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import { isHeadOfCourt } from '../../domain/position-alert';
import type { CommentedPosition } from '../../domain/position-comment';
import { isRemovedCourt, isWatchedCourt } from '../../domain/watched-position';

import { HeldPositionFinder } from './held-position.finder';

@Injectable()
export class CommentedPositionFinder {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly heldPositions: HeldPositionFinder,
  ) {}

  async ofCourt({ courtId }: { courtId: string }): Promise<CommentedPosition> {
    const court = await this.db.tx.jurisdiction.findUnique({
      select: { dateSuppression: true, typeJur: true } satisfies Prisma.JurisdictionSelect,
      where: { codejur: courtId },
    });
    if (!court || isRemovedCourt(court.dateSuppression, this.clock.now()) || !isWatchedCourt(court.typeJur)) {
      throw new NotFoundException();
    }

    return { courtId };
  }

  async ofHolder({ magistratId }: { magistratId: string }): Promise<CommentedPosition> {
    const { courtId, positionId, watched } = await this.heldPositions.byHolder({ magistratId });

    return isHeadOfCourt(watched) ? { courtId } : { magistratId, positionId };
  }
}
