import { Global, Module } from '@nestjs/common';

import { ConfigModule } from './config';
import { DrizzleModule } from './drizzle';

@Global()
@Module({
  imports: [ConfigModule, DrizzleModule],
  exports: [ConfigModule, DrizzleModule],
})
export class FrameworkModule {}
