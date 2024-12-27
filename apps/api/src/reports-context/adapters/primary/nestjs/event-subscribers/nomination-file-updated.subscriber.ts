import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NominationFilesUpdatedEvent,
  NominationFilesUpdatedEventPayload,
} from 'src/data-administration-context/business-logic/models/events/nomination-files-updated.event';
import { UpdateReportOnImportChangeUseCase } from 'src/reports-context/business-logic/use-cases/report-update-on-import-change/update-report-on-import-change.use-case';

@Injectable()
export class NominationFileUpdatedSubscriber {
  constructor(
    private readonly updateReportOnImportChangeUseCase: UpdateReportOnImportChangeUseCase,
  ) {}

  @OnEvent(NominationFilesUpdatedEvent.name)
  async handleNominationFilesUpdatedEvent(
    payloadList: NominationFilesUpdatedEventPayload,
  ) {
    for (const payload of payloadList) {
      await this.updateReportOnImportChangeUseCase.execute(
        payload.nominationFileId,
        {
          folderNumber: payload.content.folderNumber,
          observers: payload.content.observers || undefined,
          rules: payload.content.rules,
        },
      );
    }
  }
}
