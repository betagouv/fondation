import { RulesBuilder, NominationFile } from "shared-models";
import { AppState, ReportSM } from "../../store/appState";
import { VMReportRuleValue, ReportVM } from "../view-models/ReportVM";
import { UnionToIntersection } from "type-fest";
import _ from "lodash";

export class ReportVMRulesBuilder extends RulesBuilder<
  VMReportRuleValue<boolean>
> {
  static buildFromStoreModel(
    rules: ReportSM["rules"],
    rulesMap: AppState["reportOverview"]["rulesMap"],
  ): ReportVM["rulesChecked"] {
    const builtRules = new ReportVMRulesBuilder(
      ({ ruleGroup, ruleName }) => {
        const rule = rules[ruleGroup];
        const ruleValue = (rule as UnionToIntersection<typeof rule>)[ruleName];
        const rulesLabels = ReportVM.rulesToLabels[ruleGroup];

        return {
          id: ruleValue.id,
          label: (rulesLabels as UnionToIntersection<typeof rulesLabels>)[
            ruleName
          ],
          checked: !ruleValue.validated,
          highlighted: ruleValue.preValidated,
          comment: ruleValue.comment,
        };
      },
      undefined,
      rulesMap,
    ).build();

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
          value.checked || value.highlighted;

        return {
          ...acc,
          [group]: {
            selected: createRules(isRuleSelected, acc[group]?.selected),
            others: createRules(
              (ruleValue) => !isRuleSelected(ruleValue),
              acc[group]?.others,
            ),
            accordionLabel: getReportAccordionLabel(group),
          },
        };
      },
      {} as ReportVM["rulesChecked"],
    );

    return rulesVM;
  }
}

export const getReportAccordionLabel = (
  group: NominationFile.RuleGroup,
): string => {
  switch (group) {
    case NominationFile.RuleGroup.MANAGEMENT:
      return "Autres règles de gestion";
    case NominationFile.RuleGroup.STATUTORY:
      return "Autres règles statutaires";
    case NominationFile.RuleGroup.QUALITATIVE:
      return "Autres éléments qualitatifs";
    default: {
      const _exhaustiveCheck: never = group;
      console.info(_exhaustiveCheck);
      throw new Error("Unhandled rule group");
    }
  }
};
