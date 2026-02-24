import { NominationFile } from './nomination-file.namespace';

export const allRulesTuple = [
  ...Object.values(NominationFile.ManagementRule).map(
    (rule) => [NominationFile.RuleGroup.MANAGEMENT, rule] as const,
  ),
  ...Object.values(NominationFile.StatutoryRule).map(
    (rule) => [NominationFile.RuleGroup.STATUTORY, rule] as const,
  ),
  ...Object.values(NominationFile.QualitativeRule).map(
    (rule) => [NominationFile.RuleGroup.QUALITATIVE, rule] as const,
  ),
];

export const allRulesMapV2 = {
  [NominationFile.RuleGroup.MANAGEMENT]: [
    NominationFile.ManagementRule.TRANSFER_TIME,
    NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE,
    NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
  ],
  [NominationFile.RuleGroup.STATUTORY]: [
    NominationFile.StatutoryRule.JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION,
    NominationFile.StatutoryRule.GRADE_ON_SITE_AFTER_7_YEARS,
    NominationFile.StatutoryRule.MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS,
    NominationFile.StatutoryRule.MINISTER_CABINET,
    NominationFile.StatutoryRule.GRADE_REGISTRATION,
    NominationFile.StatutoryRule.HH_WITHOUT_2_FIRST_GRADE_POSITIONS,
    NominationFile.StatutoryRule.LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO,
    NominationFile.StatutoryRule.RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS,
    NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS,
  ],
  [NominationFile.RuleGroup.QUALITATIVE]: [
    NominationFile.QualitativeRule.CONFLICT_OF_INTEREST_PRE_MAGISTRATURE,
    NominationFile.QualitativeRule.CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION,
    NominationFile.QualitativeRule.EVALUATIONS,
    NominationFile.QualitativeRule.DISCIPLINARY_ELEMENTS,
  ],
} as const;

export type AllRulesMapV2 = typeof allRulesMapV2;
