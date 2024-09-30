import { Checkbox, CheckboxProps } from "@codegouvfr/react-dsfr/Checkbox";
import { RuleGroup, RuleName } from "../../../store/appState";
import { NominationCaseVM } from "../presenters/selectNominationCase";

export type NominationRuleProps = {
  rulesChecked: NominationCaseVM["rulesChecked"];
  onUpdateNominationRule: (
    ruleGroup: RuleGroup,
    ruleName: RuleName
  ) => () => void;
};

export const NominationRules: React.FC<NominationRuleProps> = ({
  rulesChecked,
  onUpdateNominationRule,
}) => {
  const options: CheckboxProps["options"] = Object.entries(rulesChecked)
    .map(([ruleGroup, rule]) =>
      Object.entries(rule).map(([ruleName, { label, checked }]) => {
        return {
          label,
          nativeInputProps: {
            name: ruleName,
            checked,
            onChange: onUpdateNominationRule(
              ruleGroup as RuleGroup,
              ruleName as RuleName
            ),
          },
        };
      })
    )
    .flat();

  return <Checkbox id="rule" legend="Règles de gestion" options={options} />;
};
