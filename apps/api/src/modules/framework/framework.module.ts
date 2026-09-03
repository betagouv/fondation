import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { ClockModule } from './clock';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { ExceptionModule } from './exception';
import { FaviconModule } from './favicon';
import { FilesModule } from './files';
import { ForwardsModule } from './forwards';
import { HealthModule } from './health';
import { HttpModule } from './http';
import { MattermostModule } from './mattermost';
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
    MattermostModule,
    ObservabilityModule,
    PdfModule,
    EventEmitterModule.forRoot(),
    FaviconModule,
  ],
  exports: [
    ClockModule,
    ConfigModule,
    DatabaseModule,
    FilesModule,
    HttpModule,
    MattermostModule,
    ObservabilityModule,
    PdfModule,
  ],
})
export class FrameworkModule {}
