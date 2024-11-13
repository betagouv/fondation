import { NominationFile, Magistrat, Transparency } from "shared-models";

export type VMReportRuleValue = {
  id: string;
  label: string;
  checked: boolean;
  highlighted: boolean;
  comment: string | null;
};

export class ReportVM {
  static magistratIdentityLabels = {
    birthDate: "Date de naissance",
    grade: "Grade",
    currentPosition: "Poste actuel",
    targettedPosition: "Poste pressenti",
    rank: "Rang",
  };

  static commentLabel = "Commentaires généraux du rapporteur";
  static commentPlaceholder = "Pas de commentaire";

  static ruleGroupToLabel: {
    [NominationFile.RuleGroup.MANAGEMENT]: string;

    [NominationFile.RuleGroup.STATUTORY]: string;

    [NominationFile.RuleGroup.QUALITATIVE]: string;
  } = {
    [NominationFile.RuleGroup.MANAGEMENT]: "Règles de gestion",
    [NominationFile.RuleGroup.STATUTORY]: "Règles statutaires",
    [NominationFile.RuleGroup.QUALITATIVE]:
      "Les autres éléments qualitatifs à vérifier",
  };
  static rulesToLabels: {
    [NominationFile.RuleGroup.MANAGEMENT]: Record<
      NominationFile.ManagementRule,
      string
    >;
    [NominationFile.RuleGroup.STATUTORY]: Record<
      NominationFile.StatutoryRule,
      string
    >;
    [NominationFile.RuleGroup.QUALITATIVE]: Record<
      NominationFile.QualitativeRule,
      string
    >;
  } = {
    [NominationFile.RuleGroup.MANAGEMENT]: {
      TRANSFER_TIME: "Obtenir une mutation en moins de 3 ans",
      GETTING_FIRST_GRADE: "Passer au 1er grade",
      GETTING_GRADE_HH: "Passer au grade HH",
      GETTING_GRADE_IN_PLACE: "Prendre son grade sur place",
      PROFILED_POSITION: 'Poste "profilé"',
      CASSATION_COURT_NOMINATION: "Nomination à la cour de cassation",
      OVERSEAS_TO_OVERSEAS: 'Être muté "d\'Outremer sur Outremer"',
      JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE:
        "Passer du siège au parquet tout en passant d'un TJ à une CA (ou l'inverse)",
      JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT:
        "Passer du siège au parquet (ou l'inverse) au sein d'un même ressort",
    },
    [NominationFile.RuleGroup.STATUTORY]: {
      JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION: "Changement de juridiction",
      GRADE_ON_SITE_AFTER_7_YEARS: "Prendre son grade sur place après 7 ans",
      MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS:
        "Changement de ministère en moins de 3 ans",
      MINISTER_CABINET: "Cabinet du ministre",
      GRADE_REGISTRATION: "Inscription au tableau pour prise de grade",
      HH_WITHOUT_2_FIRST_GRADE_POSITIONS:
        "Accéder à la HH sans avoir fait 2 postes au 1er grade",
      LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO:
        "Profession juridique dans le ressort du TJ il y a moins de 5 ans",
    },
    [NominationFile.RuleGroup.QUALITATIVE]: {
      CONFLICT_OF_INTEREST_PRE_MAGISTRATURE:
        "Conflit d'intérêt pré magistrature",
      CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION:
        "Conflit d'intérêt avec profession parente",
      EVALUATIONS: "Évaluations",
      DISCIPLINARY_ELEMENTS: "Éléments disciplinaires",
      HH_NOMINATION_CONDITIONS: "Conditions de nomination HH",
    },
  };

  constructor(
    public id: string,
    public name: string,
    public biography: string | null,
    public dueDate: string | null,
    public birthDate: string,
    public state: NominationFile.ReportState,
    public formation: Magistrat.Formation,
    public transparency: Transparency,
    public grade: Magistrat.Grade,
    public currentPosition: string,
    public targettedPosition: string,
    public comment: string | null,
    public rank: string,
    public observers: [string, ...string[]][] | null,

    public rulesChecked: {
      [NominationFile.RuleGroup.MANAGEMENT]: Record<
        NominationFile.ManagementRule,
        VMReportRuleValue
      >;
      [NominationFile.RuleGroup.STATUTORY]: Record<
        NominationFile.StatutoryRule,
        VMReportRuleValue
      >;
      [NominationFile.RuleGroup.QUALITATIVE]: Record<
        NominationFile.QualitativeRule,
        VMReportRuleValue
      >;
    },
  ) {}
}
