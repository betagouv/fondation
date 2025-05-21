import { allRulesMapV2, NominationFile } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { Règle } from 'src/nominations-context/sessions/business-logic/models/règle';

const newRulesV2 = [
  Règle.create(
    NominationFile.RuleGroup.STATUTORY,
    NominationFile.StatutoryRule
      .RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS,
    false,
  ),
  Règle.create(
    NominationFile.RuleGroup.STATUTORY,
    NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS,
    false,
  ),
];

export class TransparenceRulesMapper {
  fromTransparenceRulesV1(
    rulesV1: GdsNewTransparenceImportedEventPayload['nominationFiles'][number]['content']['rules'],
  ): Règle[] {
    const rules = Object.entries(rulesV1)
      .map(([group, rule]) =>
        Object.entries(rule)
          .filter(([ruleName]) =>
            this.filterRulesV2(ruleName as NominationFile.RuleName),
          )
          .map(([ruleName, ruleValue]) =>
            Règle.create(group, ruleName, ruleValue),
          ),
      )
      .flat()
      .concat(newRulesV2);

    return rules;
  }

  filterRulesV2(ruleName: NominationFile.RuleName) {
    return Object.values(allRulesMapV2).flat().includes(ruleName);
  }
}
