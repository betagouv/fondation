import {
  NominationFilesUpdatedEvent,
  NominationFilesUpdatedEventPayload,
  nominationFilesUpdatedEventPayloadSchema,
} from './events/nomination-files-updated.event';
import {
  NominationFileModel,
  NominationFileModelSnapshot,
} from './nomination-file';
import { UpdatedNominationFilesFields } from './nomination-files-read-collection';

export class NominationFilesUpdatedCollection {
  private _nominationFileModels: NominationFileModel[];

  constructor(nominationFileModelSnapshots: NominationFileModelSnapshot[]) {
    this._nominationFileModels = nominationFileModelSnapshots.map(
      NominationFileModel.fromSnapshot,
    );
  }

  updateNominationFiles(
    updatedFields: UpdatedNominationFilesFields[],
    eventId: string,
    currentDate: Date,
  ) {
    const updatedNominationFiles = this.filterNominationFilesToUpdate(
      updatedFields,
    ).map((nominationFile) => {
      const matchedNominationFileFields = updatedFields.find(
        (nominationFileRead) =>
          nominationFileRead.rowNumber ===
          nominationFile.toSnapshot().rowNumber,
      );
      if (!matchedNominationFileFields)
        throw new Error('Nomination file not found');

      if (
        matchedNominationFileFields.content.folderNumber !== undefined &&
        matchedNominationFileFields.content.folderNumber !== null
      )
        nominationFile.updateFolderNumber(
          matchedNominationFileFields.content.folderNumber,
        );
      if (matchedNominationFileFields.content.observers)
        nominationFile.updateObservers(
          matchedNominationFileFields.content.observers,
        );
      if (matchedNominationFileFields.content.rules)
        nominationFile.updateRules(matchedNominationFileFields.content.rules);
      return { nominationFile, updatedField: matchedNominationFileFields };
    });

    return this.toModelsWithEvent(updatedNominationFiles, eventId, currentDate);
  }

  private toModelsWithEvent(
    updatedNominationFiles: {
      nominationFile: NominationFileModel;
      updatedField: UpdatedNominationFilesFields;
    }[],
    eventId: string,
    currentDate: Date,
  ): [NominationFileModel[], NominationFilesUpdatedEvent | null] {
    if (updatedNominationFiles.length === 0) {
      return [[], null];
    }

    const payload: NominationFilesUpdatedEventPayload =
      updatedNominationFiles.map(({ nominationFile, updatedField }) => {
        const { id } = nominationFile.toSnapshot();

        return {
          nominationFileId: id,
          content: updatedField.content,
        };
      });
    nominationFilesUpdatedEventPayloadSchema.parse(payload);

    const nominationFilesUpdatedEvent = new NominationFilesUpdatedEvent(
      eventId,
      payload,
      currentDate,
    );

    return [
      updatedNominationFiles.map((f) => f.nominationFile),
      nominationFilesUpdatedEvent,
    ];
  }

  private filterNominationFilesToUpdate(
    updatedFields: UpdatedNominationFilesFields[],
  ) {
    return this._nominationFileModels.filter((nominationFile) =>
      updatedFields.some(
        (nominationFileRead) =>
          nominationFileRead.rowNumber ===
          nominationFile.toSnapshot().rowNumber,
      ),
    );
  }
}
