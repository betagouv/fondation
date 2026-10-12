import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { OfficialReportsService } from '../../official-reports.service';
import { DocInvalidatedIntegrationEvent } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';

@Injectable()
export class OnOfficialReportInvalidatedEventHandler {
  constructor(private readonly officialReports: OfficialReportsService) {}

  @OnEvent(DocInvalidatedIntegrationEvent.name, { promisify: true })
  async handle(event: DocInvalidatedIntegrationEvent): Promise<void> {
    await this.officialReports.internalInvalidateOfficialReport(event.cause);
  }
}
