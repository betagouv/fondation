import type { NominationFile } from 'shared-models';

type RuleGroupName = {
  [NominationFile.RuleGroup.MANAGEMENT]: NominationFile.ManagementRule;
  [NominationFile.RuleGroup.QUALITATIVE]: NominationFile.QualitativeRule;
  [NominationFile.RuleGroup.STATUTORY]: NominationFile.StatutoryRule;
};

export type ReportRuleValue = {
  id: string;
  label: string;
  hint: React.ReactNode;
  checked: boolean;
  highlighted: boolean;
};

export type GroupRulesChecked = {
  [G in NominationFile.RuleGroup]: Record<'selected' | 'others', Record<RuleGroupName[G], ReportRuleValue>>;
};
