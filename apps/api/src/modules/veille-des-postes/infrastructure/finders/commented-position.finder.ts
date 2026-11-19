import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import { type CommentedPosition, isCommentedOnCourt } from '../../domain/position-comment';
import { isWatchedCourt } from '../../domain/watched-position';

import { HeldPositionFinder } from './held-position.finder';

@Injectable()
export class CommentedPositionFinder {
  constructor(
    private readonly db: Db,
    private readonly heldPositions: HeldPositionFinder,
  ) {}

  async ofCourt({ courtId }: { courtId: string }): Promise<CommentedPosition> {
    const court = await this.db.tx.jurisdiction.findUnique({
      select: { dateSuppression: true, typeJur: true } satisfies Prisma.JurisdictionSelect,
      where: { codejur: courtId },
    });
    const removed = court?.dateSuppression && court.dateSuppression <= new Date();
    if (!court || removed || !isWatchedCourt(court.typeJur)) throw new NotFoundException();

    return { courtId };
  }

  async ofHolder({ magistratId }: { magistratId: string }): Promise<CommentedPosition> {
    const { courtId, positionId, watched } = await this.heldPositions.byHolder({ magistratId });

    return isCommentedOnCourt(watched) ? { courtId } : { magistratId, positionId };
  }
}
