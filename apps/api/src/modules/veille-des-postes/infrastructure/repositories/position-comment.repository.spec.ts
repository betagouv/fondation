// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import type { PositionCommentDelegate } from '../../../../generated/prisma/models';
import { Clock } from '../../../framework/clock';
import { transactionalTest } from '../../../framework/database/transactional-test';
import type { HeldPositionFinder } from '../finders/held-position.finder';

import { PositionCommentRepository } from './position-comment.repository';

describe('PositionCommentRepository', () => {
  let deleteLapsed: () => Promise<number>;
  let prisma: {
    $transaction: (fn: (client: object) => Promise<unknown>) => Promise<unknown>;
    positionComment: MockProxy<PositionCommentDelegate>;
  };

  beforeEach(async () => {
    prisma = { $transaction: (fn) => fn(prisma), positionComment: mock() };
    const { db, inTransaction } = await transactionalTest(prisma);
    const repository = new PositionCommentRepository(new Clock(), db, mock<HeldPositionFinder>());

    deleteLapsed = () => inTransaction(() => repository.deleteLapsed());
  });

  it('deletes nothing while every magistrat holds their position', async () => {
    prisma.positionComment.findMany.mockResolvedValue([
      { magistrat: { currentPositionId: '7', status: 'ACTIVE' }, magistratId: 'kept', positionId: 7 },
    ] as never);

    await expect(deleteLapsed()).resolves.toBe(0);

    expect(prisma.positionComment.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes the comments of the magistrats LOLFI moved or let go, and only them', async () => {
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
});
