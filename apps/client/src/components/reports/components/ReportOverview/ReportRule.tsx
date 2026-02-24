import { Accordion } from '@codegouvfr/react-dsfr/Accordion';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import React from 'react';

import { allRulesMapV2, NominationFile } from 'shared-models';

import type { GroupRulesChecked, ReportRuleValue } from '@/types/rules.types';
import type { DetailedReportDto } from '@api/types';
import { Card } from './Card';

const RULE_NAME_SET = new Set<NominationFile.RuleName>(
  Object.values(allRulesMapV2).flatMap((rules) => [...rules])
);

function isRuleName(value: string): value is NominationFile.RuleName {
  return RULE_NAME_SET.has(value as NominationFile.RuleName);
}

export type ReportRuleProps = {
  id: string;
  rulesChecked: GroupRulesChecked;
  onUpdateReportRule: (ruleGroup: NominationFile.RuleGroup, ruleName: NominationFile.RuleName) => () => void;
  showNotice?: boolean;
  rules: DetailedReportDto['rules'];
  ruleGroup: NominationFile.RuleGroup;
};

export function ReportRule({ id, rulesChecked, onUpdateReportRule, rules, ruleGroup }: ReportRuleProps) {
  const targetedRules = rules[ruleGroup];
  const groupRuleNames = new Set<NominationFile.RuleName>(allRulesMapV2[ruleGroup]);

  const atLeastOneNonValidated = Object.entries(targetedRules).some(
    ([ruleName, rule]) => isRuleName(ruleName) && groupRuleNames.has(ruleName) && rule.validated === false
  );

  let title: string;
  let accordionLabel = '';
  switch (ruleGroup) {
    case NominationFile.RuleGroup.MANAGEMENT:
      title = 'Lignes directrices de gestion';
      accordionLabel = atLeastOneNonValidated
        ? 'Autres lignes directrices à vérifier'
        : 'Afficher les lignes directrices à vérifier';
      break;
    case NominationFile.RuleGroup.STATUTORY:
      title = 'Règles statutaires';
      accordionLabel = atLeastOneNonValidated
        ? 'Autres règles statutaires à vérifier'
        : 'Afficher les règles statutaires à vérifier';
      break;
    case NominationFile.RuleGroup.QUALITATIVE:
      title = 'Éléments qualitatifs';
      accordionLabel = atLeastOneNonValidated
        ? 'Autres éléments qualitatifs à vérifier'
        : 'Afficher les éléments qualitatifs à vérifier';
      break;
  }

  const { selected, others } = rulesChecked[ruleGroup];
  const hasAnyNonSelectedRule = Object.keys(others).length > 0;

  const checkboxOnUpdateReportRule = onUpdateReportRule.bind(null, ruleGroup);

  return (
    <Card id={id}>
      <h2>{title}</h2>

      <RuleCheckboxes rules={selected} onUpdateReportRule={checkboxOnUpdateReportRule} />

      {hasAnyNonSelectedRule ? (
        <Accordion label={accordionLabel}>
          <RuleCheckboxes rules={others} onUpdateReportRule={checkboxOnUpdateReportRule} />
        </Accordion>
      ) : null}
    </Card>
  );
}

function RuleCheckboxes(props: {
  rules: Record<string, ReportRuleValue>;
  onUpdateReportRule: (ruleName: NominationFile.RuleName) => void;
}) {
  const options = React.useMemo(
    () =>
      Object.entries(props.rules).map(([ruleName, { label, hint, checked }]) => ({
        nativeInputProps: {
          checked,
          name: ruleName,
          onChange: () => props.onUpdateReportRule(ruleName as NominationFile.RuleName)
        },
        label: (
          <>
            {label}
            <Tooltip
              kind="hover"
              className="max-w-[40rem] self-end"
              id={`${ruleName}-hint`}
              title={
                <div className="whitespace-pre-line">{typeof hint === 'string' ? <p>{hint}</p> : hint}</div>
              }
            />
          </>
        )
      })),
    [props]
  );

  return (
    <Checkbox options={options} classes={{ root: clsx(cx('fr-mb-6v', 'fr-grid-row'), 'flex-nowrap') }} />
  );
}
