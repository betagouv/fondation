import {
  NominationFile,
  NominationFileListItem,
  RuleName,
} from "../../store/appState";

export interface NominationFileGateway {
  list(): Promise<NominationFileListItem[]>;
  updateRule(
    nominationCaseId: string,
    ruleGroup: string,
    ruleName: RuleName,
    validated: boolean
  ): Promise<void>;
  retrieveNominationFile(id: string): Promise<NominationFile | null>;
}
