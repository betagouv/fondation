import { NominationFile } from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { InvalidRowValueError } from '../../../transparences/business-logic/errors/invalid-row-value.error';
import {
  NominationFileRead,
  nominationFileReadListSchema,
} from './nomination-file-read';
import { NominationFilesContentReadCollection } from './nomination-files-read-collection';
import {
  ManagementRule,
  QualitativeRule,
  RuleName,
  StatutoryRule,
} from './rules';
import { AvancementNormalizer } from '../../../lodam/business-logic/models/valeur-csv-normalizers/avancement-normalizer';
import { FolderNumberTsvNormalizer } from './tsv-normalizers/folder-number-tsv-normalizer';
import { FormationTsvNormalizer } from './tsv-normalizers/formation-tsv-normalizer';
import { GradeTsvNormalizer } from './tsv-normalizers/grade-tsv-normalizer';
import { ObserversTsvNormalizer } from './tsv-normalizers/observers-tsv-normalizer';
import { ReportersTsvNormalizer } from './tsv-normalizers/reporters-tsv-normalizer';
import { TransparencyTsvNormalizer } from './tsv-normalizers/transparency-tsv-normalizer';

export const GSHEET_CELL_LINE_BREAK_TOKEN = '<cell_line_break>';
export const GSHEET_BLOCK_LINE_BREAK_TOKEN = '<block_line_break>';

export class NominationFileContentReader {
  constructor(
    private readonly secondHeader: string[],
    private readonly content: string[],
  ) {}

  read(): NominationFilesContentReadCollection {
    const rulesColumnsIndices = this.getRulesColumnsIndices();

    const contentRead = this.content.map((row, rowIndex) => {
      const rules = Object.entries(rulesColumnsIndices).reduce(
        (acc, [group, rulesIndices]) => ({
          ...acc,
          [group as NominationFile.RuleGroup]: Object.entries(
            rulesIndices,
          ).reduce(
            (rulesAcc, [rule, index]) => {
              if (!['TRUE', 'FALSE'].includes(row[index]!))
                throw new InvalidRowValueError('rule', rule, rowIndex);

              return {
                ...rulesAcc,
                [rule as RuleName]: row[index] === 'TRUE',
              };
            },
            {} as Record<RuleName, boolean>,
          ),
        }),
        {} as NominationFileRead['content']['rules'],
      );

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
          formation: FormationTsvNormalizer.normalize(
            this.findValue('Formation', rowIndex)!,
            rowIndex,
          ),
          transparency: TransparencyTsvNormalizer.normalize(
            this.findValue('Transparence', rowIndex)!,
            rowIndex,
          ),
          reporters: reportersValue
            ? ReportersTsvNormalizer.normalize(reportersValue)
            : null,
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
          avancement: AvancementNormalizer.normalize(
            this.findValue('Prise de grade ?', rowIndex)!,
          ),
          grade: GradeTsvNormalizer.normalize(
            this.findValue('Grade actuel', rowIndex)!,
            rowIndex,
          ),
          informationCarrière: this.findValue(
            'Information carrière',
            rowIndex,
            { optional: true },
          )!,
          currentPosition: this.findValue('Poste actuel', rowIndex)!,
          targettedPosition: this.findValue('Poste pressenti', rowIndex)!,
          rank: this.findValue('Rang', rowIndex)!,
          biography: this.findValue('Historique', rowIndex, { optional: true }),
          observers: observersValue
            ? ObserversTsvNormalizer.normalize(observersValue)
            : null,
          rules,
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

  private getRulesColumnsIndices() {
    return {
      [NominationFile.RuleGroup.MANAGEMENT]: {
        [ManagementRule.TRANSFER_TIME]: this.secondHeader.findIndex((col) =>
          col.includes('Mutation en - de 3 ans'),
        ),
        [ManagementRule.GETTING_FIRST_GRADE]: this.secondHeader.findIndex(
          (col) => col.includes('Passer au 1er grade'),
        ),
        [ManagementRule.GETTING_GRADE_HH]: this.secondHeader.findIndex((col) =>
          col.includes('Passe au grade "HH"'),
        ),
        [ManagementRule.GETTING_GRADE_IN_PLACE]: this.secondHeader.findIndex(
          (col) => col.includes('Prendre son grade sur place'),
        ),
        [ManagementRule.PROFILED_POSITION]: this.secondHeader.findIndex((col) =>
          col.includes('Poste "profilé"'),
        ),
        [ManagementRule.CASSATION_COURT_NOMINATION]:
          this.secondHeader.findIndex((col) =>
            col.includes('Nomination à la CC'),
          ),
        [ManagementRule.OVERSEAS_TO_OVERSEAS]: this.secondHeader.findIndex(
          (col) => col.includes('"Outremer sur Outremer"'),
        ),
        [ManagementRule.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE]:
          this.secondHeader.findIndex((col) =>
            col.includes('Siège <> Parquet et TJ <> CA'),
          ),
        [ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT]:
          this.secondHeader.findIndex((col) =>
            col.includes('Siège <> Parquet du même ressort'),
          ),
      },
      [NominationFile.RuleGroup.STATUTORY]: {
        [StatutoryRule.JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION]:
          this.secondHeader.findIndex((col) =>
            col.includes("Siège <> Parquet d'une même juridiction"),
          ),
        [StatutoryRule.GRADE_ON_SITE_AFTER_7_YEARS]:
          this.secondHeader.findIndex((col) =>
            col.includes('Prendre son grade sur place après 7 ans'),
          ),
        [StatutoryRule.MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS]:
          this.secondHeader.findIndex((col) =>
            col.includes("Ministère de la Justice à - de 3 ans d'exercice"),
          ),
        [StatutoryRule.MINISTER_CABINET]: this.secondHeader.findIndex((col) =>
          col.includes('Cabinet du ministre'),
        ),
        [StatutoryRule.GRADE_REGISTRATION]: this.secondHeader.findIndex((col) =>
          col.includes('Inscription au tableau pour prise de grade'),
        ),
        [StatutoryRule.HH_WITHOUT_2_FIRST_GRADE_POSITIONS]:
          this.secondHeader.findIndex((col) =>
            col.includes(
              'Accéder à la HH sans avoir fait 2 postes au 1er grade',
            ),
          ),
        [StatutoryRule.LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO]:
          this.secondHeader.findIndex((col) =>
            col.includes('Prof. jur. dans le ressort du TJ il y a - de 5 ans'),
          ),
      },
      [NominationFile.RuleGroup.QUALITATIVE]: {
        [QualitativeRule.CONFLICT_OF_INTEREST_PRE_MAGISTRATURE]:
          this.secondHeader.findIndex((col) =>
            col.includes("Conflit d'intérêt avec parcours pré magistrature"),
          ),
        [QualitativeRule.CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION]:
          this.secondHeader.findIndex((col) =>
            col.includes("Conflit d'intérêt avec la prof. d'un proche"),
          ),
        [QualitativeRule.EVALUATIONS]: this.secondHeader.findIndex((col) =>
          col.includes('Evaluations'),
        ),
        [QualitativeRule.DISCIPLINARY_ELEMENTS]: this.secondHeader.findIndex(
          (col) => col.includes('Eléments disciplinaires'),
        ),
        [QualitativeRule.HH_NOMINATION_CONDITIONS]: this.secondHeader.findIndex(
          (col) => col.includes('Conditions de nomination HH'),
        ),
      },
    };
  }
}
