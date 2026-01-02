import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';

import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';

import { PG_POOL_TOKEN } from './database.constants';
import { Pool } from 'pg';
import { PrismaService } from './prisma.service';

@Module({
  exports: [PrismaService],
  providers: [
    {
      provide: PG_POOL_TOKEN,
      inject: [API_CONFIG_TOKEN],
      useFactory: (config: ApiConfig) =>
        new Pool({ connectionString: config.databaseUrl }),
    },
    PrismaService,
  ],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL_TOKEN) private readonly pool: Pool) {}

  onApplicationShutdown(): Promise<void> {
    return this.pool.end();
  }
}
