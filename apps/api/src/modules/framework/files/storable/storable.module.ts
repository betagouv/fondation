import { Module } from '@nestjs/common';

import { Clock } from 'src/modules/framework/clock';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';

import { DbStorage } from './db.storable';
import { S3Client } from './s3';
import { S3Storage } from './s3.storable';
import type { Storage } from './storable.types';

@Module({
  providers: [
    S3Client,
    S3Storage,
    {
      provide: DbStorage,
      inject: [Clock, S3Storage, Db, API_CONFIG_TOKEN],
      useFactory: (clock: Clock, storage: Storage, db: Db, config: ApiConfig) =>
        new DbStorage(clock, storage, db, config),
    },
  ],
})
export class StorableModule {}
