import { Module } from '@nestjs/common';

import { API_CONFIG_TOKEN } from './config.constants';
import { ConfigSchema } from './config.schema';

@Module({
  exports: [API_CONFIG_TOKEN],
  providers: [
    {
      provide: API_CONFIG_TOKEN,
      useFactory: () => ConfigSchema.parseAsync({}),
    },
  ],
})
export class ConfigModule {}
