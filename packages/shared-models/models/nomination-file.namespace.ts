export namespace NominationFile {
  export enum ReportState {
    NEW = "NEW",
    IN_PROGRESS = "IN_PROGRESS",
    READY_TO_SUPPORT = "READY_TO_SUPPORT",
    SUPPORTED = "SUPPORTED",
  }

  export enum RuleGroup {
    MANAGEMENT = "management",
    STATUTORY = "statutory",
    QUALITATIVE = "qualitative",
  }

  export enum ManagementRule {
    TRANSFER_TIME = "TRANSFER_TIME",
    GETTING_GRADE_IN_PLACE = "GETTING_GRADE_IN_PLACE",
    JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT = "JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT",
  }
  export enum StatutoryRule {
    JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION = "JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION",
    GRADE_ON_SITE_AFTER_7_YEARS = "GRADE_ON_SITE_AFTER_7_YEARS",
    MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS = "MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS",
    MINISTER_CABINET = "MINISTER_CABINET",
    GRADE_REGISTRATION = "GRADE_REGISTRATION",
    HH_WITHOUT_2_FIRST_GRADE_POSITIONS = "HH_WITHOUT_2_FIRST_GRADE_POSITIONS",
    LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO = "LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO",
    RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS = "RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS",
  }
  export enum QualitativeRule {
    CONFLICT_OF_INTEREST_PRE_MAGISTRATURE = "CONFLICT_OF_INTEREST_PRE_MAGISTRATURE",
    CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION = "CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION",
    EVALUATIONS = "EVALUATIONS",
    DISCIPLINARY_ELEMENTS = "DISCIPLINARY_ELEMENTS",
  }

  export type RuleName = ManagementRule | StatutoryRule | QualitativeRule;

  export type RuleValue = {
    id: string;
    preValidated: boolean;
    validated: boolean;
  };

  export type Rules<
    T = RuleValue,
    M extends string = ManagementRule,
    S extends string = StatutoryRule,
    Q extends string = QualitativeRule,
  > = {
    [RuleGroup.MANAGEMENT]: {
      [key in M]: T;
    };
    [RuleGroup.STATUTORY]: {
      [key in S]: T;
    };
    [RuleGroup.QUALITATIVE]: {
      [key in Q]: T;
    };
  };
}
