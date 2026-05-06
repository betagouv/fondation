import { loadConfig } from '.';
import { Module } from '@nestjs/common';

import { API_CONFIG_TOKEN } from './config.constants';

@Module({
  exports: [API_CONFIG_TOKEN],
  providers: [{ provide: API_CONFIG_TOKEN, useFactory: () => loadConfig() }],
})
export class ConfigModule {}
