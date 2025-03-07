import {
  ReportFileUsage,
  ReportsContextRestContract,
  ReportUpdateDto,
} from "shared-models";

type EndpointResponse<T extends keyof ReportsContextRestContract["endpoints"]> =
  Promise<ReportsContextRestContract["endpoints"][T]["response"]>;

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
  attachFile(
    reportId: string,
    file: File,
    usage: ReportFileUsage,
  ): EndpointResponse<"attachFile">;
  deleteAttachedFile(
    reportId: string,
    fileName: string,
  ): EndpointResponse<"deleteAttachedFile">;
}
