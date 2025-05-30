import { InvalidRowValueError } from '../../../../transparences/business-logic/errors/invalid-row-value.error';

export class FolderNumberTsvNormalizer {
  static normalize(folderNumber: string, rowIndex: number): number | null {
    if (Number.isNaN(Number(folderNumber))) {
      throw new InvalidRowValueError('folder number', folderNumber, rowIndex);
    }

    return Number(folderNumber);
  }
}
