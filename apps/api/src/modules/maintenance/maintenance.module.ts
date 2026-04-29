import { Module } from '@nestjs/common';
import { MaintenanceService } from './infrastructure/maintenance.service';

@Module({
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
