import {
  ReportFileUsage,
  ReportsContextRestContract,
  ReportUpdateDto,
} from "shared-models";

export type UploadFileArg = { file: File; fileId: string };

export type EndpointResponse<
  T extends keyof ReportsContextRestContract["endpoints"],
> = Promise<ReportsContextRestContract["endpoints"][T]["response"]>;

export interface ReportApiClient {
  generateFileUrl(
    reportId: string,
    fileName: string,
  ): EndpointResponse<"generateFileUrl">;
  list(): EndpointResponse<"listReports">;
  updateReport(
    reportId: string,
    data: ReportUpdateDto,
  ): EndpointResponse<"updateReport">;
  updateRule(
    ruleId: string,
    validated: boolean,
  ): EndpointResponse<"updateRule">;
  retrieveReport(id: string): EndpointResponse<"retrieveReport">;
  uploadFiles(
    reportId: string,
    files: UploadFileArg[],
    usage: ReportFileUsage,
  ): EndpointResponse<"uploadFiles">;
  deleteFile(
    reportId: string,
    fileName: string,
  ): EndpointResponse<"deleteFile">;
  deleteFiles(
    reportId: string,
    fileNames: string[],
  ): EndpointResponse<"deleteFiles">;
}
