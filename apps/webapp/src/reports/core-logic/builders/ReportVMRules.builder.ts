import _ from "lodash";
import { NominationFile, RulesBuilder } from "shared-models";
import { UnionToIntersection } from "type-fest";
import { AppState, ReportSM } from "../../../store/appState";
import { ReportVM, VMReportRuleValue } from "../view-models/ReportVM";

//! La persistence des règles va être supprimée,
//! et par conséquent cette classe également.
//! On s'autorise à patcher cette classe en attendant l'UX simplifiée pour les règles.
export class ReportVMRulesBuilder extends RulesBuilder<
  VMReportRuleValue<boolean>
> {
  static buildFromStoreModel(
    rules: ReportSM["rules"],
    rulesMap: AppState["reportOverview"]["rulesMap"],
    rulesLabelsMap: AppState["reportOverview"]["rulesLabelsMap"],
  ): ReportVM["rulesChecked"] {
    const builtRules = new ReportVMRulesBuilder(
      ({ ruleGroup, ruleName }) => {
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

        if (
          ruleName ===
          NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT
        ) {
          const mergedRule = (rule as UnionToIntersection<typeof rule>)[
            NominationFile.ManagementRule
              .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE
          ];

          return {
            id: ruleValue.id,
            label: ruleLabels?.label || "",
            hint: ruleLabels?.hint || "",
            checked: !ruleValue.validated || !mergedRule.validated,
            highlighted: ruleValue.preValidated || mergedRule.preValidated,
            comment: ruleValue.comment,
          };
        }

        return {
          id: ruleValue.id,
          label: ruleLabels?.label || "",
          hint: ruleLabels?.hint || "",
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
