import { NominationFile, NominationFileListItem } from "../../store/appState";

export interface NominationFileGateway {
  list(): Promise<NominationFileListItem[]>;
  updateRule(
    nominationCaseId: string,
    ruleGroup: string,
    ruleName: string,
    validated: boolean
  ): Promise<void>;
  retrieveNominationFile(id: string): Promise<NominationFile | null>;
}
