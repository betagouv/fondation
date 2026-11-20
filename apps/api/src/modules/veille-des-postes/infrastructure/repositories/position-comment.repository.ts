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
import { CommentedPositionFinder } from '../finders/commented-position.finder';

@Injectable()
export class PositionCommentRepository {
  constructor(
    private readonly clock: Clock,
    private readonly commentedPositions: CommentedPositionFinder,
    private readonly db: Db,
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

  @Transactional(Propagation.Mandatory)
  async findOfCourt(query: { courtId: string }): Promise<PositionComment> {
    return PositionComment.of(await this.commentedPositions.ofCourt(query));
  }

  /** the comment of the position the magistrat holds today */
  @Transactional(Propagation.Mandatory)
  async findOfHolder(query: { magistratId: string }): Promise<PositionComment> {
    return PositionComment.of(await this.commentedPositions.ofHolder(query));
  }

  @Transactional(Propagation.Mandatory)
  async persist(comment: PositionComment): Promise<void> {
    for (const message of comment.messages) {
      if (message instanceof PositionCommentErased) await this.persistErased(message);
      else if (message instanceof PositionCommentWritten) await this.persistWritten(message);
      else assertNever(message);
    }
  }

  private async persistErased({ position }: PositionCommentErased) {
    if ('courtId' in position) {
      await this.db.tx.courtComment.deleteMany({ where: { courtId: position.courtId } });
    } else {
      await this.db.tx.positionComment.deleteMany({ where: position });
    }
  }

  private async persistWritten(message: PositionCommentWritten) {
    const written = { authorId: message.authorId, comment: message.comment, updatedAt: this.clock.now() };
    const { position } = message;

    if ('courtId' in position) {
      await this.db.tx.courtComment.upsert({
        create: { ...written, courtId: position.courtId },
        update: written,
        where: { courtId: position.courtId },
      });
    } else {
      await this.db.tx.positionComment.upsert({
        create: { ...written, ...position },
        update: written,
        where: { primaryKey: position },
      });
    }
  }
}
