import { Global, Module } from '@nestjs/common';

import { ClockModule } from './clock';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';

@Global()
@Module({
  imports: [ConfigModule, DatabaseModule, ClockModule],
  exports: [ConfigModule, DatabaseModule, ClockModule],
})
export class FrameworkModule {}
