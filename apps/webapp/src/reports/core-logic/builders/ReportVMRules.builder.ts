import { RulesBuilder, NominationFile } from "shared-models";
import { AppState, ReportSM } from "../../store/appState";
import { VMReportRuleValue, ReportVM } from "../view-models/ReportVM";

export class ReportVMRulesBuilder extends RulesBuilder<VMReportRuleValue> {
  static fromStoreModel(
    rules: ReportSM["rules"],
    rulesTuple: AppState["reportOverview"]["rulesTuple"],
  ): ReportVMRulesBuilder {
    return new ReportVMRulesBuilder(
      ({ ruleGroup, ruleName }) => {
        const rule = rules[ruleGroup] as Record<
          NominationFile.RuleName,
          NominationFile.RuleValue
        >;
        const ruleValue = rule[ruleName];

        return {
          id: ruleValue.id,
          label: (
            ReportVM.rulesToLabels[ruleGroup] as Record<
              NominationFile.RuleName,
              string
            >
          )[ruleName as NominationFile.RuleName],
          checked: !ruleValue.validated,
          highlighted: ruleValue.preValidated,
          comment: ruleValue.comment,
        };
      },
      undefined,
      rulesTuple,
    );
  }
}
