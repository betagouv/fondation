import { NominationFile } from 'shared-models';

export enum ManagementRule {
  TRANSFER_TIME = 'TRANSFER_TIME',
  GETTING_FIRST_GRADE = 'GETTING_FIRST_GRADE',
  GETTING_GRADE_HH = 'GETTING_GRADE_HH',
  GETTING_GRADE_IN_PLACE = 'GETTING_GRADE_IN_PLACE',
  PROFILED_POSITION = 'PROFILED_POSITION',
  CASSATION_COURT_NOMINATION = 'CASSATION_COURT_NOMINATION',
  OVERSEAS_TO_OVERSEAS = 'OVERSEAS_TO_OVERSEAS',
  JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE = 'JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE',
  JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT = 'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT',
}
export enum StatutoryRule {
  JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION = 'JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION',
  GRADE_ON_SITE_AFTER_7_YEARS = 'GRADE_ON_SITE_AFTER_7_YEARS',
  MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS = 'MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS',
  MINISTER_CABINET = 'MINISTER_CABINET',
  GRADE_REGISTRATION = 'GRADE_REGISTRATION',
  HH_WITHOUT_2_FIRST_GRADE_POSITIONS = 'HH_WITHOUT_2_FIRST_GRADE_POSITIONS',
  LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO = 'LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO',
}
export enum QualitativeRule {
  CONFLICT_OF_INTEREST_PRE_MAGISTRATURE = 'CONFLICT_OF_INTEREST_PRE_MAGISTRATURE',
  CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION = 'CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION',
  EVALUATIONS = 'EVALUATIONS',
  DISCIPLINARY_ELEMENTS = 'DISCIPLINARY_ELEMENTS',
  HH_NOMINATION_CONDITIONS = 'HH_NOMINATION_CONDITIONS',
}

export type RuleName = ManagementRule | StatutoryRule | QualitativeRule;

export const allRulesMapV1 = {
  [NominationFile.RuleGroup.MANAGEMENT]: Object.values(ManagementRule),
  [NominationFile.RuleGroup.STATUTORY]: Object.values(StatutoryRule),
  [NominationFile.RuleGroup.QUALITATIVE]: Object.values(QualitativeRule),
};
