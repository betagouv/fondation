export interface NominationCase {
  id: string;
  name: string;
  biography: string;
  preValidatedRules: {
    managementRules: {
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
}

export type RuleGroup = keyof NominationCase["preValidatedRules"];
export type ManagementRuleName =
  keyof NominationCase["preValidatedRules"]["managementRules"];
export type RuleName = ManagementRuleName;

export interface AppState {
  nominationCaseRetrieval: { byIds: Record<string, NominationCase> | null };
}
