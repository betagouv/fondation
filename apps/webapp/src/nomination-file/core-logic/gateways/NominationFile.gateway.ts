import { NominationFile } from "shared-models";
import { NominationFileListItem, NominationFileSM } from "../../store/appState";

export interface UpdateNominationFileParams {
  comment?: string;
  state?:
    | NominationFile.ReportState.IN_PROGRESS
    | NominationFile.ReportState.READY_TO_SUPPORT;
}

export interface NominationFileGateway {
  list(): Promise<NominationFileListItem[]>;
  updateNominationFile(
    reportId: string,
    data: UpdateNominationFileParams,
  ): Promise<void>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveNominationFile(id: string): Promise<NominationFileSM | null>;
}
