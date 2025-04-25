import {
  GdsTransparenceNominationFilesModifiedEvent,
  GdsTransparenceNominationFilesModifiedEventPayload,
  gdsTransparenceNominationFilesModifiedEventPayloadSchema,
} from './events/gds-transparence-nomination-files-modified.event';
import {
  NominationFileModel,
  NominationFileModelSnapshot,
} from './nomination-file';
import { UpdatedNominationFilesFields } from './nomination-files-read-collection';
import { Transparence } from './transparence';

export class NominationFilesUpdatedCollection {
  private _nominationFileModels: NominationFileModel[];

  constructor(
    nominationFileModelSnapshots: NominationFileModelSnapshot[],
    private readonly transparenceId: Transparence['name'],
  ) {
    this._nominationFileModels = nominationFileModelSnapshots.map(
      NominationFileModel.fromSnapshot,
    );
  }

  updateNominationFiles(updatedFields: UpdatedNominationFilesFields[]) {
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

    return this.toModelsWithEvent(updatedNominationFiles);
  }

  private toModelsWithEvent(
    updatedNominationFiles: {
      nominationFile: NominationFileModel;
      updatedField: UpdatedNominationFilesFields;
    }[],
  ): [
    NominationFileModel[],
    GdsTransparenceNominationFilesModifiedEvent | null,
  ] {
    if (updatedNominationFiles.length === 0) {
      return [[], null];
    }

    const payload: GdsTransparenceNominationFilesModifiedEventPayload = {
      transparenceId: this.transparenceId,
      nominationFiles: updatedNominationFiles.map(
        ({ nominationFile, updatedField }) => ({
          nominationFileId: nominationFile.id,
          content: updatedField.content,
        }),
      ),
    };
    gdsTransparenceNominationFilesModifiedEventPayloadSchema.parse(payload);

    const nominationFilesUpdatedEvent =
      GdsTransparenceNominationFilesModifiedEvent.create(payload);

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
