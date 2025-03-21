import {
  ReportFileUsage,
  ReportsContextRestContract,
  ReportUpdateDto,
} from "shared-models";

export type EndpointResponse<
  T extends keyof ReportsContextRestContract["endpoints"],
> = Promise<ReportsContextRestContract["endpoints"][T]["response"]>;

export interface ReportApiClient {
  generateFileUrl(
    reportId: string,
    fileName: string,
  ): EndpointResponse<"generateFileUrl">;
  generateFileUrlEndpoint(
    reportId: string,
    fileName: string,
  ): Promise<{
    urlEndpoint: string;
    method: "GET";
  }>;
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
  uploadFile(
    reportId: string,
    file: File,
    usage: ReportFileUsage,
  ): EndpointResponse<"uploadFile">;
  deleteFile(
    reportId: string,
    fileName: string,
  ): EndpointResponse<"deleteFile">;
  deleteFiles(
    reportId: string,
    fileNames: string[],
  ): EndpointResponse<"deleteFiles">;
}
