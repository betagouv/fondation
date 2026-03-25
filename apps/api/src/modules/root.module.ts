import { Module } from '@nestjs/common';

import { AdministrationModule } from './administration/administration.module';
import { DocsModule } from './docs/docs.module';
import { FrameworkModule } from './framework/framework.module';
import { IngestModule } from './ingest/ingest.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { MembersModule } from './members';
import { ObservationModule } from './observation/observation.module';
import { ReportModule } from './report/report.module';
import { SessionModule } from './session/session.module';
import { SimpleAuthModule } from './simple-auth';

@Module({
  imports: [
    SimpleAuthModule,
    ReportModule,
    IngestModule,
    SessionModule,
    MembersModule,
    MaintenanceModule,
    ObservationModule,
    AdministrationModule,
    DocsModule,
  ],
})
class FondationModule {}

@Module({ imports: [FrameworkModule, FondationModule] })
export class RootModule {}
