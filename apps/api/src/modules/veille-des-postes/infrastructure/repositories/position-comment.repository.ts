import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { assertNever } from '../../../../utils/assert-never';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import {
  PositionComment,
  PositionCommentErased,
  PositionCommentWritten,
} from '../../domain/position-comment';
import { hasLapsed } from '../../domain/position-vacancy';
import { HeldPositionFinder } from '../finders/held-position.finder';

@Injectable()
export class PositionCommentRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly heldPositions: HeldPositionFinder,
  ) {}

  @Transactional(Propagation.Mandatory)
  async deleteLapsed(): Promise<number> {
    const comments = await this.db.tx.positionComment.findMany({
      select: {
        magistrat: { select: { currentPositionId: true, status: true } },
        magistratId: true,
        positionId: true,
      } satisfies Prisma.PositionCommentSelect,
    });

    const lapsed = comments.filter((comment) => hasLapsed(comment, comment.magistrat));
    if (lapsed.length === 0) return 0;

    await this.db.tx.positionComment.deleteMany({
      where: { OR: lapsed.map(({ magistratId, positionId }) => ({ magistratId, positionId })) },
    });

    return lapsed.length;
  }

  /** the comment of the position the magistrat holds today */
  @Transactional(Propagation.Mandatory)
  async find({ magistratId }: { magistratId: string }): Promise<PositionComment> {
    const { positionId } = await this.heldPositions.byHolder({ magistratId });

    return PositionComment.of({ magistratId, positionId });
  }

  @Transactional(Propagation.Mandatory)
  async persist(comment: PositionComment): Promise<void> {
    for (const message of comment.messages) {
      if (message instanceof PositionCommentErased) await this.persistErased(message);
      else if (message instanceof PositionCommentWritten) await this.persistWritten(message);
      else assertNever(message);
    }
  }

  private async persistErased(message: PositionCommentErased) {
    await this.db.tx.positionComment.deleteMany({
      where: { magistratId: message.magistratId, positionId: message.positionId },
    });
  }

  private async persistWritten(message: PositionCommentWritten) {
    const written = { authorId: message.authorId, comment: message.comment, updatedAt: this.clock.now() };

    await this.db.tx.positionComment.upsert({
      create: { ...written, magistratId: message.magistratId, positionId: message.positionId },
      update: written,
      where: { primaryKey: { magistratId: message.magistratId, positionId: message.positionId } },
    });
  }
}
