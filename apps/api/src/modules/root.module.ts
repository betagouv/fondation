import { Module } from '@nestjs/common';

import { FrameworkModule } from './framework/framework.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { MembersModule } from './members/members.module';
import { ReportModule } from './report/report.module';
import { SessionModule } from './session/session.module';
import { SimpleAuthModule } from './simple-auth';

@Module({
  imports: [
    SimpleAuthModule,
    SessionModule,
    MembersModule,
    MaintenanceModule,
    ReportModule,
  ],
})
class FondationModule {}

@Module({ imports: [FrameworkModule, FondationModule] })
export class RootModule {}
