import { NominationFile } from "./nomination-file.namespace";

export const rulesTuple = [
  ...Object.values(NominationFile.ManagementRule).map(
    (rule) => [NominationFile.RuleGroup.MANAGEMENT, rule] as const
  ),
  ...Object.values(NominationFile.StatutoryRule).map(
    (rule) => [NominationFile.RuleGroup.STATUTORY, rule] as const
  ),
  ...Object.values(NominationFile.QualitativeRule).map(
    (rule) => [NominationFile.RuleGroup.QUALITATIVE, rule] as const
  ),
];

export const ruleGroupToRuleNames = {
  [NominationFile.RuleGroup.MANAGEMENT]: NominationFile.ManagementRule,
  [NominationFile.RuleGroup.STATUTORY]: NominationFile.StatutoryRule,
  [NominationFile.RuleGroup.QUALITATIVE]: NominationFile.QualitativeRule,
};
