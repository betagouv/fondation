import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SetReportIdUseCase } from 'src/data-administrator-context/business-logic/use-cases/report-id-set/set-report-id.use-case';
import {
  ReportCreatedEvent,
  ReportCreatedEventPayload,
} from 'src/reporter-context/business-logic/models/report-created.event';
import typia from 'typia';

@Injectable()
export class ReportCreatedSubscriber {
  constructor(private readonly setReportIdUseCase: SetReportIdUseCase) {}

  @OnEvent(ReportCreatedEvent.name)
  async handleReportCreatedEvent(payload: ReportCreatedEventPayload) {
    typia.assert<ReportCreatedEventPayload>(payload);

    await this.setReportIdUseCase.execute(
      payload.importedNominationFileId,
      payload.reportId,
    );
  }
}
