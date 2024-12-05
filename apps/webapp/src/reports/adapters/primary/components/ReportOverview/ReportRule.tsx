import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { NominationFile } from "shared-models";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { Card } from "./Card";
import { RuleCheckNotice } from "./RuleCheckNotice";
import {
  ReportVM,
  VMReportRuleValue,
} from "../../../../core-logic/view-models/ReportVM";
import _ from "lodash";

export type ReportRuleProps<R extends NominationFile.RuleName> = {
  title: string;
  rulesChecked: ReportVM["rulesChecked"][NominationFile.RuleGroup];
  onUpdateReportRule: (ruleName: R) => () => void;
  showNotice?: boolean;
};

export const ReportRule = <R extends NominationFile.RuleName>({
  title,
  rulesChecked,
  onUpdateReportRule,
  showNotice = false,
}: ReportRuleProps<R>) => {
  const createCheckboxes = (rules: Record<string, VMReportRuleValue>) => {
    const checkboxes = Object.entries(rules).map(
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
                onChange: onUpdateReportRule(ruleName as R),
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
        <div className="fr-h2">{title}</div>
        {showNotice && <RuleCheckNotice />}

        {createCheckboxes(rulesChecked.selected)}

        <Accordion
          label={rulesChecked.accordionLabel}
          style={{
            display: _.isEmpty(rulesChecked.others) ? "none" : undefined,
          }}
        >
          {createCheckboxes(rulesChecked.others)}
        </Accordion>
      </Card>
    </>
  );
};
