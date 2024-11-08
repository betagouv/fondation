import { NominationFileModel } from './nomination-file';
import {
  NominationFilesImportedEvent,
  NominationFilesImportedEventPayload,
} from './events/nomination-file-imported.event';
import { NominationFileRead } from './nomination-file-read';

export class NominationFilesContentReadCollection {
  private readonly _nominationFileReadList: NominationFileRead[];

  constructor(nominationFileReadList: NominationFileRead[]) {
    this._nominationFileReadList = nominationFileReadList;
  }

  excludeExistingNominationFiles(
    existingNominationFiles: NominationFileModel[],
  ) {
    return new NominationFilesContentReadCollection(
      this._nominationFileReadList.filter(
        (nominationFileRead) =>
          !existingNominationFiles.some((nominationFile) =>
            nominationFile.hasSameRowNumberAs(nominationFileRead),
          ),
      ),
    );
  }

  toModelsWithEvent(
    generatedUuid: () => string,
    currentDate: Date,
  ): [NominationFileModel[], NominationFilesImportedEvent | null] {
    if (this._nominationFileReadList.length === 0) {
      return [[], null];
    }

    const nominationFiles = this._nominationFileReadList.map(
      (content) =>
        new NominationFileModel(generatedUuid(), currentDate, content),
    );

    const payload: NominationFilesImportedEventPayload = nominationFiles.map(
      (nominationFile) => {
        const { id, content } = nominationFile.toSnapshot();
        return {
          nominationFileImportedId: id,
          content,
        };
      },
    );

    const nominationFilesImportedEvent = new NominationFilesImportedEvent(
      generatedUuid(),
      payload,
      currentDate,
    );

    return [nominationFiles, nominationFilesImportedEvent];
  }

  getNominationFilesRead() {
    return this._nominationFileReadList;
  }
}
