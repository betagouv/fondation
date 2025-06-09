import { FolderNumberTsvNormalizer } from 'src/data-administration-context/transparence-xlsx/business-logic/models/tsv-normalizers/folder-number-tsv-normalizer';
import { RankTsvNormalizer } from 'src/data-administration-context/transparence-xlsx/business-logic/models/tsv-normalizers/rank-tsv-normalizer';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { AvancementNormalizer } from '../../../lodam/business-logic/models/valeur-csv-normalizers/avancement-normalizer';
import {
  NominationFileRead,
  nominationFileReadListSchema,
} from './nomination-file-read';
import { NominationFilesContentReadCollection } from './nomination-files-read-collection';
import { GradeTsvNormalizer } from './tsv-normalizers/grade-tsv-normalizer';
import { ObserversTsvNormalizer } from './tsv-normalizers/observers-tsv-normalizer';
import { PosteCibleTsvNormalizer } from './tsv-normalizers/poste-cible-tsv-normalizer';
import { ReportersTsvNormalizer } from './tsv-normalizers/reporters-tsv-normalizer';

export const GSHEET_CELL_LINE_BREAK_TOKEN = '<cell_line_break>';
export const GSHEET_BLOCK_LINE_BREAK_TOKEN = '<block_line_break>';
export const SEPARATOR_LINE_BREAK = '\n';

export class NominationFileContentReader {
  constructor(
    private readonly secondHeader: string[],
    private readonly content: string[][],
  ) {}

  read(): NominationFilesContentReadCollection {
    const contentRead = this.content.map((_, rowIndex) => {
      const observersValue = this.findValue('Observants', rowIndex, {
        optional: true,
      });
      const datePassageAuGrade = this.findValue('Passage au grade', rowIndex, {
        optional: true,
      });
      const datePriseDeFonctionPosteActuel = this.findValue(
        'Prise de fonction',
        rowIndex,
        {
          optional: true,
        },
      );

      const nominationFileRead: NominationFileRead = {
        rowNumber: rowIndex + 1,
        content: {
          numeroDeDossier: FolderNumberTsvNormalizer.normalize(
            this.findValue('N°', rowIndex)!,
            rowIndex,
          ),
          magistrat: this.findValue('Magistrat', rowIndex)!.split('\n')[0]!,
          posteCible: PosteCibleTsvNormalizer.normalize(
            this.findValue('Poste cible', rowIndex)!,
          ),
          dateDeNaissance: DateOnly.fromString(
            this.findValue('Date de naissance', rowIndex)!,
            'dd/M/yyyy',
            'fr',
          ).toJson(),
          posteActuel: this.findValue('Poste actuel', rowIndex)!,

          datePriseDeFonctionPosteActuel: datePriseDeFonctionPosteActuel
            ? DateOnly.fromString(
                datePriseDeFonctionPosteActuel,
                'dd/M/yyyy',
                'fr',
              ).toJson()
            : null,
          datePassageAuGrade:
            !datePassageAuGrade || datePassageAuGrade === 'NON DEFINI'
              ? null
              : DateOnly.fromString(datePassageAuGrade).toJson(),

          equivalenceOuAvancement: AvancementNormalizer.normalize(
            this.findValue('Eq./Av.', rowIndex)!,
          ),
          grade: GradeTsvNormalizer.normalize(
            this.findValue('Poste cible', rowIndex)!,
            this.findValue('Eq./Av.', rowIndex)!,
            rowIndex,
          ),
          observers: observersValue
            ? ObserversTsvNormalizer.normalize(observersValue)
            : null,
          reporters: ReportersTsvNormalizer.normalize(
            this.findValue('Rapporteur', rowIndex)!,
          ),
          informationCarriere: this.findValue(
            'Information carrière',
            rowIndex,
            { optional: true },
          ),
          historique: this.findValue('Historique', rowIndex, {
            optional: true,
          }),
          rank: RankTsvNormalizer.normalize(
            this.findValue('Magistrat', rowIndex)!,
          ),
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
