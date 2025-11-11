import { Module } from '@nestjs/common';

import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';

import { DrizzleService, getDrizzleInstance } from '../drizzle/drizzle';
import { PG_POOL_TOKEN } from './database.constants';
import { Pool } from 'pg';
import { PrismaService } from './prisma.service';

@Module({
  exports: [DrizzleService, PrismaService],
  providers: [
    {
      provide: PG_POOL_TOKEN,
      inject: [API_CONFIG_TOKEN],
      useFactory: (config: ApiConfig) => new Pool(config.database),
    },
    {
      provide: DrizzleService,
      inject: [PG_POOL_TOKEN],
      useFactory: (client: Pool) => getDrizzleInstance(client),
    },
    PrismaService,
  ],
})
export class DatabaseModule {}
