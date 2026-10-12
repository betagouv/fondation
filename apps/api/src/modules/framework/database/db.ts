import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

import { Prisma } from 'src/generated/prisma/client';

export class Db extends TransactionHost<TransactionalAdapterPrisma<Prisma.TransactionClient>> {}
