import { NominationFile } from 'shared-models';

import { ReportRule } from './ReportRule';
import { reportHtmlIds } from '../../dom/html-ids';
import { ReportVM } from '../../../../VM/ReportVM';
import type { ReportSM } from '../../../../queries/list-reports.queries';

export type ReportRulesProps = {
  rulesChecked: ReportVM['rulesChecked'];
  onUpdateReportRule: (
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName
  ) => () => void;
  rules: ReportSM['rules'];
};

export const ReportRules: React.FC<ReportRulesProps> = ({
  rulesChecked,
  onUpdateReportRule,
  rules
}) => {
  const onUpdateManagementRule = (ruleName: NominationFile.ManagementRule) =>
    onUpdateReportRule(NominationFile.RuleGroup.MANAGEMENT, ruleName);

  const onUpdateStatutoryRule = (ruleName: NominationFile.StatutoryRule) =>
    onUpdateReportRule(NominationFile.RuleGroup.STATUTORY, ruleName);

  const onUpdateQualitativeRule = (ruleName: NominationFile.QualitativeRule) =>
    onUpdateReportRule(NominationFile.RuleGroup.QUALITATIVE, ruleName);

  return (
    <>
      <ReportRule<NominationFile.StatutoryRule>
        id={reportHtmlIds.overview.statutorySection}
        title={ReportVM.ruleGroupToLabel[NominationFile.RuleGroup.STATUTORY]}
        rulesChecked={rulesChecked.statutory}
        onUpdateReportRule={onUpdateStatutoryRule}
        rules={rules}
        ruleGroup={NominationFile.RuleGroup.STATUTORY}
      />
      <ReportRule<NominationFile.ManagementRule>
        id={reportHtmlIds.overview.managementSection}
        title={ReportVM.ruleGroupToLabel[NominationFile.RuleGroup.MANAGEMENT]}
        rulesChecked={rulesChecked.management}
        onUpdateReportRule={onUpdateManagementRule}
        rules={rules}
        ruleGroup={NominationFile.RuleGroup.MANAGEMENT}
      />
      <ReportRule<NominationFile.QualitativeRule>
        id={reportHtmlIds.overview.qualitativeSection}
        title={ReportVM.ruleGroupToLabel[NominationFile.RuleGroup.QUALITATIVE]}
        rulesChecked={rulesChecked.qualitative}
        onUpdateReportRule={onUpdateQualitativeRule}
        rules={rules}
        ruleGroup={NominationFile.RuleGroup.QUALITATIVE}
      />
    </>
  );
};
