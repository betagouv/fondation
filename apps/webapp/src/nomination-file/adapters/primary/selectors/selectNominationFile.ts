import { createSelector } from "@reduxjs/toolkit";
import { NominationFile, ruleGroupToRuleNames } from "shared-models";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import {
  NominationFileVM,
  VMNominationFileRuleValue,
} from "../../../core-logic/view-models/NominationFileVM";
import { AppState, NominationFileSM } from "../../../store/appState";

type RuleCheckedEntry =
  NominationFileVM["rulesChecked"][NominationFile.RuleGroup];

export const selectNominationFile = createSelector(
  [
    (state: AppState) => state.nominationFileOverview.byIds,
    (_, id: string) => id,
  ],
  (byIds, id): NominationFileVM | null => {
    const nominationFile = byIds?.[id];
    if (!nominationFile) return null;

    const createRulesCheckedEntryFor = <G extends NominationFile.RuleGroup>(
      ruleGroup: G,
    ) =>
      ({
        [ruleGroup]: createRulesCheckedFor(ruleGroup),
      }) as Pick<NominationFileVM["rulesChecked"], G>;

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
            nominationFile.rules[ruleGroup],
            ruleGroup,
            ruleName,
          ),
        }),
        {} as RuleCheckedEntry,
      );

    return {
      id: nominationFile.id,
      name: nominationFile.name,
      biography: nominationFile.biography
        ? formatBiography(nominationFile.biography)
        : null,
      dueDate: nominationFile.dueDate
        ? DateOnly.fromStoreModel(nominationFile.dueDate).toFormattedString()
        : null,
      birthDate: DateOnly.fromStoreModel(
        nominationFile.birthDate,
      ).toFormattedString(),
      state: nominationFile.state,
      formation: nominationFile.formation,
      transparency: nominationFile.transparency,
      grade: nominationFile.grade,
      currentPosition: nominationFile.currentPosition,
      targettedPosition: nominationFile.targettedPosition,
      comment: nominationFile.comment,
      rank: nominationFile.rank,
      observers: formatObservers(nominationFile.observers),
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
  observers: NominationFileSM["observers"],
): NominationFileVM["observers"] =>
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

  const values: VMNominationFileRuleValue = {
    id: ruleValue.id,
    label: (
      NominationFileVM.rulesToLabels[ruleGroup] as Record<
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
