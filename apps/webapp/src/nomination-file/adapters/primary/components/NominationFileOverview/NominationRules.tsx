import { NominationFile } from "shared-models";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { Card } from "./Card";
import { RuleCheckNotice } from "./RuleCheckNotice";
import {
  NominationFileVM,
  VMNominationFileRuleValue,
} from "../../../../core-logic/view-models/NominationFileVM";

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
  ) => {
    const checkboxes = Object.entries(rulesChecked).map(
      ([ruleName, { label, checked, highlighted }]) => (
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
          className={highlighted ? cx("fr-fieldset--error") : undefined}
        />
      ),
    );
    return checkboxes;
  };

  return (
    <>
      <Card>
        <div className="fr-h2">Règles de gestion</div>
        <RuleCheckNotice />
        {createCheckboxes(
          NominationFile.RuleGroup.MANAGEMENT,
          rulesChecked.management,
        )}
      </Card>

      <Card>
        <div className="fr-h2">Règles statutaires</div>
        <RuleCheckNotice />
        {createCheckboxes(
          NominationFile.RuleGroup.STATUTORY,
          rulesChecked.statutory,
        )}
      </Card>

      <Card>
        <div className="fr-h2">Les autres éléments qualitatifs à vérifier</div>
        {createCheckboxes(
          NominationFile.RuleGroup.QUALITATIVE,
          rulesChecked.qualitative,
        )}
      </Card>
    </>
  );
};
