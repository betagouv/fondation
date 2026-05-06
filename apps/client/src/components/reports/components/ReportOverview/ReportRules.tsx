import { NominationFile } from 'shared-models';

import { reportHtmlIds } from '../../dom/html-ids';
import type { GroupRulesChecked } from '@/types/rules.types';
import type { DetailedReportDto } from '@api/types';

import { ReportRule } from './ReportRule';

export type ReportRulesProps = {
  rulesChecked: GroupRulesChecked;
  onUpdateReportRule: (ruleGroup: NominationFile.RuleGroup, ruleName: NominationFile.RuleName) => () => void;
  rules: DetailedReportDto['rules'];
};

export const ReportRules: React.FC<ReportRulesProps> = ({ rulesChecked, onUpdateReportRule, rules }) => {
  return (
    <>
      <ReportRule
        rules={rules}
        rulesChecked={rulesChecked}
        onUpdateReportRule={onUpdateReportRule}
        id={reportHtmlIds.overview.statutorySection}
        ruleGroup={NominationFile.RuleGroup.STATUTORY}
      />
      <ReportRule
        rules={rules}
        rulesChecked={rulesChecked}
        onUpdateReportRule={onUpdateReportRule}
        id={reportHtmlIds.overview.managementSection}
        ruleGroup={NominationFile.RuleGroup.MANAGEMENT}
      />
      <ReportRule
        rules={rules}
        rulesChecked={rulesChecked}
        onUpdateReportRule={onUpdateReportRule}
        id={reportHtmlIds.overview.qualitativeSection}
        ruleGroup={NominationFile.RuleGroup.QUALITATIVE}
      />
    </>
  );
};
