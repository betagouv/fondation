import { Module } from '@nestjs/common';
import { FrameworkModule } from './framework/framework.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { SessionModule } from './session/session.module';
import { SimpleAuthModule } from './simple-auth';
import { MembersModule } from './members/members.module';

@Module({
  imports: [SimpleAuthModule, SessionModule, MembersModule, MaintenanceModule],
})
class FondationModule {}

@Module({ imports: [FrameworkModule, FondationModule] })
export class RootModule {}
