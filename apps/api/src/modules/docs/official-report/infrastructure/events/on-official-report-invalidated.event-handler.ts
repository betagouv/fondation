import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { OfficialReportsService } from '../../official-reports.service';
import { OfficialReportsInvalidatedIntegrationEvent } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';

@Injectable()
export class OnOfficialReportInvalidatedEventHandler {
  constructor(private readonly officialReports: OfficialReportsService) {}

  @OnEvent(OfficialReportsInvalidatedIntegrationEvent.name, { promisify: true })
  async handle(event: OfficialReportsInvalidatedIntegrationEvent): Promise<void> {
    await this.officialReports.internalInvalidateOfficialReport(event.cause);
  }
}
