import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NominationFilesImportedEvent,
  NominationFilesImportedEventPayload,
  nominationFilesImportedEventPayloadSchema,
} from 'src/data-administration-context/business-logic/models/events/nomination-file-imported.event';
import { CreateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-creation/create-report.use-case';

@Injectable()
export class NominationFileImportedSubscriber {
  constructor(private readonly createReportUseCase: CreateReportUseCase) {}

  @OnEvent(NominationFilesImportedEvent.name)
  async handleNominationFilesImportedEvent(
    payload: NominationFilesImportedEventPayload,
  ) {
    nominationFilesImportedEventPayloadSchema.parse(payload);

    const useCaseParams = payload
      .filter(({ content }) => content.reporters?.length)
      .map(({ nominationFileImportedId: id, content }) => {
        return (content.reporters || []).map((reporterName) => ({
          id,
          content,
          reporterName,
        }));
      })
      .flat();

    for (const { id, content, reporterName } of useCaseParams) {
      await this.createReportUseCase.execute(id, {
        folderNumber: content.folderNumber,
        name: content.name,
        reporterName,
        formation: content.formation,
        dueDate: content.dueDate,
        transparency: content.transparency,
        grade: content.grade,
        currentPosition: content.currentPosition,
        targettedPosition: content.targettedPosition,
        rank: content.rank,
        birthDate: content.birthDate,
        biography: content.biography,
        observers: content.observers,
        rules: content.rules,
      });
    }
  }
}
