import { Module } from '@nestjs/common';

import { loadConfig } from '.';
import { API_CONFIG_TOKEN } from './config.constants';

@Module({
  exports: [API_CONFIG_TOKEN],
  providers: [{ provide: API_CONFIG_TOKEN, useFactory: () => loadConfig() }],
})
export class ConfigModule {}
