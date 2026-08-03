import { Module } from '@nestjs/common';

import { Clock } from 'src/modules/framework/clock';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';

import { DbStorage } from './db.storable';
import { Objects } from './objects.storable';
import { S3Client } from './s3';
import { S3Storage } from './s3.storable';
import { Storage } from './storable.types';

/**
 * module intended to replace {@link Files} in the near future.
 * It handles the orchestration between the db and S3
 * in a more maintainable and testable way. In addition,
 * it will allow different storages (other than S3 - e.g. Transfert Pro)
 */
@Module({
  providers: [
    S3Client,
    S3Storage,
    {
      provide: Storage,
      inject: [Clock, S3Storage, Db, API_CONFIG_TOKEN],
      useFactory: (clock: Clock, storage: Storage, db: Db, config: ApiConfig) =>
        new DbStorage(clock, storage, db, config),
    },
    Objects,
  ],
  exports: [Objects],
})
export class StorableModule {}
