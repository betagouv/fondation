import { NominationFile } from "@/shared-models";
import { Checkbox, CheckboxProps } from "@codegouvfr/react-dsfr/Checkbox";
import { NominationFileVM } from "../../selectors/selectNominationFile";

export type NominationRuleProps = {
  rulesChecked: NominationFileVM["rulesChecked"];
  onUpdateNominationRule: (
    ruleGroup: NominationFile.RuleGroup.MANAGEMENT,
    ruleName: NominationFile.RuleName,
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
              ruleGroup as NominationFile.RuleGroup.MANAGEMENT,
              ruleName as NominationFile.RuleName,
            ),
          },
        };
      }),
    )
    .flat();

  return (
    <div>
      <div className="fr-h2">Règles de gestion</div>
      <Checkbox id="rule" options={options} />
    </div>
  );
};
