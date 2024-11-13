import { createSelector } from "@reduxjs/toolkit";
import { NominationFile, ruleGroupToRuleNames } from "shared-models";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import {
  ReportVM,
  VMReportRuleValue,
} from "../../../core-logic/view-models/ReportVM";
import { AppState, ReportSM } from "../../../store/appState";

type RuleCheckedEntry = ReportVM["rulesChecked"][NominationFile.RuleGroup];

export const selectReport = createSelector(
  [(state: AppState) => state.reportOverview.byIds, (_, id: string) => id],
  (byIds, id): ReportVM | null => {
    const report = byIds?.[id];
    if (!report) return null;

    const createRulesCheckedEntryFor = <G extends NominationFile.RuleGroup>(
      ruleGroup: G,
    ) =>
      ({
        [ruleGroup]: createRulesCheckedFor(ruleGroup),
      }) as Pick<ReportVM["rulesChecked"], G>;

    const createRulesCheckedFor = <G extends NominationFile.RuleGroup>(
      ruleGroup: G,
    ) =>
      Object.values<
        | NominationFile.ManagementRule
        | NominationFile.StatutoryRule
        | NominationFile.QualitativeRule
      >(ruleGroupToRuleNames[ruleGroup]).reduce(
        (acc, ruleName) => ({
          ...acc,
          ...createRuleCheckedEntryFromValidatedRules(
            report.rules[ruleGroup],
            ruleGroup,
            ruleName,
          ),
        }),
        {} as RuleCheckedEntry,
      );

    return {
      id: report.id,
      name: report.name,
      biography: report.biography ? formatBiography(report.biography) : null,
      dueDate: report.dueDate
        ? DateOnly.fromStoreModel(report.dueDate).toFormattedString()
        : null,
      birthDate: DateOnly.fromStoreModel(report.birthDate).toFormattedString(),
      state: report.state,
      formation: report.formation,
      transparency: report.transparency,
      grade: report.grade,
      currentPosition: report.currentPosition,
      targettedPosition: report.targettedPosition,
      comment: report.comment,
      rank: report.rank,
      observers: formatObservers(report.observers),
      rulesChecked: {
        ...createRulesCheckedEntryFor(NominationFile.RuleGroup.MANAGEMENT),
        ...createRulesCheckedEntryFor(NominationFile.RuleGroup.STATUTORY),
        ...createRulesCheckedEntryFor(NominationFile.RuleGroup.QUALITATIVE),
      },
    };
  },
);

const formatBiography = (biography: string) => {
  if (biography.indexOf("- ") === -1) return biography;

  const biographyElements = biography
    .trim()
    .split("- ")
    .map((part) => part.trim());
  // we skipt the real first element because it is empty
  const [, firstElement, ...otherElements] = biographyElements;
  return `- ${firstElement}\n- ${otherElements.join("\n- ")}`;
};

const formatObservers = (
  observers: ReportSM["observers"],
): ReportVM["observers"] =>
  observers?.map((observer) => observer.split("\n") as [string, ...string[]]) ||
  null;

const createRuleCheckedEntryFromValidatedRules = <
  G extends NominationFile.RuleGroup,
>(
  validatedRules: NominationFile.Rules[G],
  ruleGroup: G,
  ruleName: NominationFile.RuleName,
) => {
  const ruleValue = (
    validatedRules as Record<NominationFile.RuleName, NominationFile.RuleValue>
  )[ruleName];

  const values: VMReportRuleValue = {
    id: ruleValue.id,
    label: (
      ReportVM.rulesToLabels[ruleGroup] as Record<
        NominationFile.RuleName,
        string
      >
    )[ruleName as NominationFile.RuleName],
    checked: !ruleValue.validated,
    highlighted: ruleValue.preValidated,
    comment: ruleValue.comment,
  };

  return {
    [ruleName]: values,
  } as RuleCheckedEntry;
};
