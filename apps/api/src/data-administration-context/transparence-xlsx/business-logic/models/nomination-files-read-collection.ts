import { diff } from 'json-diff';
import { Magistrat } from 'shared-models';
import {
  NominationFileModel,
  NominationFileModelSnapshot,
} from './nomination-file';
import {
  NominationFileRead,
  nominationFileReadContentSchema,
  nominationFileReadListSchema,
} from './nomination-file-read';

export type TransparenceCollection = {
  nomTransparence: string;
  formation: Magistrat.Formation;
  readCollection: NominationFilesContentReadCollection;
};

export class NominationFilesContentReadCollection {
  private readonly _nominationFileReadList: NominationFileRead[];

  constructor(nominationFileReadList: NominationFileRead[]) {
    this._nominationFileReadList = nominationFileReadListSchema.parse(
      nominationFileReadList,
    );
  }

  toModels(): NominationFileModel[] {
    return this._nominationFileReadList.map((content) =>
      NominationFileModel.create(content),
    );
  }

  hasNominationFiles() {
    return this._nominationFileReadList.length > 0;
  }

  hasRowNumber(rowNumber: number): boolean {
    return this._nominationFileReadList.some(
      (nominationFile) => nominationFile.rowNumber === rowNumber,
    );
  }

  newNominationFiles(existingNominationFiles: NominationFileModelSnapshot[]) {
    const adiff = diff(
      Object.fromEntries(
        existingNominationFiles.map((f) => [f.rowNumber, f.content]),
      ),
      Object.fromEntries(
        this._nominationFileReadList.map((f) => [f.rowNumber, f.content]),
      ),
      { keysOnly: true },
    );
    if (!adiff) return new NominationFilesContentReadCollection([]);

    const newNominationFiles = Object.entries(adiff)
      .filter((item) => item[0].endsWith('__added'))
      .map((item) => {
        const rowNumber = item[0].replace('__added', '');
        const content = item[1];
        return {
          rowNumber: parseInt(rowNumber),
          content: nominationFileReadContentSchema.parse(content),
        };
      });
    return new NominationFilesContentReadCollection(newNominationFiles);
  }

  contents(): NominationFileRead['content'][] {
    return [
      ...this._nominationFileReadList.map(
        (nominationFile) => nominationFile.content,
      ),
    ];
  }
}
