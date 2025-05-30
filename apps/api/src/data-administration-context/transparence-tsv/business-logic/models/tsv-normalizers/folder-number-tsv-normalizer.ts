import { InvalidRowValueError } from '../../../../transparences/business-logic/errors/invalid-row-value.error';

export class FolderNumberTsvNormalizer {
  static normalize(folderNumber: string, rowIndex: number): number | null {
    const folderNumberMatch = folderNumber.match(/^(\d+)\s+\([^)]+\)$/);
    const profiledTextMatch = folderNumber.match(/^(profilé)\s+\([^)]+\)$/);

    const isValidFolderNumber = !!(
      folderNumberMatch?.length && !Number.isNaN(Number(folderNumberMatch[1]))
    );
    const isValidProfiledText = !!profiledTextMatch?.length;

    if (!isValidProfiledText && !isValidFolderNumber) {
      throw new InvalidRowValueError('folder number', folderNumber, rowIndex);
    }

    return isValidFolderNumber ? Number(folderNumberMatch[1]) : null;
  }
}
