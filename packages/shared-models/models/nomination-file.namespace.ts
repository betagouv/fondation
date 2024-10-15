export namespace NominationFile {
  export enum ReportState {
    NEW = 'NEW',
    IN_PROGRESS = 'IN_PROGRESS',
    READY_TO_SUPPORT = 'READY_TO_SUPPORT',
    OPINION_RETURNED = 'OPINION_RETURNED',
  }

  export enum RuleGroup {
    MANAGEMENT = "management",
    STATUTORY = "statutory",
    QUALITATIVE = "qualitative",
  }
  export enum ManagementRule {
    TRANSFER_TIME = "TRANSFER_TIME",
    GETTING_FIRST_GRADE = "GETTING_FIRST_GRADE",
    GETTING_GRADE_HH = "GETTING_GRADE_HH",
    GETTING_GRADE_IN_PLACE = "GETTING_GRADE_IN_PLACE",
    PROFILED_POSITION = "PROFILED_POSITION",
    CASSATION_COURT_NOMINATION = "CASSATION_COURT_NOMINATION",
    OVERSEAS_TO_OVERSEAS = "OVERSEAS_TO_OVERSEAS",
    JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE = "JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE",
    JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT = "JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT",
  }

  export type RuleName = keyof typeof ManagementRule;

  export type RuleValue = {
    id: string;
    preValidated: boolean;
    validated: boolean;
    comment: string | null;
  };

  export type Rules = {
    [RuleGroup.MANAGEMENT]: {
      [key in ManagementRule]: RuleValue;
    };
    [RuleGroup.STATUTORY]: {
      [key: string]: RuleValue;
    };
    [RuleGroup.QUALITATIVE]: {
      [key: string]: RuleValue;
    };
  };
}
