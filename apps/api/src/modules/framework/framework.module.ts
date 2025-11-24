import { Global, Module } from '@nestjs/common';

import { ClockModule } from './clock';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { FilesModule } from './files';

@Global()
@Module({
  imports: [ConfigModule, DatabaseModule, ClockModule, FilesModule.forRoot()],
  exports: [ConfigModule, DatabaseModule, ClockModule],
})
export class FrameworkModule {}
