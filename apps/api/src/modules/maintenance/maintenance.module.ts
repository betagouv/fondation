import { Module } from '@nestjs/common';
import { MaintenanceService } from './infrastructure/maintenance.service';
import { IngestXmlJurisdiction } from './infrastructure/ingest-xml-jurisdiction.use-case';

@Module({ providers: [MaintenanceService, IngestXmlJurisdiction] })
export class MaintenanceModule {}
