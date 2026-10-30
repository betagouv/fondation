import { Global, Module } from '@nestjs/common';

import { AppVersionModule } from './app-version';
import { ClockModule } from './clock';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { ExceptionModule } from './exception';
import { FaviconModule } from './favicon';
import { FilesModule } from './files';
import { HealthModule } from './health';
import { HttpModule } from './http';
import { ObservabilityModule } from './observability';
import { PdfModule } from './pdf';
import { SecurityHeadersModule } from './security-headers';
import { TchapModule } from './tchap';

@Global()
@Module({
  imports: [
    AppVersionModule,
    ClockModule,
    ConfigModule,
    DatabaseModule,
    ExceptionModule,
    FilesModule,
    HealthModule.register(),
    HttpModule.register(),
    ObservabilityModule,
    PdfModule,
    SecurityHeadersModule,
    TchapModule,
    FaviconModule,
  ],
  exports: [
    ClockModule,
    ConfigModule,
    DatabaseModule,
    FilesModule,
    HttpModule,
    ObservabilityModule,
    PdfModule,
    TchapModule,
  ],
})
export class FrameworkModule {}
