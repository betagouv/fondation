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
    // statutoryRules: {};
  };
}

export interface AppState {
  nominationCaseRetrieval: { byIds: Record<string, NominationCase> | null };
}
