export interface NominationCase {
  id: string;
  name: string;
  biography: string;
  preValidatedRules: {
    overseasToOverseas: boolean;
  };
}

export interface AppState {
  nominationCaseRetrieval: { byIds: Record<string, NominationCase> | null };
}
