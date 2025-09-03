import { NominationFile } from 'shared-models';

export const allRulesTuple = [
  ...Object.values(NominationFile.ManagementRule).map(
    (rule) => [NominationFile.RuleGroup.MANAGEMENT, rule] as const
  ),
  ...Object.values(NominationFile.StatutoryRule).map(
    (rule) => [NominationFile.RuleGroup.STATUTORY, rule] as const
  ),
  ...Object.values(NominationFile.QualitativeRule).map(
    (rule) => [NominationFile.RuleGroup.QUALITATIVE, rule] as const
  )
];

export const allRulesMapV2 = {
  [NominationFile.RuleGroup.MANAGEMENT]: [
    NominationFile.ManagementRule.TRANSFER_TIME,
    NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE,
    NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT
  ],
  [NominationFile.RuleGroup.STATUTORY]: Object.values(NominationFile.StatutoryRule),
  [NominationFile.RuleGroup.QUALITATIVE]: [
    NominationFile.QualitativeRule.CONFLICT_OF_INTEREST_PRE_MAGISTRATURE,
    NominationFile.QualitativeRule.CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION,
    NominationFile.QualitativeRule.EVALUATIONS,
    NominationFile.QualitativeRule.DISCIPLINARY_ELEMENTS
  ]
};

export type AllRulesMapV2 = typeof allRulesMapV2;
