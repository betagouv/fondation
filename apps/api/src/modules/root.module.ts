import { Module } from '@nestjs/common';

import { AdministrationModule } from './administration/administration.module';
import { ArchivedSessionsModule } from './archived-sessions/archived-sessions.module';
import { DocsModule } from './docs/docs.module';
import { FrameworkModule } from './framework/framework.module';
import { IngestModule } from './ingest/ingest.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { MembersModule } from './members';
import { ObservationModule } from './observation/observation.module';
import { ReportModule } from './report/report.module';
import { TransparenceModule } from './session/transparence/transparence.module';
import { SimpleAuthModule } from './simple-auth';

@Module({
  imports: [
    SimpleAuthModule,
    ReportModule,
    IngestModule,
    TransparenceModule,
    ArchivedSessionsModule,
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
