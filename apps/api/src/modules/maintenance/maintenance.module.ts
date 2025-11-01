import { Module } from '@nestjs/common';
import { MaintenanceService } from './infrastructure/maintenance.service';
import { IngestXmlJurisdiction } from './infrastructure/ingest-xml-jurisdiction.use-case';
import { MaintenanceController } from './maintenance.controller';

@Module({
  controllers: [MaintenanceController],
  providers: [MaintenanceService, IngestXmlJurisdiction],
})
export class MaintenanceModule {}
