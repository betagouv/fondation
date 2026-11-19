// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import type { CourtCommentDelegate, PositionCommentDelegate } from '../../../../generated/prisma/models';
import { Clock } from '../../../framework/clock';
import { transactionalTest } from '../../../framework/database/transactional-test';
import { PositionComment } from '../../domain/position-comment';
import type { CommentedPositionFinder } from '../finders/commented-position.finder';

import { PositionCommentRepository } from './position-comment.repository';

describe('PositionCommentRepository', () => {
  let deleteLapsed: () => Promise<number>;
  let persist: (comment: PositionComment) => Promise<void>;
  let prisma: {
    $transaction: (fn: (client: object) => Promise<unknown>) => Promise<unknown>;
    courtComment: MockProxy<CourtCommentDelegate>;
    positionComment: MockProxy<PositionCommentDelegate>;
  };

  beforeEach(async () => {
    prisma = { $transaction: (fn) => fn(prisma), courtComment: mock(), positionComment: mock() };
    const { db, inTransaction } = await transactionalTest(prisma);
    const repository = new PositionCommentRepository(new Clock(), mock<CommentedPositionFinder>(), db);

    deleteLapsed = () => inTransaction(() => repository.deleteLapsed());
    persist = (comment) => inTransaction(() => repository.persist(comment));
  });

  it('deletes nothing while every magistrat holds their position', async () => {
    prisma.positionComment.findMany.mockResolvedValue([
      { magistrat: { currentPositionId: '7', status: 'ACTIVE' }, magistratId: 'kept', positionId: 7 },
    ] as never);

    await expect(deleteLapsed()).resolves.toBe(0);

    expect(prisma.positionComment.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes only the comments of the magistrats LOLFI moved or let go', async () => {
    prisma.positionComment.findMany.mockResolvedValue([
      { magistrat: { currentPositionId: '7', status: 'ACTIVE' }, magistratId: 'kept', positionId: 7 },
      { magistrat: { currentPositionId: '8', status: 'ACTIVE' }, magistratId: 'moved', positionId: 7 },
      { magistrat: { currentPositionId: '7', status: 'INACTIVE' }, magistratId: 'gone', positionId: 7 },
    ] as never);

    await expect(deleteLapsed()).resolves.toBe(2);

    expect(prisma.positionComment.deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        OR: [
          { magistratId: 'moved', positionId: 7 },
          { magistratId: 'gone', positionId: 7 },
        ],
      },
    });
  });

  it('erases the comment of a court on its court', async () => {
    const comment = PositionComment.of({ courtId: 'TJ  GRASSE' });
    comment.write({ authorId: 'author', comment: '  ' });

    await persist(comment);

    expect(prisma.courtComment.deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: { courtId: 'TJ  GRASSE' },
    });
    expect(prisma.positionComment.deleteMany).not.toHaveBeenCalled();
  });

  it('writes the comment of a court on its court', async () => {
    const comment = PositionComment.of({ courtId: 'TJ  GRASSE' });
    comment.write({ authorId: 'author', comment: 'Intérim' });

    await persist(comment);

    expect(prisma.courtComment.upsert).toHaveBeenCalledExactlyOnceWith({
      create: { authorId: 'author', comment: 'Intérim', courtId: 'TJ  GRASSE', updatedAt: expect.any(Date) },
      update: { authorId: 'author', comment: 'Intérim', updatedAt: expect.any(Date) },
      where: { courtId: 'TJ  GRASSE' },
    });
    expect(prisma.positionComment.upsert).not.toHaveBeenCalled();
  });
});
