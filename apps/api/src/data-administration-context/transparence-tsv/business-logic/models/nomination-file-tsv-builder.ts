import _ from 'lodash';
import { Magistrat, NominationFile, RulesBuilder } from 'shared-models';
import {
  DateOnly,
  gsheetDateFormat,
} from 'src/shared-kernel/business-logic/models/date-only';
import { Get, Paths } from 'type-fest';
import { NominationFileModelSnapshot } from './nomination-file';
import {
  GSHEET_BLOCK_LINE_BREAK_TOKEN,
  GSHEET_CELL_LINE_BREAK_TOKEN,
} from './nomination-file-content-reader';
import { NominationFileRead } from './nomination-file-read';
import { transparencyMap } from './tsv-normalizers/transparency-tsv-normalizer';
import {
  allRulesMapV1,
  ManagementRule,
  QualitativeRule,
  RuleName,
  StatutoryRule,
} from './rules';
import { Avancement } from '../../../lodam/business-logic/models/avancement';

export type Line = {
  folderNumber: number | null;
  name: string;
  formation: string;
  dueDate: string | null;
  transparency: string;
  reporters: string[] | null;
  passageAuGrade: string | null;
  datePriseDeFonctionPosteActuel: string | null;
  equivalenceOuAvancement: Avancement;
  informationCarriere: string | null;
  grade: string;
  currentPosition: string;
  targettedPosition: string;
  rank: string;
  birthDate: string;
  biography: string;
  observers: string[] | null;
  rules: {
    [NominationFile.RuleGroup.MANAGEMENT]: {
      [key in ManagementRule]: string;
    };
    [NominationFile.RuleGroup.STATUTORY]: {
      [key in StatutoryRule]: string;
    };
    [NominationFile.RuleGroup.QUALITATIVE]: {
      [key in QualitativeRule]: string;
    };
  };
};

const firstHeader = `									Eléments du dossier								Règles automatisées de gestion (pour débat) et statutaires (bloquantes)													Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier																														`;
const secondHeader = `Point(s) d'attention(s) repéré(s) dans le dossier	N° dossier                                                   	Magistrat	Formation	Date d'échéance	Transparence	Rapporteur(s) (pré-traitement pour import)	Rapporteur(s)	Grade actuel\tPrise de grade ?\tPassage au grade\tPrise de fonction\tInformation carrière	Poste actuel	Poste pressenti	Rang	Date de naissance	Historique	Observants (pré-traitement pour import)	Observants		Mutation en - de 3 ans	Passer au 1er grade	Passe au grade "HH"	Prendre son grade sur place	Poste "profilé"	Nomination à la CC	"Outremer sur Outremer"	Siège <> Parquet et TJ <> CA	Siège <> Parquet du même ressort	Siège <> Parquet d'une même juridiction	Prendre son grade sur place après 7 ans	Ministère de la Justice à - de 3 ans d'exercice		Cabinet du ministre	Inscription au tableau pour prise de grade	Accéder à la HH sans avoir fait 2 postes au 1er grade	Prof. jur. dans le ressort du TJ il y a - de 5 ans	Conflit d'intérêt avec parcours pré magistrature	Conflit d'intérêt avec la prof. d'un proche	Evaluations	Eléments disciplinaires	Conditions de nomination HH 		Point d'attention sur ce dossier ?	Grade actuel	Intitulé du poste actuel	Reformulation du poste actuel	Date de prise du poste actuel	Lieu d'exercice du poste actuel (nom de la juridiction)	Localisation du poste actuel (Métropole ou Outremer)	Cour d'appel de rattachement du poste actuel	Poste au Ministère ?	Grade du poste pressenti	Titre du poste pressenti	Poste profilé ?	Intitulé du poste pressenti	Reformulation du poste pressenti, sans le grade II	Reformulation du poste pressenti, sans les grades II et I	Reformulation du poste pressenti, sans les grades II, I et HH	Lieu d'exercice du poste pressenti (nom de la juridiction)	Localisation du poste pressenti (Métropole ou Outremer)	Cour d'appel de rattachement du poste pressenti	Date pour la prise de poste (si nomination confirmée)	Observations`;

export class NominationFileTsvBuilder {
  private _header = '';

  private _lines: Line[] = [];
  private _currentLine: Line | null = null;

  constructor() {
    this._header = `${firstHeader}\n${secondHeader}`;
  }

  with<K extends Paths<Line>, V extends Get<Line, K> = Get<Line, K>>(
    property: K,
    value: V,
  ) {
    if (!this._currentLine) throw new Error('No current line');
    this._currentLine = _.set(this._currentLine, property, value);
    return this;
  }

  withFormation(formation: string) {
    if (!this._currentLine) throw new Error('No current line');
    this._currentLine.formation = formation;
    return this;
  }

  withRuleTransferTime(validatedString: string) {
    if (!this._currentLine) throw new Error('No current line');

    this._currentLine['rules'][NominationFile.RuleGroup.MANAGEMENT][
      ManagementRule.TRANSFER_TIME
    ] = validatedString;

    return this;
  }

  withRuleMinisterCabinet(validatedString: string) {
    if (!this._currentLine) throw new Error('No current line');

    this._currentLine['rules'][NominationFile.RuleGroup.STATUTORY][
      StatutoryRule.MINISTER_CABINET
    ] = validatedString;

    return this;
  }

  get header() {
    return this._header;
  }

  private withNewLine() {
    if (this._currentLine) {
      this._lines.push(this._currentLine);
      this._currentLine = null;
    }
    return this;
  }

  private withLineContent(lineContent: Line) {
    this._currentLine = lineContent;
    return this;
  }

  private buildLine({
    folderNumber,
    name,
    formation,
    dueDate,
    transparency,
    reporters,
    datePriseDeFonctionPosteActuel,
    equivalenceOuAvancement,
    informationCarriere,
    passageAuGrade,
    grade,
    currentPosition,
    targettedPosition,
    rank,
    birthDate,
    biography,
    observers,
    rules,
  }: Line) {
    const firstGroupOfRuleValues = [
      rules[NominationFile.RuleGroup.MANAGEMENT][ManagementRule.TRANSFER_TIME],
      rules[NominationFile.RuleGroup.MANAGEMENT][
        ManagementRule.GETTING_FIRST_GRADE
      ],
      rules[NominationFile.RuleGroup.MANAGEMENT][
        ManagementRule.GETTING_GRADE_HH
      ],
      rules[NominationFile.RuleGroup.MANAGEMENT][
        ManagementRule.GETTING_GRADE_IN_PLACE
      ],
      rules[NominationFile.RuleGroup.MANAGEMENT][
        ManagementRule.PROFILED_POSITION
      ],
      rules[NominationFile.RuleGroup.MANAGEMENT][
        ManagementRule.CASSATION_COURT_NOMINATION
      ],
      rules[NominationFile.RuleGroup.MANAGEMENT][
        ManagementRule.OVERSEAS_TO_OVERSEAS
      ],
      rules[NominationFile.RuleGroup.MANAGEMENT][
        ManagementRule.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE
      ],
      rules[NominationFile.RuleGroup.MANAGEMENT][
        ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT
      ],

      rules[NominationFile.RuleGroup.STATUTORY][
        StatutoryRule.JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION
      ],
      rules[NominationFile.RuleGroup.STATUTORY][
        StatutoryRule.GRADE_ON_SITE_AFTER_7_YEARS
      ],
      rules[NominationFile.RuleGroup.STATUTORY][
        StatutoryRule.MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS
      ],
    ];

    const secondGroupOfRuleValues = [
      rules[NominationFile.RuleGroup.STATUTORY][StatutoryRule.MINISTER_CABINET],
      rules[NominationFile.RuleGroup.STATUTORY][
        StatutoryRule.GRADE_REGISTRATION
      ],
      rules[NominationFile.RuleGroup.STATUTORY][
        StatutoryRule.HH_WITHOUT_2_FIRST_GRADE_POSITIONS
      ],
      rules[NominationFile.RuleGroup.STATUTORY][
        StatutoryRule.LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO
      ],

      rules[NominationFile.RuleGroup.QUALITATIVE][
        QualitativeRule.CONFLICT_OF_INTEREST_PRE_MAGISTRATURE
      ],
      rules[NominationFile.RuleGroup.QUALITATIVE][
        QualitativeRule.CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION
      ],
      rules[NominationFile.RuleGroup.QUALITATIVE][QualitativeRule.EVALUATIONS],
      rules[NominationFile.RuleGroup.QUALITATIVE][
        QualitativeRule.DISCIPLINARY_ELEMENTS
      ],
      rules[NominationFile.RuleGroup.QUALITATIVE][
        QualitativeRule.HH_NOMINATION_CONDITIONS
      ],
    ];
    const rulesValues = [
      firstGroupOfRuleValues.join('\t'),
      secondGroupOfRuleValues.join('\t'),
    ].join('\t\t');

    const reportersForImport =
      reporters?.join(GSHEET_CELL_LINE_BREAK_TOKEN) || '';
    const reportersForDisplay = reporters?.join(' ') || '';

    const observersForImport =
      observers?.join(GSHEET_BLOCK_LINE_BREAK_TOKEN) || '';
    const observersForDisplay = observers?.join('     ') || '';

    const folderNumberString = `${folderNumber || 'profilé'} (${formation.trim()})`;
    return `TRUE\t${folderNumberString}\t${name}\t${formation}\t${dueDate || ''}\t${transparency}\t${reportersForImport}\t${reportersForDisplay}\t${grade}\t${equivalenceOuAvancement}\t${passageAuGrade ?? 'NON DEFINI'}\t${datePriseDeFonctionPosteActuel ?? ''}\t${informationCarriere ?? ''}\t${currentPosition}\t${targettedPosition}\t${rank}\t${birthDate}\t${biography}\t${observersForImport}\t${observersForDisplay}\t\t${rulesValues}\t\tTRUE\tI\tAvocat général - service extraordinaire CC  PARIS\tAvocat\tmars 2022\tPARIS\tMétropole\tCA PARIS\tFALSE\tHH\tPremier\tFALSE\tPremier avocat général CC  PARIS - HH\tPremier avocat général I  PARIS - HH\tPremier avocat général CC  PARIS - I\tPremier avocat général CC  PARIS\tPARIS\tMétropole\tCA PARIS\tseptembre 2024\t  MATHIAS PASCAL VPI TJ PARIS (9 sur une liste de 11)`;
  }

  build() {
    if (this._currentLine) this._lines.push(this._currentLine);
    return (
      this._header +
      '\n' +
      this._lines.map((line) => this.buildLine(line)).join('\n')
    );
  }

  fromModelSnapshot(nominationFileSnapshot: NominationFileModelSnapshot) {
    const content = nominationFileSnapshot.content;

    const gradeMap = {
      [Magistrat.Grade.I]: ' I',
      [Magistrat.Grade.II]: 'II',
      [Magistrat.Grade.HH]: 'HH',
    };

    const formationMap = {
      [Magistrat.Formation.PARQUET]: 'Parquet',
      [Magistrat.Formation.SIEGE]: 'Siège',
    };

    return this.withNewLine().withLineContent({
      folderNumber: content.folderNumber,
      name: content.name,
      formation: formationMap[content.formation],
      dueDate: content.dueDate
        ? DateOnly.fromJson(content.dueDate).toFormattedString(gsheetDateFormat)
        : null,
      datePriseDeFonctionPosteActuel: content.datePriseDeFonctionPosteActuel
        ? DateOnly.fromJson(
            content.datePriseDeFonctionPosteActuel,
          ).toFormattedString(gsheetDateFormat)
        : null,
      passageAuGrade: content.datePassageAuGrade
        ? DateOnly.fromJson(content.datePassageAuGrade).toFormattedString(
            gsheetDateFormat,
          )
        : null,
      equivalenceOuAvancement: content.avancement,
      informationCarriere: content.informationCarrière,
      transparency: transparencyMap[content.transparency],
      reporters: content.reporters,
      grade: gradeMap[content.grade],
      currentPosition: content.currentPosition,
      targettedPosition: content.targettedPosition,
      rank: content.rank,
      birthDate: DateOnly.fromJson(content.birthDate).toFormattedString(
        gsheetDateFormat,
      ),
      biography: content.biography ?? '',
      observers: content.observers,
      rules: NominationFileTsvRulesBuilder.fromRead(content.rules).build(),
    });
  }
}

class NominationFileTsvRulesBuilder extends RulesBuilder<
  string,
  ManagementRule,
  StatutoryRule,
  QualitativeRule
> {
  static fromRead(
    rules: NominationFileRead['content']['rules'],
  ): NominationFileTsvRulesBuilder {
    return new NominationFileTsvRulesBuilder(({ ruleGroup, ruleName }) => {
      const ruleValue = (rules[ruleGroup] as Record<RuleName, boolean>)[
        ruleName
      ];

      return ruleValue ? 'TRUE' : 'FALSE';
    }, allRulesMapV1);
  }
}
