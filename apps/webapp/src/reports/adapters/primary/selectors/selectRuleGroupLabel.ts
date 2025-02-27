import { createSelector } from "@reduxjs/toolkit";
import { NominationFile } from "shared-models";
import { AppState } from "../../../../store/appState";

export const selectRuleGroupLabel = createSelector(
  [
    (state: AppState) => state.reportOverview.byIds,
    (state: AppState) => state.reportOverview.rulesMap,
    (_, args: { reportId: string; ruleGroup: NominationFile.RuleGroup }) =>
      args,
  ],
  (byIds, rulesMap, { reportId, ruleGroup }) => {
    const report = byIds?.[reportId];
    if (!report) return null;

    const rules = report.rules[ruleGroup];

    const ruleGroupMap = rulesMap[ruleGroup] as NominationFile.RuleName[];
    const atLeastOneUnvalidatedRule = Object.entries(rules)
      .filter(([ruleName]) =>
        ruleGroupMap.includes(ruleName as NominationFile.RuleName),
      )
      .find(([, rule]) => rule.validated === false)?.[1];

    switch (ruleGroup) {
      case NominationFile.RuleGroup.MANAGEMENT:
        return atLeastOneUnvalidatedRule
          ? "Autres lignes directrices à vérifier"
          : "Afficher les lignes directrices à vérifier";
      case NominationFile.RuleGroup.STATUTORY:
        return atLeastOneUnvalidatedRule
          ? "Autres règles statutaires à vérifier"
          : "Afficher les règles statutaires à vérifier";
      case NominationFile.RuleGroup.QUALITATIVE:
        return atLeastOneUnvalidatedRule
          ? "Autres éléments qualitatifs à vérifier"
          : "Afficher les éléments qualitatifs à vérifier";
    }
  },
);
