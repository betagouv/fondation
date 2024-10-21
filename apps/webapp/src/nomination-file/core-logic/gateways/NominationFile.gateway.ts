import { NominationFileListItem, NominationFileSM } from "../../store/appState";

export interface NominationFileGateway {
  list(): Promise<NominationFileListItem[]>;
  updateNominationFile(
    reportId: string,
    data: Partial<Pick<NominationFileSM, "biography" | "comment">>,
  ): Promise<void>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveNominationFile(id: string): Promise<NominationFileSM | null>;
}
