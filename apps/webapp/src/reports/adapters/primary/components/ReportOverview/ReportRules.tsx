import { NominationFile } from "shared-models";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { ReportRule } from "./ReportRule";
import { reportHtmlIds } from "../../dom/html-ids";

export type ReportRulesProps = {
  rulesChecked: ReportVM["rulesChecked"];
  onUpdateReportRule: (
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName,
  ) => () => void;
  reportId: string;
};

export const ReportRules: React.FC<ReportRulesProps> = ({
  rulesChecked,
  onUpdateReportRule,
  reportId,
}) => {
  const onUpdateManagementRule = (ruleName: NominationFile.ManagementRule) =>
    onUpdateReportRule(NominationFile.RuleGroup.MANAGEMENT, ruleName);

  const onUpdateStatutoryRule = (ruleName: NominationFile.StatutoryRule) =>
    onUpdateReportRule(NominationFile.RuleGroup.STATUTORY, ruleName);

  const onUpdateQualitativeRule = (ruleName: NominationFile.QualitativeRule) =>
    onUpdateReportRule(NominationFile.RuleGroup.QUALITATIVE, ruleName);

  return (
    <>
      <ReportRule<NominationFile.ManagementRule>
        id={reportHtmlIds.overview.managementSection}
        title={ReportVM.ruleGroupToLabel[NominationFile.RuleGroup.MANAGEMENT]}
        rulesChecked={rulesChecked.management}
        onUpdateReportRule={onUpdateManagementRule}
        reportId={reportId}
        ruleGroup={NominationFile.RuleGroup.MANAGEMENT}
      />
      <ReportRule<NominationFile.StatutoryRule>
        id={reportHtmlIds.overview.statutorySection}
        title={ReportVM.ruleGroupToLabel[NominationFile.RuleGroup.STATUTORY]}
        rulesChecked={rulesChecked.statutory}
        onUpdateReportRule={onUpdateStatutoryRule}
        reportId={reportId}
        ruleGroup={NominationFile.RuleGroup.STATUTORY}
      />
      <ReportRule<NominationFile.QualitativeRule>
        id={reportHtmlIds.overview.qualitativeSection}
        title={ReportVM.ruleGroupToLabel[NominationFile.RuleGroup.QUALITATIVE]}
        rulesChecked={rulesChecked.qualitative}
        onUpdateReportRule={onUpdateQualitativeRule}
        reportId={reportId}
        ruleGroup={NominationFile.RuleGroup.QUALITATIVE}
      />
    </>
  );
};
