import { NominationFile } from "shared-models";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import {
  NominationFileVM,
  VMNominationFileRuleValue,
} from "../../selectors/selectNominationFile";
import { Card } from "./Card";

export type NominationRuleProps = {
  rulesChecked: NominationFileVM["rulesChecked"];
  onUpdateNominationRule: (
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName,
  ) => () => void;
};

export const NominationRules: React.FC<NominationRuleProps> = ({
  rulesChecked,
  onUpdateNominationRule,
}) => {
  const createCheckboxes = (
    ruleGroup: NominationFile.RuleGroup,
    rulesChecked: Record<string, VMNominationFileRuleValue>,
    highlightedClassName: string,
  ) => {
    const checkboxes = Object.entries(rulesChecked).map(
      ([ruleName, { label, checked, highlighted }]) => {
        return (
          <Checkbox
            id={ruleName}
            key={ruleName}
            options={[
              {
                label,
                nativeInputProps: {
                  name: ruleName,
                  checked,
                  onChange: onUpdateNominationRule(
                    ruleGroup,
                    ruleName as NominationFile.RuleName,
                  ),
                },
              },
            ]}
            className={highlighted ? highlightedClassName : undefined}
          />
        );
      },
    );
    return checkboxes;
  };

  return (
    <>
      <Card>
        <div className="fr-h2">Règles de gestion</div>
        {createCheckboxes(
          NominationFile.RuleGroup.MANAGEMENT,
          rulesChecked.management,
          cx("fr-fieldset--valid"),
        )}
      </Card>

      <Card>
        <div className="fr-h2">Règles statutaires</div>
        {createCheckboxes(
          NominationFile.RuleGroup.STATUTORY,
          rulesChecked.statutory,
          cx("fr-fieldset--error"),
        )}
      </Card>

      <Card>
        <div className="fr-h2">Les autres éléments qualitatifs à vérifier</div>
        {createCheckboxes(
          NominationFile.RuleGroup.QUALITATIVE,
          rulesChecked.qualitative,
          "fr-fieldset--info",
        )}
      </Card>
    </>
  );
};
