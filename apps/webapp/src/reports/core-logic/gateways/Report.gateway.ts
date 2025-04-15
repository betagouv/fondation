import { NominationFile, ReportFileUsage } from "shared-models";
import { ReportListItem, ReportSM } from "../../../store/appState";
import { UploadFileArg } from "./ReportApi.client";

export interface UpdateReportParams {
  comment?: string;
  state?: NominationFile.ReportState;
}

export interface ReportGateway {
  list(): Promise<ReportListItem[]>;
  updateReport(reportId: string, data: UpdateReportParams): Promise<void>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveReport(id: string): Promise<ReportSM>;
  uploadFiles(
    reportId: string,
    files: UploadFileArg[],
    usage: ReportFileUsage,
  ): Promise<void>;
  deleteFile(reportId: string, fileName: string): Promise<void>;
  deleteFiles(reportId: string, fileNames: string[]): Promise<void>;
}
