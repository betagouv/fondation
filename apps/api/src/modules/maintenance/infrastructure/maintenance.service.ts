import { Injectable } from '@nestjs/common';
import { IngestXmlJurisdiction } from './ingest-xml-jurisdiction.use-case';
import { IngestXmlMagistrat } from './ingest-xml-magistrat.use-case';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly ingestXmlJurisdiction: IngestXmlJurisdiction,
    private readonly ingestXmlMagistrat: IngestXmlMagistrat,
  ) {}

  ingestXmlJurisdictions(buffer: Buffer): Promise<{ updated: number }> {
    return this.ingestXmlJurisdiction.execute(buffer);
  }

  ingestXmlMagistrats(buffer: Buffer): Promise<{ updated: number }> {
    return this.ingestXmlMagistrat.execute(buffer);
  }
}
