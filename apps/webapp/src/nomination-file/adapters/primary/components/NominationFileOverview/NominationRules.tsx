import { Checkbox, CheckboxProps } from "@codegouvfr/react-dsfr/Checkbox";
import { RuleGroup, RuleName } from "../../../../store/appState";
import { NominationFileVM } from "../../selectors/selectNominationFile";

export type NominationRuleProps = {
  rulesChecked: NominationFileVM["rulesChecked"];
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

  return (
    <div>
      <div className="fr-h2">Règles de gestion</div>
      <Checkbox id="rule" options={options} />
    </div>
  );
};
