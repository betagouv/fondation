import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import typia from 'typia';
import { InvalidRowValueError } from '../errors/invalid-row-value.error';
import { NominationFileRead } from './nomination-file-read';

export class NominationFileContentReader {
  constructor(
    private readonly secondHeader: string[],
    private readonly content: string[],
  ) {}

  read(): NominationFileRead[] {
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
                throw new InvalidRowValueError(rule, rowIndex);

              return {
                ...rulesAcc,
                [rule as NominationFile.RuleName]: row[index] === 'TRUE',
              };
            },
            {} as Record<NominationFile.RuleName, boolean>,
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
      const nominationFileRead: NominationFileRead = {
        rowNumber: rowIndex + 1,
        content: {
          dueDate: dueDate
            ? DateOnly.fromString(dueDate!, 'dd/M/yyyy', 'fr').toJson()
            : null,
          birthDate: DateOnly.fromString(
            this.findValue('Date de naissance', rowIndex)!,
            'dd/M/yyyy',
            'fr',
          ).toJson(),
          name: this.findValue('Magistrat', rowIndex)!,
          formation:
            this.findValue('Formation', rowIndex) === 'Parquet'
              ? Magistrat.Formation.PARQUET
              : Magistrat.Formation.SIEGE,
          state:
            this.findValue('Etat', rowIndex) === 'Nouveau'
              ? NominationFile.ReportState.NEW
              : NominationFile.ReportState.OPINION_RETURNED,
          transparency: this.normalizeTransparency(
            this.findValue('Transparence', rowIndex)!,
          ),
          reporters: reportersValue
            ? this.normalizeReporters(reportersValue)
            : null,
          grade: this.gradeToEnum(this.findValue('Grade actuel', rowIndex)!),
          currentPosition: this.findValue('Poste actuel', rowIndex)!,
          targettedPosition: this.findValue('Poste pressenti', rowIndex)!,
          rank: this.findValue('Rang', rowIndex)!,
          biography: this.findValue('Historique', rowIndex, { optional: true }),
          rules,
        },
      };

      return nominationFileRead;
    });

    const safeNominationFileRead =
      typia.assertEquals<NominationFileRead[]>(contentRead);

    return safeNominationFileRead;
  }

  private normalizeTransparency(transparency: string): Transparency {
    switch (transparency) {
      case 'Automne 2024':
        return Transparency.AUTOMNE_2024;
      case 'Mars 2025':
        return Transparency.MARCH_2025;
      case 'Mars 2026':
        return Transparency.MARCH_2026;
      default:
        throw new Error('Invalid transparency: ' + transparency);
    }
  }

  private normalizeReporters(reportersValue: string): string[] {
    return reportersValue.split('<cell_line_break>');
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

    if (options?.optional) return value ?? null;
    if (value === undefined)
      throw new Error(`Column ${column} not found in row ${rowIndex}`);
    return value;
  }

  private getRulesColumnsIndices() {
    return {
      [NominationFile.RuleGroup.MANAGEMENT]: {
        [NominationFile.ManagementRule.TRANSFER_TIME]:
          this.secondHeader.findIndex((col) =>
            col.includes('Mutation en - de 3 ans'),
          ),
        [NominationFile.ManagementRule.GETTING_FIRST_GRADE]:
          this.secondHeader.findIndex((col) =>
            col.includes('Passer au 1er grade'),
          ),
        [NominationFile.ManagementRule.GETTING_GRADE_HH]:
          this.secondHeader.findIndex((col) =>
            col.includes('Passe au grade "HH"'),
          ),
        [NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE]:
          this.secondHeader.findIndex((col) =>
            col.includes('Prendre son grade sur place'),
          ),
        [NominationFile.ManagementRule.PROFILED_POSITION]:
          this.secondHeader.findIndex((col) => col.includes('Poste "profilé"')),
        [NominationFile.ManagementRule.CASSATION_COURT_NOMINATION]:
          this.secondHeader.findIndex((col) =>
            col.includes('Nomination à la CC'),
          ),
        [NominationFile.ManagementRule.OVERSEAS_TO_OVERSEAS]:
          this.secondHeader.findIndex((col) =>
            col.includes('"Outremer sur Outremer"'),
          ),
        [NominationFile.ManagementRule
          .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE]:
          this.secondHeader.findIndex((col) =>
            col.includes('Siège <> Parquet et TJ <> CA'),
          ),
        [NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT]:
          this.secondHeader.findIndex((col) =>
            col.includes('Siège <> Parquet du même ressort'),
          ),
      },
      [NominationFile.RuleGroup.STATUTORY]: {
        [NominationFile.StatutoryRule
          .JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION]:
          this.secondHeader.findIndex((col) =>
            col.includes("Siège <> Parquet d'une même juridiction"),
          ),
        [NominationFile.StatutoryRule.GRADE_ON_SITE_AFTER_7_YEARS]:
          this.secondHeader.findIndex((col) =>
            col.includes('Prendre son grade sur place après 7 ans'),
          ),
        [NominationFile.StatutoryRule.MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS]:
          this.secondHeader.findIndex((col) =>
            col.includes("Ministère de la Justice à - de 3 ans d'exercice"),
          ),
        [NominationFile.StatutoryRule.MINISTER_CABINET]:
          this.secondHeader.findIndex((col) =>
            col.includes('Cabinet du ministre'),
          ),
        [NominationFile.StatutoryRule.GRADE_REGISTRATION]:
          this.secondHeader.findIndex((col) =>
            col.includes('Inscription au tableau pour prise de grade'),
          ),
        [NominationFile.StatutoryRule.HH_WITHOUT_2_FIRST_GRADE_POSITIONS]:
          this.secondHeader.findIndex((col) =>
            col.includes(
              'Accéder à la HH sans avoir fait 2 postes au 1er grade',
            ),
          ),
        [NominationFile.StatutoryRule
          .LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO]:
          this.secondHeader.findIndex((col) =>
            col.includes('Prof. jur. dans le ressort du TJ il y a - de 5 ans'),
          ),
      },
      [NominationFile.RuleGroup.QUALITATIVE]: {
        [NominationFile.QualitativeRule.CONFLICT_OF_INTEREST_PRE_MAGISTRATURE]:
          this.secondHeader.findIndex((col) =>
            col.includes("Conflit d'intérêt avec parcours pré magistrature"),
          ),
        [NominationFile.QualitativeRule
          .CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION]:
          this.secondHeader.findIndex((col) =>
            col.includes("Conflit d'intérêt avec la prof. d'un proche"),
          ),
        [NominationFile.QualitativeRule.EVALUATIONS]:
          this.secondHeader.findIndex((col) => col.includes('Evaluations')),
        [NominationFile.QualitativeRule.DISCIPLINARY_ELEMENTS]:
          this.secondHeader.findIndex((col) =>
            col.includes('Eléments disciplinaires'),
          ),
        [NominationFile.QualitativeRule.HH_NOMINATION_CONDITIONS]:
          this.secondHeader.findIndex((col) =>
            col.includes('Conditions de nomination HH'),
          ),
      },
    };
  }

  private gradeToEnum(grade: string): Magistrat.Grade {
    switch (grade) {
      case 'I':
        return Magistrat.Grade.I;
      case 'II':
        return Magistrat.Grade.II;
      case 'HH':
        return Magistrat.Grade.HH;
      default:
        throw new Error('Invalid grade: ' + grade);
    }
  }
}
