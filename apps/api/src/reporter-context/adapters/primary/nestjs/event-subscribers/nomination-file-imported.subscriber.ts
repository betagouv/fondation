import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NominationFilesImportedEvent,
  NominationFilesImportedEventPayload,
} from 'src/data-administrator-context/business-logic/models/nomination-file-imported.event';
import { CreateReportUseCase } from 'src/reporter-context/business-logic/use-cases/report-creation/create-report.use-case';
import typia from 'typia';

@Injectable()
export class NominationFileImportedSubscriber {
  constructor(private readonly createReportUseCase: CreateReportUseCase) {}

  @OnEvent(NominationFilesImportedEvent.name)
  async handleNominationFilesImportedEvent(
    payload: NominationFilesImportedEventPayload,
  ) {
    typia.assert<NominationFilesImportedEventPayload>(payload);

    const promises = payload.contents.map((content) =>
      this.createReportUseCase.execute({
        reporterName: content.name,
        formation: content.formation,
        dueDate: content.dueDate,
        state: content.state,
        transparency: content.transparency,
        grade: content.grade,
        currentPosition: content.currentPosition,
        targettedPosition: content.targettedPosition,
        rank: content.rank,
        birthDate: content.birthDate,
        biography: content.biography,
        rules: content.rules,
      }),
    );

    await Promise.all(promises);
  }
}
