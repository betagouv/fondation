import { AppState } from "../../../store/appState";

export type NominationCaseVM = {
  id: string;
  name: string;
  biography: string;
  rulesChecked: {
    overseasToOverseas: boolean;
  };
};

export const selectNominationCase = (
  state: AppState,
  id: string
): NominationCaseVM | null => {
  console.log("select state", state);
  const nominationCase = state.nominationCaseRetrieval.byIds?.[id];
  console.log("select nomination", nominationCase);
  if (!nominationCase) return null;
  return {
    id: nominationCase.id,
    name: nominationCase.name,
    biography: nominationCase.biography,
    rulesChecked: {
      overseasToOverseas: !nominationCase.preValidatedRules.overseasToOverseas,
    },
  };
};
