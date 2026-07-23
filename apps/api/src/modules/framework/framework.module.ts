import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { ClockModule } from './clock';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { ExceptionModule } from './exception';
import { FilesModule } from './files';
import { ForwardsModule } from './forwards';
import { HealthModule } from './health';
import { HttpModule } from './http';
import { ObservabilityModule } from './observability';
import { PdfModule } from './pdf';

@Global()
@Module({
  imports: [
    ClockModule,
    ConfigModule,
    DatabaseModule,
    ExceptionModule,
    FilesModule,
    ForwardsModule,
    HealthModule.register(),
    HttpModule.register(),
    ObservabilityModule,
    PdfModule,
    EventEmitterModule.forRoot(),
  ],
  exports: [
    ClockModule,
    ConfigModule,
    DatabaseModule,
    FilesModule,
    HttpModule,
    ObservabilityModule,
    PdfModule,
  ],
})
export class FrameworkModule {}
