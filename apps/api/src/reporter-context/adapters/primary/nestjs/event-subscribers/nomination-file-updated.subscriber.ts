import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NominationFilesUpdatedEvent,
  NominationFilesUpdatedEventPayload,
} from 'src/data-administrator-context/business-logic/models/nomination-files-updated.event';
import { UpdateReportOnImportChangeUseCase } from 'src/reporter-context/business-logic/use-cases/report-update-on-import-change/update-report-on-import-change.use-case';
import typia from 'typia';

@Injectable()
export class NominationFileUpdatedSubscriber {
  constructor(
    private readonly updateReportOnImportChangeUseCase: UpdateReportOnImportChangeUseCase,
  ) {}

  @OnEvent(NominationFilesUpdatedEvent.name)
  async handleNominationFilesUpdatedEvent(
    payloadList: NominationFilesUpdatedEventPayload,
  ) {
    typia.assert(payloadList);

    for (const payload of payloadList) {
      await this.updateReportOnImportChangeUseCase.execute(
        payload.nominationFileId,
        {
          rules: payload.content.rules,
        },
      );
    }
  }
}
