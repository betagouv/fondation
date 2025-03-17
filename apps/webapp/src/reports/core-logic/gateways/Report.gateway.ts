import { NominationFile, ReportFileUsage } from "shared-models";
import { ReportListItem } from "../../../store/appState";
import { EndpointResponse } from "./ReportApi.client";

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
  retrieveReport(id: string): EndpointResponse<"retrieveReport">;
  uploadFile(
    reportId: string,
    file: File,
    usage: ReportFileUsage,
  ): Promise<void>;
  deleteFile(reportId: string, fileName: string): Promise<void>;
  deleteFiles(reportId: string, fileNames: string[]): Promise<void>;
}
