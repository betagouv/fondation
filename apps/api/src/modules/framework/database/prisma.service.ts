import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { type Pool } from 'pg';

import { PrismaClient } from '../../../generated/prisma/client';
import { PG_POOL_TOKEN } from './database.constants';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnApplicationShutdown
{
  constructor(@Inject(PG_POOL_TOKEN) pool: Pool) {
    super({
      adapter: new PrismaPg(pool),
      // log: ['query', 'error', 'info', 'warn'],
    });
  }

  onApplicationShutdown(): Promise<void> {
    return this.$disconnect();
  }
}
