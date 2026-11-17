import { ClsPluginTransactional, TransactionHost } from '@nestjs-cls/transactional';
import { Test } from '@nestjs/testing';
import { ClsModule, ClsService } from 'nestjs-cls';

import { TransactionalAdapterPrismaWithAfterCommit } from './after-commit';
import { Db } from './db';

const PRISMA = Symbol('prisma');

/**
 * a Db over a fake Prisma client, for a unit test to call what runs in a transaction. inContext suits a method
 * that opens its own, inTransaction opens one as a service would around a method in Propagation.Mandatory
 */
export async function transactionalTest(prisma: object): Promise<{
  db: Db;
  inContext: <T>(run: () => Promise<T>) => Promise<T>;
  inTransaction: <T>(run: () => Promise<T>) => Promise<T>;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ClsModule.forRoot({
        global: true,
        plugins: [
          new ClsPluginTransactional({
            // the adapter of DatabaseModule, which runs afterCommit
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

  const cls = moduleRef.get(ClsService);
  const db = moduleRef.get(TransactionHost) as Db;

  return {
    db,
    inContext: (run) => cls.run(run),
    inTransaction: (run) => cls.run(() => db.withTransaction(run)),
  };
}
