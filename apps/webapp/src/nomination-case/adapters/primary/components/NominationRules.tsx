import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
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
  const options = Object.entries(rulesChecked)
    .map(([ruleGroup, rule]) =>
      Object.entries(rule).map(([ruleName, { label, checked }]) => {
        return {
          label,
          nativeInputProps: {
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

  return <Checkbox legend="Règles de gestion" options={options} />;
};
