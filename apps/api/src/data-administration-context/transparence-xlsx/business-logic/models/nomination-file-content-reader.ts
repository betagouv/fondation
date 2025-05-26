import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import {
  NominationFileRead,
  nominationFileReadListSchema,
} from './nomination-file-read';
import { NominationFilesContentReadCollection } from './nomination-files-read-collection';
import { FolderNumberTsvNormalizer } from './tsv-normalizers/folder-number-tsv-normalizer';
import { GradeTsvNormalizer } from './tsv-normalizers/grade-tsv-normalizer';
import { ObserversTsvNormalizer } from './tsv-normalizers/observers-tsv-normalizer';
import { ReportersTsvNormalizer } from './tsv-normalizers/reporters-tsv-normalizer';

export const GSHEET_CELL_LINE_BREAK_TOKEN = '<cell_line_break>';
export const GSHEET_BLOCK_LINE_BREAK_TOKEN = '<block_line_break>';

export class NominationFileContentReader {
  constructor(
    private readonly secondHeader: string[],
    private readonly content: string[],
  ) {}

  read(): NominationFilesContentReadCollection {
    const contentRead = this.content.map((row, rowIndex) => {
      const dueDate = this.findValue("Date d'échéance", rowIndex, {
        optional: true,
      });
      const reportersValue = this.findValue(
        'Rapporteur(s) (pré-traitement pour import)',
        rowIndex,
      );
      const observersValue = this.findValue(
        'Observants (pré-traitement pour import)',
        rowIndex,
      );

      const nominationFileRead: NominationFileRead = {
        rowNumber: rowIndex + 1,
        content: {
          folderNumber: FolderNumberTsvNormalizer.normalize(
            this.findValue('N° dossier', rowIndex)!,
            rowIndex,
          ),
          dueDate: dueDate
            ? DateOnly.fromString(dueDate, 'dd/M/yyyy', 'fr').toJson()
            : null,
          birthDate: DateOnly.fromString(
            this.findValue('Date de naissance', rowIndex)!,
            'dd/M/yyyy',
            'fr',
          ).toJson(),
          name: this.findValue('Magistrat', rowIndex)!,
          reporters: reportersValue
            ? ReportersTsvNormalizer.normalize(reportersValue)
            : null,
          grade: GradeTsvNormalizer.normalize(
            this.findValue('Grade actuel', rowIndex)!,
            rowIndex,
          ),
          currentPosition: this.findValue('Poste actuel', rowIndex)!,
          targettedPosition: this.findValue('Poste pressenti', rowIndex)!,
          rank: this.findValue('Rang', rowIndex)!,
          biography: this.findValue('Historique', rowIndex, { optional: true }),
          observers: observersValue
            ? ObserversTsvNormalizer.normalize(observersValue)
            : null,
        },
      };

      return nominationFileRead;
    });

    const safeNominationFileRead =
      nominationFileReadListSchema.parse(contentRead);

    return new NominationFilesContentReadCollection(safeNominationFileRead);
  }

  private findValue(
    column: string,
    rowIndex: number,
    options?: { optional: true },
  ): string | null {
    const columnIndex = this.secondHeader.findIndex((col) => col === column);
    const row = this.content[rowIndex];
    if (!row) throw new Error(`Row ${rowIndex} not found`);
    const value = row[columnIndex];

    if (options?.optional) return value || null;
    if (value === undefined)
      throw new Error(`Column ${column} not found in row ${rowIndex}`);
    return value;
  }
}
