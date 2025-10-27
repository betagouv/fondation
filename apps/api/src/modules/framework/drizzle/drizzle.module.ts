import { Module } from '@nestjs/common';

import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';

import { Db, getDrizzleInstance } from './drizzle';

@Module({
  exports: [Db],
  providers: [
    {
      provide: Db,
      inject: [API_CONFIG_TOKEN],
      useFactory: (config: ApiConfig) => getDrizzleInstance(config.database),
    },
  ],
})
export class DrizzleModule {}
