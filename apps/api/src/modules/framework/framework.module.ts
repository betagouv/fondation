import { Global, Module } from '@nestjs/common';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClockModule } from './clock';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { FilesModule } from './files';
import { HealthModule } from './health';
import { ObservabilityModule } from './observability';

@Global()
@Module({
  imports: [
    ClockModule,
    ConfigModule,
    DatabaseModule,
    FilesModule,
    HealthModule.register(),
    ObservabilityModule,
    EventEmitterModule.forRoot(),
  ],
  exports: [
    ClockModule,
    ConfigModule,
    DatabaseModule,
    FilesModule,
    ObservabilityModule,
  ],
})
export class FrameworkModule {}
