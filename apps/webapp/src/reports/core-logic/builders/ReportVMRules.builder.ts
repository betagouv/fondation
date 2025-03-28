import _ from "lodash";
import { NominationFile, RulesBuilder } from "shared-models";
import { UnionToIntersection } from "type-fest";
import { AppState, ReportSM } from "../../../store/appState";
import { ReportVM, VMReportRuleValue } from "../view-models/ReportVM";

export class ReportVMRulesBuilder extends RulesBuilder<
  VMReportRuleValue<boolean>
> {
  static buildFromStoreModel(
    rules: ReportSM["rules"],
    rulesMap: AppState["reportOverview"]["rulesMap"],
    rulesLabelsMap: AppState["reportOverview"]["rulesLabelsMap"],
  ): ReportVM["rulesChecked"] {
    const builtRules = new ReportVMRulesBuilder(({ ruleGroup, ruleName }) => {
      const rulesLabels = rulesLabelsMap[ruleGroup] as UnionToIntersection<
        (typeof rulesLabelsMap)[NominationFile.RuleGroup]
      >;

      if (!Object.values(rulesMap).flat().includes(ruleName))
        return {
          id: "",
          label: "",
          hint: "",
          checked: false,
          highlighted: false,
          comment: "",
        };

      const rule = rules[ruleGroup];
      const ruleValue = (rule as UnionToIntersection<typeof rule>)[ruleName];
      const ruleLabels = rulesLabels[ruleName as keyof typeof rulesLabels];

      return {
        id: ruleValue.id,
        label: ruleLabels?.label || "",
        hint: ruleLabels?.hint || "",
        checked: !ruleValue.validated,
        highlighted: ruleValue.preValidated,
      };
    }, rulesMap).build();

    const rulesVM = Object.entries(rulesMap).reduce(
      (acc, [ruleGroup, ruleNames]) => {
        const group = ruleGroup as NominationFile.RuleGroup;
        const groupRules = builtRules[group] as UnionToIntersection<
          (typeof builtRules)[NominationFile.RuleGroup]
        >;

        const createRules = (
          condition: (ruleValue: VMReportRuleValue<boolean>) => boolean,
          rules?: Partial<Record<NominationFile.RuleName, VMReportRuleValue>>,
        ) => {
          return _.merge(
            rules,
            ...ruleNames.map((ruleName) => {
              const ruleValue = groupRules[ruleName];
              return {
                ...rules,
                ...(condition(ruleValue) && { [ruleName]: ruleValue }),
              };
            }),
          );
        };

        const isRuleSelected = (value: VMReportRuleValue<boolean>) =>
          // On ne prend plus en compte "highlighted" car on teste
          // l'UX sans la pré-validation, en se laissant la possibilité
          // de le ré-introduire en fonction des retours utilisateurs.
          value.checked;

        return {
          ...acc,
          [group]: {
            selected: createRules(isRuleSelected, acc[group]?.selected),
            others: createRules(
              (ruleValue) => !isRuleSelected(ruleValue),
              acc[group]?.others,
            ),
          },
        };
      },
      {} as ReportVM["rulesChecked"],
    );

    return rulesVM;
  }
}
