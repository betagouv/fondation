import { ClsPluginTransactional, TransactionHost } from '@nestjs-cls/transactional';
import { Test } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';

import { afterCommit, TransactionalAdapterPrismaWithAfterCommit } from './after-commit';
import { type Db } from './db';

const PRISMA = Symbol('prisma');

describe('afterCommit', () => {
  let db: Db;

  beforeEach(async () => {
    const prisma = { $transaction: (fn: (client: object) => Promise<unknown>) => fn({}) };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ClsModule.forRoot({
          global: true,
          plugins: [
            new ClsPluginTransactional({
              adapter: new TransactionalAdapterPrismaWithAfterCommit({ prismaInjectionToken: PRISMA }),
              imports: [
                {
                  exports: [PRISMA],
                  module: class PrismaModule {},
                  providers: [{ provide: PRISMA, useValue: prisma }],
                },
              ],
            }),
          ],
        }),
      ],
    }).compile();

    db = moduleRef.get(TransactionHost);
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
