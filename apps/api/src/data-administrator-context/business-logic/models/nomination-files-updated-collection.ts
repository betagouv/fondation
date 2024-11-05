import typia from 'typia';
import { NominationFileModel } from './nomination-file';
import { NominationFileRead } from './nomination-file-read';
import {
  NominationFilesUpdatedEvent,
  NominationFilesUpdatedEventPayload,
} from './nomination-files-updated.event';

export class NominationFilesUpdatedCollection {
  private _nominationFileModels: NominationFileModel[];
  private _changedFieldsMap: Record<
    string,
    {
      rules: boolean;
    }
  > = {};

  constructor(nominationFileModels: NominationFileModel[]) {
    this._nominationFileModels = nominationFileModels;
  }

  updateNominationFiles(
    nominationFileReadList: NominationFileRead[],
    eventId: string,
    currentDate: Date,
  ) {
    const updatedNominationFiles = this.filterNominationFilesToUpdate(
      nominationFileReadList,
    ).map((nominationFile) => {
      const matchedNominationFileRead = nominationFileReadList.find(
        (nominationFileRead) =>
          nominationFile.hasSameRowNumberAs(nominationFileRead),
      );
      if (!matchedNominationFileRead) return nominationFile;

      nominationFile.updateContent(matchedNominationFileRead.content);
      return nominationFile;
    });
    return this.toModelsWithEvent(updatedNominationFiles, eventId, currentDate);
  }

  private toModelsWithEvent(
    updatedNominationFiles: NominationFileModel[],
    eventId: string,
    currentDate: Date,
  ): [NominationFileModel[], NominationFilesUpdatedEvent | null] {
    if (updatedNominationFiles.length === 0) {
      return [[], null];
    }

    const payload: NominationFilesUpdatedEventPayload =
      updatedNominationFiles.map((nominationFile) => {
        const { id, content } = nominationFile.toSnapshot();

        const changedFieldsMap = this._changedFieldsMap[id];
        return {
          nominationFileId: id,
          content: {
            ...(changedFieldsMap?.rules && {
              rules: content.rules,
            }),
          },
        };
      });
    typia.assertEquals(payload);

    const nominationFilesUpdatedEvent = new NominationFilesUpdatedEvent(
      eventId,
      payload,
      currentDate,
    );

    return [updatedNominationFiles, nominationFilesUpdatedEvent];
  }

  private filterNominationFilesToUpdate(
    nominationFileReadList: NominationFileRead[],
  ) {
    return this._nominationFileModels.filter((nominationFile) =>
      nominationFileReadList.some((nominationFileRead) => {
        const rulesChanged = !nominationFile.hasSameRulesAs(nominationFileRead);

        const nominationFileSnapshot = nominationFile.toSnapshot();
        this._changedFieldsMap[nominationFileSnapshot.id] = {
          rules: rulesChanged,
        };

        return (
          nominationFile.hasSameRowNumberAs(nominationFileRead) && rulesChanged
        );
      }),
    );
  }
}
