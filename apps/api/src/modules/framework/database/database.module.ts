import { ClsPluginTransactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { Pool } from 'pg';

import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';

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
          adapter: new TransactionalAdapterPrisma({ prismaInjectionToken: PrismaService }),
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
