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
