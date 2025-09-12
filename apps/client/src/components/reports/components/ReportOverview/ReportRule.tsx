import { Accordion } from '@codegouvfr/react-dsfr/Accordion';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';

import { allRulesMapV2, NominationFile } from 'shared-models';

import type { ReportVM, VMReportRuleValue } from '../../../../VM/ReportVM';
import type { ReportSM } from '../../../../react-query/queries/list-reports.queries';
import { Card } from './Card';

export type ReportRuleProps<R extends NominationFile.RuleName> = {
  id: string;
  title: string;
  rulesChecked: ReportVM['rulesChecked'][NominationFile.RuleGroup];
  onUpdateReportRule: (ruleName: R) => () => void;
  showNotice?: boolean;
  rules: ReportSM['rules'];
  ruleGroup: NominationFile.RuleGroup;
};

export const ReportRule = <R extends NominationFile.RuleName>({
  id,
  title,
  rulesChecked,
  onUpdateReportRule,
  rules,
  ruleGroup
}: ReportRuleProps<R>) => {
  const targetedRules = rules[ruleGroup];
  const ruleGroupMap = allRulesMapV2[ruleGroup] as NominationFile.RuleName[];

  const atLeastOneUnvalidatedRule = Object.entries(targetedRules)
    .filter(([ruleName]) => ruleGroupMap.includes(ruleName as NominationFile.RuleName))
    .find(([, rule]) => rule.validated === false)?.[1];

  let accordionLabel = '';
  switch (ruleGroup) {
    case NominationFile.RuleGroup.MANAGEMENT:
      accordionLabel = atLeastOneUnvalidatedRule
        ? 'Autres lignes directrices à vérifier'
        : 'Afficher les lignes directrices à vérifier';
      break;
    case NominationFile.RuleGroup.STATUTORY:
      accordionLabel = atLeastOneUnvalidatedRule
        ? 'Autres règles statutaires à vérifier'
        : 'Afficher les règles statutaires à vérifier';
      break;
    case NominationFile.RuleGroup.QUALITATIVE:
      accordionLabel = atLeastOneUnvalidatedRule
        ? 'Autres éléments qualitatifs à vérifier'
        : 'Afficher les éléments qualitatifs à vérifier';
  }

  const createCheckboxes = (rules: Record<string, VMReportRuleValue>) => {
    const checkboxes = Object.entries(rules).map(([ruleName, { label, hint, checked }]) => (
      <div key={ruleName} className={clsx('fr-mb-6v flex-nowrap', cx('fr-grid-row'))}>
        <Checkbox
          id={ruleName}
          options={[
            {
              label,
              nativeInputProps: {
                name: ruleName,
                checked,
                onChange: onUpdateReportRule(ruleName as R)
              }
            }
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
              <div className="whitespace-pre-line">{typeof hint === 'string' ? <p>{hint}</p> : hint}</div>
            }
            style={{
              alignSelf: 'flex-end',
              maxWidth: '40rem'
            }}
          />
        </div>
      </div>
    ));
    return checkboxes;
  };

  return (
    <Card id={id}>
      <h2>{title}</h2>

      {createCheckboxes(rulesChecked.selected)}

      <Accordion
        label={accordionLabel}
        style={{
          display: Object.keys(rulesChecked.others).length === 0 ? 'none' : undefined
        }}
      >
        {createCheckboxes(rulesChecked.others)}
      </Accordion>
    </Card>
  );
};
