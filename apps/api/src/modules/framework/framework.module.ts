import { Global, Module } from '@nestjs/common';

import { ClockModule } from './clock';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { ExceptionModule } from './exception';
import { FilesModule } from './files';
import { ForwardsModule } from './forwards';
import { HealthModule } from './health';
import { HttpModule } from './http';
import { MattermostModule } from './mattermost';
import { ObservabilityModule } from './observability';

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
  ],
  exports: [
    ClockModule,
    ConfigModule,
    DatabaseModule,
    FilesModule,
    HttpModule,
    MattermostModule,
    ObservabilityModule,
  ],
})
export class FrameworkModule {}
