import { NominationFile } from 'shared-models';
import * as schema from 'src/modules/framework/drizzle/schemas';
import { assertNever } from 'src/utils/assert-never';

export const reportStateEnum = schema.reportStateEnum;
export const ruleGroupEnum = schema.ruleGroupEnum;
export const ruleNameEnum = schema.ruleNameEnum;

type DrizzleRuleGroupEnum = (typeof schema.ruleGroupEnum)['enumValues'][number];
export function toRuleGroup(
  value: DrizzleRuleGroupEnum,
): NominationFile.RuleGroup {
  switch (value) {
    case 'management':
      return NominationFile.RuleGroup.MANAGEMENT;
    case 'qualitative':
      return NominationFile.RuleGroup.QUALITATIVE;
    case 'statutory':
      return NominationFile.RuleGroup.STATUTORY;
    default:
      return assertNever(value);
  }
}

type DrizzleReportStateEnum =
  (typeof schema.reportStateEnum)['enumValues'][number];
export function toReportState(
  value: DrizzleReportStateEnum,
): NominationFile.ReportState {
  switch (value) {
    case 'NEW':
      return NominationFile.ReportState.NEW;
    case 'IN_PROGRESS':
      return NominationFile.ReportState.IN_PROGRESS;
    case 'READY_TO_SUPPORT':
      return NominationFile.ReportState.READY_TO_SUPPORT;
    case 'SUPPORTED':
      return NominationFile.ReportState.SUPPORTED;
    default:
      return assertNever(value);
  }
}

type DrizzleRuleNameEnum = (typeof schema.ruleNameEnum)['enumValues'][number];
export function toRuleName(
  value: DrizzleRuleNameEnum,
): NominationFile.RuleName {
  switch (value) {
    case 'TRANSFER_TIME':
      return NominationFile.ManagementRule.TRANSFER_TIME;
    case 'GETTING_GRADE_IN_PLACE':
      return NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE;
    case 'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT':
      return NominationFile.ManagementRule
        .JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT;

    case 'JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION':
      return NominationFile.StatutoryRule
        .JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION;
    case 'GRADE_ON_SITE_AFTER_7_YEARS':
      return NominationFile.StatutoryRule.GRADE_ON_SITE_AFTER_7_YEARS;
    case 'MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS':
      return NominationFile.StatutoryRule
        .MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS;
    case 'MINISTER_CABINET':
      return NominationFile.StatutoryRule.MINISTER_CABINET;
    case 'GRADE_REGISTRATION':
      return NominationFile.StatutoryRule.GRADE_REGISTRATION;
    case 'HH_WITHOUT_2_FIRST_GRADE_POSITIONS':
      return NominationFile.StatutoryRule.HH_WITHOUT_2_FIRST_GRADE_POSITIONS;
    case 'LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO':
      return NominationFile.StatutoryRule
        .LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO;
    case 'RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS':
      return NominationFile.StatutoryRule
        .RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS;
    case 'NOMINATION_CA_AVANT_4_ANS':
      return NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS;

    case 'CONFLICT_OF_INTEREST_PRE_MAGISTRATURE':
      return NominationFile.QualitativeRule
        .CONFLICT_OF_INTEREST_PRE_MAGISTRATURE;
    case 'CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION':
      return NominationFile.QualitativeRule
        .CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION;
    case 'EVALUATIONS':
      return NominationFile.QualitativeRule.EVALUATIONS;
    case 'DISCIPLINARY_ELEMENTS':
      return NominationFile.QualitativeRule.DISCIPLINARY_ELEMENTS;

    default:
      return assertNever(value);
  }
}
