import { FolderNumberTsvNormalizer } from 'src/data-administration-context/transparence-xlsx/business-logic/models/tsv-normalizers/folder-number-tsv-normalizer';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import {
  NominationFileRead,
  nominationFileReadListSchema,
} from './nomination-file-read';
import { NominationFilesContentReadCollection } from './nomination-files-read-collection';
import { GradeTsvNormalizer } from './tsv-normalizers/grade-tsv-normalizer';
import { ObserversTsvNormalizer } from './tsv-normalizers/observers-tsv-normalizer';
import { ReportersTsvNormalizer } from './tsv-normalizers/reporters-tsv-normalizer';
import { AvancementNormalizer } from '../../../lodam/business-logic/models/valeur-csv-normalizers/avancement-normalizer';

export const GSHEET_CELL_LINE_BREAK_TOKEN = '<cell_line_break>';
export const GSHEET_BLOCK_LINE_BREAK_TOKEN = '<block_line_break>';

export class NominationFileContentReader {
  constructor(
    private readonly secondHeader: string[],
    private readonly content: string[],
  ) {}

  read(): NominationFilesContentReadCollection {
    const contentRead = this.content.map((row, rowIndex) => {
      const reporter1Value = this.findValue('Rapporteur 1', rowIndex);
      const observersValue = this.findValue('Observants', rowIndex);

      const nominationFileRead: NominationFileRead = {
        rowNumber: rowIndex + 1,
        content: {
          numeroDeDossier: FolderNumberTsvNormalizer.normalize(
            this.findValue('N° dossier', rowIndex)!,
            rowIndex,
          ),
          magistrat: this.findValue('Magistrat', rowIndex)!,
          posteCible: this.findValue('Poste cible', rowIndex)!,
          dateDeNaissance: DateOnly.fromString(
            this.findValue('Date de naissance', rowIndex)!,
            'dd/M/yyyy',
            'fr',
          ).toJson(),
          posteActuel: this.findValue('Poste actuel', rowIndex)!,
          priseDeFonction: DateOnly.fromString(
            this.findValue('Prise de fonction', rowIndex)!,
            'dd/M/yyyy',
            'fr',
          ).toJson(),
          equivalenceOuAvancement: AvancementNormalizer.normalize(
            this.findValue('Eq./Av.', rowIndex)!,
          ),
          datePassageAuGrade: DateOnly.fromString(
            this.findValue('Passage au grade', rowIndex)!,
            'dd/M/yyyy',
            'fr',
          ).toJson(),
          grade: GradeTsvNormalizer.normalize(
            this.findValue('Poste cible', rowIndex)!,
            this.findValue('Eq./Av.', rowIndex)!,
            rowIndex,
          ),
          observers: observersValue
            ? ObserversTsvNormalizer.normalize(observersValue)
            : null,
          reporters: reporter1Value
            ? ReportersTsvNormalizer.normalize(
                reporter1Value,
                this.findValue('Rapporteur 2', rowIndex, { optional: true })!,
                this.findValue(
                  'Rapporteur 3 (note de synthèse pour le président de formation)',
                  rowIndex,
                  { optional: true },
                )!,
              )
            : null,
          informationCarriere: this.findValue(
            'Information carrière',
            rowIndex,
          )!,
          historique: this.findValue('Historique', rowIndex, {
            optional: true,
          }),
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
