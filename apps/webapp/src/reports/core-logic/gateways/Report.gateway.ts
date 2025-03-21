import { AttachedFileVM, NominationFile, ReportFileUsage } from "shared-models";
import { ReportListItem, ReportSM } from "../../../store/appState";

export interface UpdateReportParams {
  comment?: string;
  state?: NominationFile.ReportState;
}

export interface ReportGateway {
  generateFileUrl(reportId: string, fileName: string): Promise<string>;
  generateFileUrlEndpoint(
    reportId: string,
    fileName: string,
  ): Promise<{ urlEndpoint: string; method: "GET" }>;
  list(): Promise<ReportListItem[]>;
  updateReport(reportId: string, data: UpdateReportParams): Promise<void>;
  updateRule(ruleId: string, validated: boolean): Promise<void>;
  retrieveReport(
    id: string,
  ): Promise<
    { attachedFiles: NonNullable<AttachedFileVM>[] | null } & ReportSM
  >;
  uploadFile(
    reportId: string,
    file: File,
    usage: ReportFileUsage,
  ): Promise<void>;
  deleteFile(reportId: string, fileName: string): Promise<void>;
  deleteFiles(reportId: string, fileNames: string[]): Promise<void>;
}
