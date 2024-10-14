import { NominationFileListItem, NominationFileSM } from "../../store/appState";

export interface NominationFileGateway {
  list(): Promise<NominationFileListItem[]>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveNominationFile(id: string): Promise<NominationFileSM | null>;
}
