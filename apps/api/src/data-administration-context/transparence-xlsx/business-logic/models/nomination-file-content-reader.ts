import { FolderNumberTsvNormalizer } from 'src/data-administration-context/transparence-xlsx/business-logic/models/tsv-normalizers/folder-number-tsv-normalizer';
import { RankTsvNormalizer } from 'src/data-administration-context/transparence-xlsx/business-logic/models/tsv-normalizers/rank-tsv-normalizer';
import { InvalidRowValueError } from 'src/data-administration-context/transparences/business-logic/errors/invalid-row-value.error';
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
import { BadRequestException } from '@nestjs/common';

export class NominationFileContentReader {
  constructor(
    private readonly secondHeader: string[],
    private readonly content: string[][],
  ) {}

  read(): NominationFilesContentReadCollection {
    const contentRead = this.content.reduce(
      (result, _, rowIndex) => {
        try {
          const observersValue = this.findValue('Observants', rowIndex, {
            optional: true,
          });
          const datePassageAuGrade = this.findValue(
            'Passage au grade',
            rowIndex,
            {
              optional: true,
            },
          );
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

          if (result.success) {
            result.values.push(nominationFileRead);
          }

          return result;
        } catch (e) {
          if (result.success) {
            result = { success: false, values: result.values, errors: [] };
          }

          result.errors.push({
            line: rowIndex + 1,
            message: e.message as string,
          });
          return result;
        }
      },
      { success: true, values: [] as NominationFileRead[] } as
        | { success: true; values: NominationFileRead[] }
        | {
            success: false;
            values: NominationFileRead[];
            errors: { line: number; message: string }[];
          },
    );

    if (!contentRead.success) {
      throw new BadRequestException({
        validationErrors: contentRead.errors.map(
          (error) => `ligne ${error.line}: ${error.message}`,
        ),
      });
    }

    const safeNominationFileRead = nominationFileReadListSchema.parse(
      contentRead.values,
    );

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
      throw new InvalidRowValueError(column, value, rowIndex);
    return value;
  }
}
