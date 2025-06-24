import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import clsx from "clsx";
import _ from "lodash";
import { NominationFile } from "shared-models";
import {
  ReportVM,
  VMReportRuleValue,
} from "../../../../core-logic/view-models/ReportVM";
import { useAppSelector } from "../../hooks/react-redux";
import { selectRuleGroupLabel } from "../../selectors/selectRuleGroupLabel";
import { Card } from "./Card";

export type ReportRuleProps<R extends NominationFile.RuleName> = {
  id: string;
  title: string;
  rulesChecked: ReportVM["rulesChecked"][NominationFile.RuleGroup];
  onUpdateReportRule: (ruleName: R) => () => void;
  showNotice?: boolean;
  reportId: string;
  ruleGroup: NominationFile.RuleGroup;
};

export const ReportRule = <R extends NominationFile.RuleName>({
  id,
  title,
  rulesChecked,
  onUpdateReportRule,
  reportId,
  ruleGroup,
}: ReportRuleProps<R>) => {
  const accordionLabel = useAppSelector((state) =>
    selectRuleGroupLabel(state, {
      reportId,
      ruleGroup,
    }),
  );

  const createCheckboxes = (rules: Record<string, VMReportRuleValue>) => {
    const checkboxes = Object.entries(rules).map(
      ([ruleName, { label, hint, checked }]) => (
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
            // On ne mets plus en couleur les règles "highlighted" car on teste
            // l'UX sans la pré-validation, en se laissant la possibilité
            // de le ré-introduire en fonction des retours utilisateurs.
          />
          <div>
            <Tooltip
              kind="hover"
              id={`${ruleName}-hint`}
              title={
                <div className="whitespace-pre-line">
                  {typeof hint === "string" ? <p>{hint}</p> : hint}
                </div>
              }
              style={{
                alignSelf: "flex-end",
                maxWidth: "40rem",
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

      {createCheckboxes(rulesChecked.selected)}

      <Accordion
        label={accordionLabel}
        style={{
          display: _.isEmpty(rulesChecked.others) ? "none" : undefined,
        }}
      >
        {createCheckboxes(rulesChecked.others)}
      </Accordion>
    </Card>
  );
};
