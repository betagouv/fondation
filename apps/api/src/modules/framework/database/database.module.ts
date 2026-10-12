import { ClsPluginTransactional, TransactionHost } from '@nestjs-cls/transactional';
import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { Pool } from 'pg';

import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import * as time from 'src/utils/time';

import { TransactionalAdapterPrismaWithAfterCommit } from './after-commit';
import { PG_POOL_TOKEN } from './database.constants';
import { Db } from './db';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      plugins: [
        new ClsPluginTransactional({
          adapter: new TransactionalAdapterPrismaWithAfterCommit({
            prismaInjectionToken: PrismaService,
            defaultTxOptions: { maxWait: 5 * time.SECONDS, timeout: 20 * time.SECONDS },
          }),
        }),
      ],
    }),
  ],
  exports: [PrismaService, Db],
  providers: [
    {
      provide: PG_POOL_TOKEN,
      inject: [API_CONFIG_TOKEN],
      useFactory: (config: ApiConfig) => new Pool({ connectionString: config.databaseUrl }),
    },
    PrismaService,
    { provide: Db, useExisting: TransactionHost },
  ],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL_TOKEN) private readonly pool: Pool) {}

  onApplicationShutdown(): Promise<void> {
    return this.pool.end();
  }
}
