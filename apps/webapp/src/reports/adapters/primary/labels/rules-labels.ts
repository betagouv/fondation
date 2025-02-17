import { AllRulesMap, NominationFile } from "shared-models";
import { NonEmptyTuple } from "type-fest";

export type RulesLabelsMap<RulesMap extends AllRulesMap = AllRulesMap> = {
  [ruleGroup in NominationFile.RuleGroup]: NonEmptyTuple<
    RulesMap[ruleGroup]
  > extends readonly [RulesMap[ruleGroup], ...RulesMap[ruleGroup][]]
    ? {
        [key in RulesMap[ruleGroup][number]]: { label: string; hint: string };
      }
    : undefined;
};

export const allRulesLabelsMap: RulesLabelsMap = {
  [NominationFile.RuleGroup.MANAGEMENT]: {
    [NominationFile.ManagementRule.CASSATION_COURT_NOMINATION]: {
      label: "Nomination à la cour de cassation",
      hint: "",
    },
    [NominationFile.ManagementRule.GETTING_FIRST_GRADE]: {
      label: "Passer au 1er grade",
      hint: "",
    },
    [NominationFile.ManagementRule.TRANSFER_TIME]: {
      label: "Obtenir une mutation en moins de 3 ans",
      hint: "",
    },
    [NominationFile.ManagementRule.GETTING_GRADE_HH]: {
      label: "Passer au grade HH",
      hint: "",
    },
    [NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE]: {
      label: "Prendre son grade sur place",
      hint: "",
    },
    [NominationFile.ManagementRule.PROFILED_POSITION]: {
      label: 'Poste "profilé"',
      hint: "",
    },
    [NominationFile.ManagementRule.OVERSEAS_TO_OVERSEAS]: {
      label: 'Être muté "d\'Outremer sur Outremer"',
      hint: "",
    },
    [NominationFile.ManagementRule
      .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE]: {
      label:
        "Passer du siège au parquet tout en passant d'un TJ à une CA (ou l'inverse)",
      hint: "",
    },
    [NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT]: {
      label:
        "Passer du siège au parquet (ou l'inverse) au sein d'un même ressort",
      hint: "",
    },
  },
  [NominationFile.RuleGroup.STATUTORY]: {
    [NominationFile.StatutoryRule.JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION]: {
      label: "Changement de juridiction",
      hint: "",
    },
    [NominationFile.StatutoryRule.GRADE_ON_SITE_AFTER_7_YEARS]: {
      label: "Prendre son grade sur place après 7 ans",
      hint: "",
    },
    [NominationFile.StatutoryRule.MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS]: {
      label: "Changement de ministère en moins de 3 ans",
      hint: "",
    },
    [NominationFile.StatutoryRule.MINISTER_CABINET]: {
      label: "Cabinet du ministre",
      hint: "",
    },
    [NominationFile.StatutoryRule.GRADE_REGISTRATION]: {
      label: "Inscription au tableau pour prise de grade",
      hint: "",
    },
    [NominationFile.StatutoryRule.HH_WITHOUT_2_FIRST_GRADE_POSITIONS]: {
      label: "Accéder à la HH sans avoir fait 2 postes au 1er grade",
      hint: "",
    },
    [NominationFile.StatutoryRule
      .LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO]: {
      label: "Profession juridique dans le ressort du TJ il y a moins de 5 ans",
      hint: "",
    },
  },
  [NominationFile.RuleGroup.QUALITATIVE]: {
    [NominationFile.QualitativeRule.CONFLICT_OF_INTEREST_PRE_MAGISTRATURE]: {
      label: "Conflit d'intérêt pré magistrature",
      hint: "",
    },
    [NominationFile.QualitativeRule
      .CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION]: {
      label: "Conflit d'intérêt avec profession parente",
      hint: "",
    },
    [NominationFile.QualitativeRule.EVALUATIONS]: {
      label: "Évaluations",
      hint: "",
    },
    [NominationFile.QualitativeRule.DISCIPLINARY_ELEMENTS]: {
      label: "Éléments disciplinaires",
      hint: "",
    },
    [NominationFile.QualitativeRule.HH_NOMINATION_CONDITIONS]: {
      label: "Conditions de nomination HH",
      hint: "",
    },
  },
};
