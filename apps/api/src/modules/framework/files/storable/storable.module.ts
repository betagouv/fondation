import { Module } from '@nestjs/common';

import { Clock } from 'src/modules/framework/clock';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { PrismaService } from 'src/modules/framework/database';

import { PrismaStorage } from './db.storable';
import { S3Client } from './s3';
import { S3Storage } from './s3.storable';
import type { Storage } from './storable.types';

@Module({
  providers: [
    S3Client,
    S3Storage,
    {
      provide: PrismaStorage,
      inject: [Clock, S3Storage, PrismaService, API_CONFIG_TOKEN],
      useFactory: (clock: Clock, storage: Storage, prisma: PrismaService, config: ApiConfig) =>
        new PrismaStorage(clock, storage, prisma, config),
    },
  ],
})
export class StorableModule {}
