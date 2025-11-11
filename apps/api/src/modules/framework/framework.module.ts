import { Global, Module } from '@nestjs/common';

import { ConfigModule } from './config';
import { DatabaseModule } from './database';

@Global()
@Module({
  imports: [ConfigModule, DatabaseModule],
  exports: [ConfigModule, DatabaseModule],
})
export class FrameworkModule {}
