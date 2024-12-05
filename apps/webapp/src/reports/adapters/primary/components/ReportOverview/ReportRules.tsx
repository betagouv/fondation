import { NominationFile } from "shared-models";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { ReportRule } from "./ReportRule";

export type ReportRulesProps = {
  rulesChecked: ReportVM["rulesChecked"];
  onUpdateReportRule: (
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName,
  ) => () => void;
};

export const ReportRules: React.FC<ReportRulesProps> = ({
  rulesChecked,
  onUpdateReportRule,
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
        title="Règles de gestion"
        rulesChecked={rulesChecked.management}
        onUpdateReportRule={onUpdateManagementRule}
        showNotice={true}
      />
      <ReportRule<NominationFile.StatutoryRule>
        title="Règles statutaires"
        rulesChecked={rulesChecked.statutory}
        onUpdateReportRule={onUpdateStatutoryRule}
        showNotice={true}
      />
      <ReportRule<NominationFile.QualitativeRule>
        title="Les autres éléments qualitatifs à vérifier"
        rulesChecked={rulesChecked.qualitative}
        onUpdateReportRule={onUpdateQualitativeRule}
      />
    </>
  );
};
