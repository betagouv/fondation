import { NominationFile } from "shared-models";
import { ReportListItem, ReportSM } from "../../../store/appState";

export interface UpdateReportParams {
  comment?: string;
  state?: NominationFile.ReportState;
}

export interface ReportGateway {
  generateFileUrl(reportId: string, fileName: string): Promise<string>;
  list(): Promise<ReportListItem[]>;
  updateReport(reportId: string, data: UpdateReportParams): Promise<void>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveReport(id: string): Promise<ReportSM | null>;
  attachFile(reportId: string, file: File): Promise<void>;
  deleteAttachedFile(reportId: string, fileName: string): Promise<void>;
}
