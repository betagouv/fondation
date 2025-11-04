import { Injectable } from '@nestjs/common';
import { IngestXmlJurisdiction } from './ingest-xml-jurisdiction.use-case';

@Injectable()
export class MaintenanceService {
  constructor(private readonly ingestXmlJurisdiction: IngestXmlJurisdiction) {}

  ingestXmlJurisdictions(buffer: Buffer): Promise<{ updated: number }> {
    return this.ingestXmlJurisdiction.execute(buffer);
  }
}
