import {
  type PrismaTransactionalAdapterOptions,
  TransactionalAdapterPrisma,
} from '@nestjs-cls/transactional-adapter-prisma';

import { type PrismaClient } from 'src/generated/prisma/client';

import { type Db } from './db';

const pendingByTransaction = new WeakMap<object, (() => unknown)[]>();

/** runs the action once the current transaction is committed, right away outside of one, never if it rolls back */
export function afterCommit(db: Db, action: () => unknown): void {
  const pending = db.isTransactionActive() ? pendingByTransaction.get(db.tx) : undefined;
  if (pending) pending.push(action);
  else action();
}

export class TransactionalAdapterPrismaWithAfterCommit extends TransactionalAdapterPrisma<PrismaClient> {
  constructor(options: PrismaTransactionalAdapterOptions<PrismaClient>) {
    super(options);

    const optionsFactory = this.optionsFactory;
    this.optionsFactory = (prisma) => {
      const adapterOptions = optionsFactory(prisma);

      return {
        ...adapterOptions,
        wrapWithTransaction: async (txOptions, fn, setClient) => {
          const pending: (() => unknown)[] = [];
          const result = await adapterOptions.wrapWithTransaction(txOptions, fn, (client) => {
            if (client) pendingByTransaction.set(client, pending);
            setClient(client);
          });

          for (const action of pending) action();
          return result;
        },
      };
    };
  }
}
