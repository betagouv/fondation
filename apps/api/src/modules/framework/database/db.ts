import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

import { PrismaService } from './prisma.service';

export class Db extends TransactionHost<TransactionalAdapterPrisma<PrismaService>> {}
