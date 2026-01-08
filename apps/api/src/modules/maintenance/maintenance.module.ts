import { Module } from '@nestjs/common';
import { MaintenanceService } from './infrastructure/maintenance.service';
import { IngestXmlJurisdiction } from './infrastructure/ingest-xml-jurisdiction.use-case';
import { IngestXmlMagistrat } from './infrastructure/ingest-xml-magistrat.use-case';

@Module({
  providers: [MaintenanceService, IngestXmlJurisdiction, IngestXmlMagistrat],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
