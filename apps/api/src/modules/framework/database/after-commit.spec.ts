import { afterCommit } from './after-commit';
import { type Db } from './db';
import { transactionalTest } from './transactional-test';

describe('afterCommit', () => {
  let db: Db;

  beforeEach(async () => {
    const prisma = { $transaction: (fn: (client: object) => Promise<unknown>) => fn({}) };

    ({ db } = await transactionalTest(prisma));
  });

  it('should run the action once the transaction is committed', async () => {
    const action = vi.fn();

    await db.withTransaction(async () => {
      afterCommit(db, action);
      expect(action).not.toHaveBeenCalled();
    });

    expect(action).toHaveBeenCalledOnce();
  });

  it('should never run the action of a transaction that rolls back', async () => {
    const action = vi.fn();

    await expect(
      db.withTransaction(async () => {
        afterCommit(db, action);
        throw new Error('rolled back');
      }),
    ).rejects.toThrow('rolled back');

    expect(action).not.toHaveBeenCalled();
  });

  it('should run the action right away outside of a transaction', () => {
    const action = vi.fn();

    afterCommit(db, action);

    expect(action).toHaveBeenCalledOnce();
  });

  it('should wait for the outer transaction a nested one joins', async () => {
    const action = vi.fn();

    await db.withTransaction(async () => {
      await db.withTransaction(async () => afterCommit(db, action));
      expect(action).not.toHaveBeenCalled();
    });

    expect(action).toHaveBeenCalledOnce();
  });
});
