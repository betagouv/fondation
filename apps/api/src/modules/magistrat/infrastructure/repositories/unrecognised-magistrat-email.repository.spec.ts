// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import type { UnrecognisedMagistratEmailDelegate } from '../../../../generated/prisma/models';
import { Clock } from '../../../framework/clock';
import { transactionalTest } from '../../../framework/database/transactional-test';

import { UnrecognisedMagistratEmailRepository } from './unrecognised-magistrat-email.repository';

describe('UnrecognisedMagistratEmailRepository', () => {
  let forgetOld: () => Promise<number>;
  let prisma: {
    $transaction: (fn: (client: object) => Promise<unknown>) => Promise<unknown>;
    unrecognisedMagistratEmail: MockProxy<UnrecognisedMagistratEmailDelegate>;
  };

  beforeEach(async () => {
    prisma = { $transaction: (fn) => fn(prisma), unrecognisedMagistratEmail: mock() };
    const { db, inTransaction } = await transactionalTest(prisma);
    const clock = mock<Clock>();
    clock.now.mockReturnValue(new Date('2026-11-27T03:15:00.000Z'));
    const repository = new UnrecognisedMagistratEmailRepository(clock, db);

    forgetOld = () => inTransaction(() => repository.forgetOld());
  });

  it('deletes the attempts made before the last 30 days', async () => {
    prisma.unrecognisedMagistratEmail.deleteMany.mockResolvedValue({ count: 2 });

    await expect(forgetOld()).resolves.toBe(2);

    expect(prisma.unrecognisedMagistratEmail.deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: { lastAttemptAt: { lt: new Date('2026-10-28T03:15:00.000Z') } },
    });
  });
});
