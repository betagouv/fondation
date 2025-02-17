import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { NominationFile } from "shared-models";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { Card } from "./Card";
import { RuleCheckNotice } from "./RuleCheckNotice";
import {
  ReportVM,
  VMReportRuleValue,
} from "../../../../core-logic/view-models/ReportVM";
import _ from "lodash";
import clsx from "clsx";

export type ReportRuleProps<R extends NominationFile.RuleName> = {
  id: string;
  title: string;
  rulesChecked: ReportVM["rulesChecked"][NominationFile.RuleGroup];
  onUpdateReportRule: (ruleName: R) => () => void;
  showNotice?: boolean;
};

export const ReportRule = <R extends NominationFile.RuleName>({
  id,
  title,
  rulesChecked,
  onUpdateReportRule,
  showNotice = false,
}: ReportRuleProps<R>) => {
  const createCheckboxes = (rules: Record<string, VMReportRuleValue>) => {
    const checkboxes = Object.entries(rules).map(
      ([ruleName, { label, hint, checked, highlighted }]) => (
        <div key={ruleName} className={clsx("flex-nowrap", cx("fr-grid-row"))}>
          <Checkbox
            id={ruleName}
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
          <div>
            <Tooltip
              kind="hover"
              id={`${ruleName}-hint`}
              title={hint}
              style={{
                alignSelf: "flex-end",
              }}
            />
          </div>
        </div>
      ),
    );
    return checkboxes;
  };

  return (
    <Card id={id}>
      <h2>{title}</h2>
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
  );
};
