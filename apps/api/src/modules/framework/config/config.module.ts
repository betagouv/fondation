import { Module } from '@nestjs/common';

import { API_CONFIG_TOKEN } from './config.constants';
import { validateConfig } from './validate-config';

@Module({
  exports: [API_CONFIG_TOKEN],
  providers: [
    { provide: API_CONFIG_TOKEN, useFactory: () => validateConfig() },
  ],
})
export class ConfigModule {}
