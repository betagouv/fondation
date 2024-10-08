import { createSelector } from "@reduxjs/toolkit";
import {
  AppState,
  ManagementRuleName,
  RuleGroup,
  RuleName,
} from "../../../store/appState";

export type VMNominationFileRuleValue = { label: string; checked: boolean };

export class NominationFileVM {
  static rulesToLabels: Record<RuleName, string> = {
    TRANSFER_TIME: "Transfer time",
    GETTING_FIRST_GRADE: "Getting first grade",
    GETTING_GRADE_HH: "Getting grade HH",
    GETTING_GRADE_IN_PLACE: "Getting grade in place",
    PROFILED_POSITION: "Profiled position",
    CASSATION_COURT_NOMINATION: "Cassation court nomination",
    OVERSEAS_TO_OVERSEAS: "Overseas to overseas",
    JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE:
      "Judiciary role and juridiction degree change",
    JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE_IN_SAME_RESSORT:
      "Judiciary role and juridiction degree change in same ressort",
  };

  constructor(
    public id: string,
    public name: string,
    public biography: string,
    public rulesChecked: Record<
      RuleGroup,
      Record<RuleName, VMNominationFileRuleValue>
    >
  ) {}
}

export const selectNominationFile = createSelector(
  [
    (state: AppState) => state.nominationFileOverview.byIds,
    (_, id: string) => id,
  ],
  (byIds, id): NominationFileVM | null => {
    const nominationFile = byIds?.[id];
    if (!nominationFile) return null;

    const createManagementRuleCheckedEntryFromValidatedRules = (
      ruleName: ManagementRuleName
    ) =>
      createRuleCheckedEntryFromValidatedRules(
        nominationFile.rules.management,
        ruleName
      );

    return {
      id: nominationFile.id,
      name: nominationFile.title,
      biography: nominationFile.biography,
      rulesChecked: {
        management: {
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "TRANSFER_TIME"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "GETTING_FIRST_GRADE"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "GETTING_GRADE_HH"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "GETTING_GRADE_IN_PLACE"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "PROFILED_POSITION"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "CASSATION_COURT_NOMINATION"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "OVERSEAS_TO_OVERSEAS"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE_IN_SAME_RESSORT"
          ),
        },
      },
    };
  }
);

const createRuleCheckedEntryFromValidatedRules = (
  validatedRules: Record<RuleName, boolean>,
  ruleName: RuleName
) =>
  ({
    [ruleName]: {
      label: NominationFileVM.rulesToLabels[ruleName],
      checked: !validatedRules[ruleName],
    },
  }) as Record<RuleName, VMNominationFileRuleValue>;
