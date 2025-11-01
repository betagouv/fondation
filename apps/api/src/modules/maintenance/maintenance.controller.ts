import {
  BadRequestException,
  Controller,
  NotAcceptableException,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { MaintenanceAuthGuard } from './infrastructure/maintenance-auth.guard';
import { MaintenanceService } from './infrastructure/maintenance.service';

@UseGuards(MaintenanceAuthGuard)
@Controller('/internal/maintenance/v1')
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  /**
   * Ingest a XML file containing all "Juridiction" available in LOLFI.
   *
   * curl \
   *   --request POST \
   *   --header 'Content-Type: application/xml' \
   *   --header 'Authorization: Bearer {{ MAINTENANCE_API_KEY }}' \
   *   --data @juridictions.xml \
   *   $base_url/internal/maintenance/v1/jurisdictions
   */
  @Post('jurisdictions')
  ingestJurisdiction(
    @Req() req: RawBodyRequest<ExpressRequest>,
  ): Promise<{ updated: number }> {
    if (!req.is('text/xml') && !req.is('application/xml')) {
      throw new NotAcceptableException();
    }

    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException(`empty body`);
    }

    return this.maintenance.ingestXmlJurisdictions(rawBody);
  }
}
