import { AppState } from "../../../store/appState";

export type NominationCaseVM = {
  id: string;
  name: string;
  biography: string;
  rulesChecked: {
    management: {
      transferTime: boolean;
      gettingFirstGrade: boolean;
      gettingGradeHH: boolean;
      gettingGradeInPlace: boolean;
      profiledPosition: boolean;
      cassationCourtNomination: boolean;
      overseasToOverseas: boolean;
      judiciaryRoleAndJuridictionDegreeChange: boolean;
      judiciaryRoleAndJuridictionDegreeChangeInSameRessort: boolean;
    };
  };
};

type ManagementRuleName = keyof NominationCaseVM["rulesChecked"]["management"];
type RuleName = ManagementRuleName;

export const selectNominationCase = (
  state: AppState,
  id: string
): NominationCaseVM | null => {
  const nominationCase = state.nominationCaseRetrieval.byIds?.[id];
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
      management: {
        ...createManagementRuleCheckedEntryFromValidatedRules("transferTime"),
        ...createManagementRuleCheckedEntryFromValidatedRules(
          "gettingFirstGrade"
        ),
        ...createManagementRuleCheckedEntryFromValidatedRules("gettingGradeHH"),
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
};

const createRuleCheckedEntryFromValidatedRules = (
  validatedRules: Record<RuleName, boolean>,
  ruleName: RuleName
) => ({ [ruleName]: !validatedRules[ruleName] }) as Record<RuleName, boolean>;
