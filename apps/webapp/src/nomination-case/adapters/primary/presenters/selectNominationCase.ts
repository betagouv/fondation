import { createSelector } from "@reduxjs/toolkit";
import {
  AppState,
  ManagementRuleName,
  RuleGroup,
  RuleName,
} from "../../../store/appState";

export type VMNominationCaseRuleValue = { label: string; checked: boolean };

export class NominationCaseVM {
  static rulesToLabels: Record<RuleName, string> = {
    transferTime: "Transfer time",
    gettingFirstGrade: "Getting first grade",
    gettingGradeHH: "Getting grade HH",
    gettingGradeInPlace: "Getting grade in place",
    profiledPosition: "Profiled position",
    cassationCourtNomination: "Cassation court nomination",
    overseasToOverseas: "Overseas to overseas",
    judiciaryRoleAndJuridictionDegreeChange:
      "Judiciary role and juridiction degree change",
    judiciaryRoleAndJuridictionDegreeChangeInSameRessort:
      "Judiciary role and juridiction degree change in same ressort",
  };

  constructor(
    public id: string,
    public name: string,
    public biography: string,
    public rulesChecked: Record<
      RuleGroup,
      Record<RuleName, VMNominationCaseRuleValue>
    >
  ) {}
}

export const selectNominationCase = createSelector(
  [
    (state: AppState) => state.nominationCaseRetrieval.byIds,
    (_, id: string) => id,
  ],
  (byIds, id): NominationCaseVM | null => {
    const nominationCase = byIds?.[id];
    if (!nominationCase) return null;

    const createManagementRuleCheckedEntryFromValidatedRules = (
      ruleName: ManagementRuleName
    ) =>
      createRuleCheckedEntryFromValidatedRules(
        nominationCase.preValidatedRules.managementRules,
        ruleName
      );

    return {
      id: nominationCase.id,
      name: nominationCase.name,
      biography: nominationCase.biography,
      rulesChecked: {
        managementRules: {
          ...createManagementRuleCheckedEntryFromValidatedRules("transferTime"),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "gettingFirstGrade"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "gettingGradeHH"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "gettingGradeInPlace"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "profiledPosition"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "cassationCourtNomination"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "overseasToOverseas"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "judiciaryRoleAndJuridictionDegreeChange"
          ),
          ...createManagementRuleCheckedEntryFromValidatedRules(
            "judiciaryRoleAndJuridictionDegreeChangeInSameRessort"
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
      label: NominationCaseVM.rulesToLabels[ruleName],
      checked: !validatedRules[ruleName],
    },
  }) as Record<RuleName, VMNominationCaseRuleValue>;
