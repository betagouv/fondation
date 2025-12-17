import { Global, Module } from '@nestjs/common';

import { ClockModule } from './clock';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { FilesModule } from './files';
import { ObservabilityModule } from './observability';

@Global()
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ClockModule,
    ObservabilityModule,
    FilesModule,
  ],
  exports: [
    ConfigModule,
    DatabaseModule,
    ClockModule,
    ObservabilityModule,
    FilesModule,
  ],
})
export class FrameworkModule {}
