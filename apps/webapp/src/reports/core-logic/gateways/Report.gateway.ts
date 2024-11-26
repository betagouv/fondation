import { NominationFile } from "shared-models";
import { ReportListItem, ReportSM } from "../../store/appState";

export interface UpdateReportParams {
  comment?: string;
  state?:
    | NominationFile.ReportState.IN_PROGRESS
    | NominationFile.ReportState.READY_TO_SUPPORT;
}

export interface ReportGateway {
  attachFile(reportId: string, file: File): Promise<void>;
  generateFileUrl(reportId: string, fileName: string): Promise<string>;
  list(): Promise<ReportListItem[]>;
  updateReport(reportId: string, data: UpdateReportParams): Promise<void>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveReport(id: string): Promise<ReportSM | null>;
}
